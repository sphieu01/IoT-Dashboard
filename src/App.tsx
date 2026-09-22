import React, { useState, useEffect, useRef } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import DataSensorPage from './pages/DataSensorPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import { PageTab, SensorReading, HistoryLog, DeviceStates } from './types'
import { INITIAL_SENSOR_ROWS, INITIAL_HISTORY_ROWS } from './services/mockData'
import { generateLiveReading, formatFullTime, shortTimeSec, randomTemp, randomHumidity, randomLight } from './services/api'

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageTab>('dashboard')

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
  const [pendingDevices, setPendingDevices] = useState<Record<string, boolean>>({}) // Click bật đèn → pendingDevices = { light: true } (1.2 giây sau) → pendingDevices = { light: false }  ← xong
  const [sensorRows] = useState<SensorReading[]>(INITIAL_SENSOR_ROWS)
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(INITIAL_HISTORY_ROWS)
  const logIdRef = useRef(INITIAL_HISTORY_ROWS.length + 1)

  // Periodic sensor telemetry stream simulation (every 2 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const livePoint = generateLiveReading()
      setChartData((prev) => [...prev.slice(-14), livePoint]) // ↑ giữ 14 cái cuối + thêm 1 cái mới = 15
    }, 2000) // 2s 1 lần

    return () => clearInterval(timer)
  }, [])

  // Toggle device handler with hardware delay & PENDING state logging
  const handleToggleDevice = (key: string) => {
    // If device is already pending ACK, ignore extra clicks
    if (pendingDevices[key]) return

    const deviceName = key === 'light' ? 'Light' : 'Fan'
    const targetAction: 'ON' | 'OFF' = !devices[key] ? 'ON' : 'OFF'
    const currentLogId = logIdRef.current++

    // 1. Mark device as PENDING
    setPendingDevices((prev) => ({ ...prev, [key]: true }))

    // 2. Ghi nhận log trạng thái PENDING ngay lập tức vào DB/History
    const pendingLog: HistoryLog = {
      id: currentLogId,
      device: deviceName,
      action: targetAction,
      status: 'PENDING',
      fullTime: formatFullTime(new Date()),
    }
    setHistoryLogs((logs) => [pendingLog, ...logs])

    // 3. Mô phỏng độ trễ truyền gói tin mạng / vi điều khiển ACK (sau 1.2s mới hoàn tất chuyển trạng thái)
    setTimeout(() => {
      // Cập nhật trạng thái thiết bị thực tế
      setDevices((prev) => ({ ...prev, [key]: targetAction === 'ON' }))

      // Cập nhật trạng thái log từ PENDING sang kết quả xác nhận (ON/OFF)
      setHistoryLogs((logs) =>
        logs.map((l) =>
          l.id === currentLogId
            ? {
              ...l,
              status: targetAction,
              fullTime: formatFullTime(new Date()),
            }
            : l
        )
      )

      // Xóa cờ PENDING
      setPendingDevices((prev) => ({ ...prev, [key]: false })) // tat pending o toggle
    }, 1200)
  }

  return (
    <Layout currentPage={currentPage} onSelectPage={setCurrentPage}>
      {currentPage === 'dashboard' && (
        <DashboardPage
          chartData={chartData}
          devices={devices}
          pendingDevices={pendingDevices}
          onToggle={handleToggleDevice}
        />
      )}
      {currentPage === 'data-sensor' && <DataSensorPage rows={sensorRows} />}
      {currentPage === 'history' && <HistoryPage logs={historyLogs} />}
      {currentPage === 'my-profile' && <ProfilePage />}
    </Layout>
  )
}
