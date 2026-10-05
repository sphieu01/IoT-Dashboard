import React, { useState, useEffect, useRef } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import DataSensorPage from './pages/DataSensorPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SensorReading, HistoryLog, DeviceStates } from './types'
import { INITIAL_SENSOR_ROWS, INITIAL_HISTORY_ROWS } from './services/mockData'
import { iotApiService, formatFullTime, shortTimeSec, randomTemp, randomHumidity, randomLight, generateLiveReading } from './services/api'

export default function App() {

  // Live Chart telemetry (last 15 points)
  const [chartData, setChartData] = useState(() =>
    Array.from({ length: 15 }, (_, i) => {
      const d = new Date()
      d.setSeconds(d.getSeconds() - (14 - i) * 2)
      return {
        time: shortTimeSec(d),
        temp: randomTemp(),
        humidity: randomHumidity(),
        light: randomLight(),
      }
    })
  )

  // Hardware states
  const [devices, setDevices] = useState<DeviceStates>({ light: false, fan: false })
  const [pendingDevices, setPendingDevices] = useState<Record<string, boolean>>({})
  const [sensorRows, setSensorRows] = useState<SensorReading[]>(INITIAL_SENSOR_ROWS)
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(INITIAL_HISTORY_ROWS)
  const logIdRef = useRef(INITIAL_HISTORY_ROWS.length + 1)
  const lastWsTelemetryRef = useRef<number>(Date.now())

  // Đồng bộ dữ liệu ban đầu từ Spring Boot Backend & lắng nghe WebSocket Realtime
  useEffect(() => {
    // 1. Đồng bộ trạng thái thiết bị
    iotApiService.getDeviceStatus().then((res) => {
      if (res) setDevices(res)
    })

    // 2. Lấy 15 điểm đo mới nhất từ DB
    iotApiService.getLatestChartSensors().then((res) => {
      if (res && res.length > 0) setChartData(res)
    })

    // 3. Lấy dữ liệu cảm biến cho bảng DataSensorPage
    iotApiService.getSensors(1, 90).then((res) => {
      if (res && res.length > 0) setSensorRows(res)
    })

    // 4. Lấy lịch sử bật tắt từ DB
    iotApiService.getHistoryLogs().then((res) => {
      if (res && res.length > 0) setHistoryLogs(res)
    })

    // 5. Kết nối WebSocket để nhận dữ liệu Realtime từ ESP32 & Backend
    const disconnectWs = iotApiService.connectWebSocket((msg) => {
      if (msg.type === 'SENSOR_UPDATE') {
        lastWsTelemetryRef.current = Date.now()
        const newPoint = {
          time: msg.time,
          temp: msg.temp,
          humidity: msg.humidity,
          light: msg.light,
        }
        setChartData((prev) => [...prev.slice(-14), newPoint])

        // Cập nhật dữ liệu bảng cảm biến
        const nowFullTime = formatFullTime(new Date())
        const baseId = Date.now()
        setSensorRows((prev) => [
          { id: baseId, sensorType: 'Light', value: msg.light, fullTime: nowFullTime },
          { id: baseId - 1, sensorType: 'Humidity', value: msg.humidity, fullTime: nowFullTime },
          { id: baseId - 2, sensorType: 'Temperature', value: msg.temp, fullTime: nowFullTime },
          ...prev,
        ])
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
    })

    // Fallback: nếu chưa cắm ESP32 / chưa có gói tin từ WebSocket thì mô phỏng nhẹ sau mỗi 3s
    const simulationTimer = setInterval(() => {
      if (Date.now() - lastWsTelemetryRef.current > 5000) {
        const livePoint = generateLiveReading()
        setChartData((prev) => [...prev.slice(-14), livePoint])
      }
    }, 3000)

    return () => {
      disconnectWs()
      clearInterval(simulationTimer)
    }
  }, [])

  // Xử lý bật/tắt thiết bị: Gửi tới Spring Boot API (Spring Boot gửi tiếp qua MQTT tới ESP32)
  const handleToggleDevice = async (key: string) => {
    if (pendingDevices[key]) return // Đang PENDING thì chặn click dồn

    const deviceName = key === 'light' ? 'Light' : 'Fan'
    const targetAction: 'ON' | 'OFF' = !devices[key] ? 'ON' : 'OFF'

    // 1. Bật trạng thái PENDING trên UI
    setPendingDevices((prev) => ({ ...prev, [key]: true }))

    // 2. Gửi lệnh tới Spring Boot Backend
    const serverLog = await iotApiService.toggleDevice(deviceName, targetAction)

    if (serverLog) {
      // Đã ghi nhận log PENDING từ server
      setHistoryLogs((logs) => [serverLog, ...logs.filter((l) => l.id !== serverLog.id)])
    } else {
      // Fallback nếu Backend chưa bật: tự mô phỏng sau 1.2s
      const currentLogId = logIdRef.current++
      const pendingLog: HistoryLog = {
        id: currentLogId,
        device: deviceName,
        action: targetAction,
        status: 'PENDING',
        fullTime: formatFullTime(new Date()),
      }
      setHistoryLogs((logs) => [pendingLog, ...logs])

      setTimeout(() => {
        setDevices((prev) => ({ ...prev, [key]: targetAction === 'ON' }))
        setHistoryLogs((logs) =>
          logs.map((l) =>
            l.id === currentLogId
              ? { ...l, status: targetAction, fullTime: formatFullTime(new Date()) }
              : l
          )
        )
        setPendingDevices((prev) => ({ ...prev, [key]: false }))
      }, 1200)
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
