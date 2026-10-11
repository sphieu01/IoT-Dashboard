import React, { useState, useEffect, useRef } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import DataSensorPage from './pages/DataSensorPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SensorReading, HistoryLog, DeviceStates } from './types'
import { iotApiService, formatFullTime } from './services/api'

export default function App() {
  // Trạng thái kết nối WebSocket Realtime tới Spring Boot Server
  const [isConnected, setIsConnected] = useState<boolean>(false)
  // Trạng thái truyền nhận telemetry từ phần cứng ESP32
  const [isEspOnline, setIsEspOnline] = useState<boolean>(false)
  const lastPacketTimeRef = useRef<number>(0)

  // Live Chart telemetry (Lấy từ CSDL và cập nhật Realtime qua WebSocket)
  const [chartData, setChartData] = useState<{ time: string; temp: number; humidity: number; light: number }[]>([])

  // Hardware states
  const [devices, setDevices] = useState<DeviceStates>({ light: false, fan: false })
  const [pendingDevices, setPendingDevices] = useState<Record<string, boolean>>({})
  const [sensorRows, setSensorRows] = useState<SensorReading[]>([])
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([])

  // Đồng bộ dữ liệu thực tế từ Spring Boot Backend & lắng nghe WebSocket Realtime
  useEffect(() => {
    // 1. Đồng bộ trạng thái thiết bị thực tế
    iotApiService.getDeviceStatus().then((res) => {
      if (res) setDevices(res)
    })

    // 2. Lấy 15 điểm đo mới nhất từ DB (loại bỏ trùng mốc giây nếu có)
    iotApiService.getLatestChartSensors().then((res) => {
      if (res && res.length > 0) {
        const unique = res.filter((pt, idx, arr) => idx === 0 || pt.time !== arr[idx - 1].time)
        setChartData(unique.slice(-15))
      }
    })

    // 3. Lấy dữ liệu cảm biến ban đầu cho bảng DataSensorPage từ DB
    iotApiService.getSensors(1, 100).then((res) => {
      if (res && res.length > 0) setSensorRows(res)
    })

    // 4. Lấy lịch sử bật tắt từ DB
    iotApiService.getHistoryLogs().then((res) => {
      if (res && res.length > 0) setHistoryLogs(res)
    })

    // 5. Kết nối WebSocket để nhận dữ liệu Realtime từ ESP32 & Backend
    const disconnectWs = iotApiService.connectWebSocket(
      (msg) => {
        if (msg.type === 'SENSOR_UPDATE') {
          // Ghi nhận nhịp tim: ESP32 đang trực tiếp gửi dữ liệu
          lastPacketTimeRef.current = Date.now()
          setIsEspOnline(true)

          const newPoint = {
            time: msg.time,
            temp: msg.temp,
            humidity: msg.humidity,
            light: msg.light,
          }
          setChartData((prev) => {
            // Chống trùng lặp mốc thời gian: nếu trùng mốc time với điểm cuối cùng -> cập nhật lại điểm cuối
            if (prev.length > 0 && prev[prev.length - 1].time === newPoint.time) {
              return [...prev.slice(0, -1), newPoint]
            }
            return [...prev.slice(-14), newPoint]
          })

          // Tự động nhảy dữ liệu mới vào bảng Data Sensor (100% dữ liệu thật từ MySQL, không trùng lặp)
          if (msg.records && Array.isArray(msg.records)) {
            setSensorRows((prev) => {
              const incoming = msg.records as SensorReading[]
              const existingIds = new Set(prev.map((r) => r.id))
              const uniqueNew = incoming.filter((r) => !existingIds.has(r.id))
              if (uniqueNew.length === 0) return prev
              return [...uniqueNew, ...prev].slice(0, 100)
            })
          } else {
            // Gọi API lấy dữ liệu thật mới nhất từ MySQL để không sinh ID giả hay trùng lặp
            iotApiService.getSensors(1, 100).then((res) => {
              if (res && res.length > 0) setSensorRows(res)
            })
          }
        }

        if (msg.type === 'ESP_STATUS') {
          setIsEspOnline(msg.status === 'ONLINE')
          if (msg.status === 'ONLINE') {
            lastPacketTimeRef.current = Date.now()
          }
        }

        if (msg.type === 'DEVICE_ACK') {
          const devKey = msg.device.toLowerCase()
          const isConfirmedOn = msg.status === 'ON'

          // Cập nhật trạng thái thiết bị thực tế
          setDevices((prev) => ({ ...prev, [devKey]: isConfirmedOn }))
          // Tắt cờ PENDING
          setPendingDevices((prev) => ({ ...prev, [devKey]: false }))

          // Cập nhật dòng log PENDING gần nhất thành ON / OFF
          setHistoryLogs((prev) =>
            prev.map((l) =>
              l.device.toLowerCase() === devKey && l.status === 'PENDING'
                ? { ...l, status: msg.status as 'ON' | 'OFF' }
                : l
            )
          )
        }
      },
      (connectedStatus) => {
        setIsConnected(connectedStatus)
        if (!connectedStatus) {
          setIsEspOnline(false)
        }
      }
    )

    // Watchdog kiểm tra nhịp tim (Heartbeat) của ESP32:
    // ESP32 gửi dữ liệu mỗi 2 giây. Nếu quá 5 giây không có gói tin nào -> ESP32 bị ngắt điện / mất kết nối
    const watchdogInterval = setInterval(() => {
      if (lastPacketTimeRef.current > 0 && Date.now() - lastPacketTimeRef.current > 5000) {
        setIsEspOnline(false)
      }
    }, 1000)

    return () => {
      disconnectWs()
      clearInterval(watchdogInterval)
    }
  }, [])

  // Xử lý bật/tắt thiết bị: Gửi tới Spring Boot API (Spring Boot gửi tiếp qua MQTT tới ESP32)
  const handleToggleDevice = async (key: string) => {
    if (pendingDevices[key]) return // Đang PENDING thì chặn click dồn

    const deviceName = key === 'light' ? 'Light' : 'Fan'
    const targetAction: 'ON' | 'OFF' = !devices[key] ? 'ON' : 'OFF'

    // 1. Đánh dấu thiết bị đang PENDING
    setPendingDevices((prev) => ({ ...prev, [key]: true }))

    // 2. Gửi lệnh tới Spring Boot Backend
    const serverLog = await iotApiService.toggleDevice(deviceName, targetAction)

    if (serverLog) {
      // Đã ghi nhận log PENDING từ server thật
      setHistoryLogs((logs) => [serverLog, ...logs.filter((l) => l.id !== serverLog.id)])
    } else {
      console.warn('[Device] Gọi API toggle thất bại hoặc Backend chưa phản hồi')
      setPendingDevices((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              chartData={chartData}
              devices={devices}
              pendingDevices={pendingDevices}
              onToggle={handleToggleDevice}
              isConnected={isConnected}
              isEspOnline={isEspOnline}
            />
          }
        />
        <Route path="/datasensor" element={<DataSensorPage rows={sensorRows} />} />
        <Route path="/data-sensor" element={<Navigate to="/datasensor" replace />} />
        <Route path="/history" element={<HistoryPage logs={historyLogs} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-profile" element={<Navigate to="/profile" replace />} />
        <Route path="/myprofile" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
