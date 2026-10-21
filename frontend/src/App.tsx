import React, { useState, useEffect, useRef } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import DataSensorPage from './pages/DataSensorPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SensorReading, DeviceHistory, DeviceStates } from './types'
import { iotApiService, formatFullTime } from './services/api'

export default function App() {
  // Trạng thái kết nối REST API tới Spring Boot Server
  const [isConnected, setIsConnected] = useState<boolean>(false)
  // Trạng thái truyền nhận telemetry từ phần cứng ESP32
  const [isEspOnline, setIsEspOnline] = useState<boolean>(false)
  const prevLatestTimeRef = useRef<string>('')
  const lastPacketTimeRef = useRef<number>(0)

  // Live Chart telemetry (Lấy từ CSDL và cập nhật Realtime qua REST API Polling)
  const [chartData, setChartData] = useState<{ time: string; temp: number; humidity: number; light: number }[]>([])

  // Hardware states
  const [devices, setDevices] = useState<DeviceStates>({ light: false, fan: false })
  const [pendingDevices, setPendingDevices] = useState<Record<string, boolean>>({})
  const [sensorRows, setSensorRows] = useState<SensorReading[]>([])
  const [historyLogs, setHistoryLogs] = useState<DeviceHistory[]>([])

  // Đồng bộ dữ liệu thực tế từ Spring Boot Backend & lắng nghe WebSocket Realtime
  useEffect(() => {
    // 1. Đồng bộ trạng thái thiết bị thực tế
    iotApiService.getDeviceStatus().then((res) => { // GET /api/devices/status
      if (res) setDevices(res)
    })

    // 2. Lấy 15 điểm đo mới nhất từ DB (loại bỏ trùng mốc giây nếu có)
    iotApiService.getLatestChartSensors().then((res) => {
      if (res && res.length > 0) {
        const unique = res.filter((pt, idx, arr) => idx === 0 || pt.time !== arr[idx - 1].time)
        setChartData(unique.slice(-15))
      }
    })

    // 3. Lấy dữ liệu cảm biến ban đầu cho bảng DataSensorPage từ DB (tối đa 1000 bản ghi)
    iotApiService.getSensors(1, 1000).then((res) => {
      if (res && res.length > 0) setSensorRows(res)
    })

    // 4. Lấy lịch sử bật tắt từ DB
    iotApiService.getDeviceHistoryLogs().then((res) => {
      if (res && res.length > 0) setHistoryLogs(res)
    })

    // =========================================================================
    // CƠ CHẾ HTTP POLLING THAY THẾ CHO WEBSOCKET (REST API THUẦN)
    // Cứ mỗi 2 giây, Frontend chủ động gọi các API có sẵn để lấy số liệu mới nhất
    // =========================================================================
    const pollRealtimeData = async () => {
      try {
        // A. Lấy 15 điểm đo mới nhất từ MySQL cho LiveChart & 3 Thẻ Metric
        const chartRes = await iotApiService.getLatestChartSensors()
        if (chartRes && chartRes.length > 0) {
          setIsConnected(true) // Đã kết nối thành công tới Spring Boot Server

          const unique = chartRes.filter((pt, idx, arr) => idx === 0 || pt.time !== arr[idx - 1].time)
          setChartData(unique.slice(-15))

          // Kiểm tra nhịp tim ESP32 qua mốc thời gian điểm đo:
          const latestPoint = unique[unique.length - 1]
          if (latestPoint) {
            if (latestPoint.time !== prevLatestTimeRef.current) {
              // Mốc thời gian thay đổi -> ESP32 vừa gửi số đo mới thành công
              prevLatestTimeRef.current = latestPoint.time
              lastPacketTimeRef.current = Date.now()
              setIsEspOnline(true)
            } else if (lastPacketTimeRef.current > 0 && Date.now() - lastPacketTimeRef.current > 5000) {
              // Quá 5 giây mà không có mốc thời gian đo mới -> ESP32 bị ngắt nguồn/mất mạng
              setIsEspOnline(false)
            }
          }
        } else if (chartRes === null) {
          // Server không phản hồi
          setIsConnected(false)
          setIsEspOnline(false)
        }

        // B. Lấy trạng thái thiết bị thực tế từ MySQL
        const devRes = await iotApiService.getDeviceStatus()
        if (devRes) {
          setDevices(devRes)
        }

        // C. Tự động lấy các bản ghi cảm biến mới nhất để cập nhật bảng DataSensorPage
        const recentSensors = await iotApiService.getSensors(1, 15)
        if (recentSensors && recentSensors.length > 0) {
          setSensorRows((prev) => {
            const existingIds = new Set(prev.map((r) => r.id))
            const uniqueNew = recentSensors.filter((r) => !existingIds.has(r.id))
            if (uniqueNew.length === 0) return prev
            return [...uniqueNew, ...prev].slice(0, 1000)
          })
        }
      } catch (err) {
        console.warn('[Polling] Lỗi khi làm mới dữ liệu qua API:', err)
        setIsConnected(false)
        setIsEspOnline(false)
      }
    }

    // Thiết lập chu kỳ Polling mỗi 2 giây (2000ms)
    const pollingInterval = setInterval(pollRealtimeData, 2000)

    return () => {
      clearInterval(pollingInterval)
      // disconnectWs()
      // clearInterval(watchdogInterval)
    }
  }, [])

  // Xử lý bật/tắt thiết bị: Gửi tới Spring Boot API và Polling trạng thái sau 1.2s - 2s
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

      // 3. Polling kiểm tra xác nhận sau 0.5s (thay cho DEVICE_ACK qua WebSocket)
      setTimeout(async () => {
        // Cập nhật trạng thái đèn/quạt thực tế
        const updatedStatus = await iotApiService.getDeviceStatus()
        if (updatedStatus) {
          setDevices(updatedStatus)
        }
        setPendingDevices((prev) => ({ ...prev, [key]: false }))

        // Cập nhật lại lịch sử để lấy trạng thái SUCCESS / ON / OFF thay cho PENDING
        const historyRes = await iotApiService.getDeviceHistoryLogsPaged({ page: 1, limit: 10 })
        if (historyRes && historyRes.data) {
          setHistoryLogs((prev) => {
            const updatedMap = new Map(historyRes.data.map((l) => [l.id, l]))
            return prev.map((l) => updatedMap.get(l.id) || l)
          })
        }
      }, 500)
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
