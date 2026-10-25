import React, { useState, useEffect, useRef } from 'react'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import DataSensorPage from './pages/DataSensorPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import AlertChartPage from './pages/AlertChartPage'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SensorReading, DeviceHistory, DeviceStates } from './types'
import { iotApiService } from './services/api'

export default function App() {
  // Trạng thái Đăng nhập & Xác thực (Auth)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('iot_token'))
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const raw = localStorage.getItem('iot_user')
    return raw ? JSON.parse(raw) : null
  })

  // Trạng thái kết nối REST API tới Spring Boot Server
  const [isConnected, setIsConnected] = useState<boolean>(false)
  // Trạng thái truyền nhận telemetry từ phần cứng ESP32
  const [isEspOnline, setIsEspOnline] = useState<boolean>(false)
  const prevLatestTimeRef = useRef<string>('')
  const lastPacketTimeRef = useRef<number>(0)

  // Live Chart telemetry (Lấy từ CSDL và cập nhật Realtime qua REST API Polling)
  const [chartData, setChartData] = useState<{ time: string; temp: number; humidity: number; light: number; windSpeed?: number }[]>([])

  // Hardware states
  const [devices, setDevices] = useState<DeviceStates>({ light: false, fan: false })
  const [pendingDevices, setPendingDevices] = useState<Record<string, boolean>>({})
  const [sensorRows, setSensorRows] = useState<SensorReading[]>([])
  const [historyLogs, setHistoryLogs] = useState<DeviceHistory[]>([])

  const handleLoginSuccess = (newToken: string, userData: any) => {
    setToken(newToken)
    setCurrentUser(userData)
  }

  const handleLogout = () => {
    iotApiService.logout()
    setToken(null)
    setCurrentUser(null)
  }

  // Lắng nghe sự kiện token hết hạn hoặc unauthorized
  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  // Đồng bộ dữ liệu thực tế từ Spring Boot Backend & Polling Realtime
  useEffect(() => {
    if (!token) return

    // 1. Đồng bộ trạng thái thiết bị thực tế
    iotApiService.getDeviceStatus().then((res) => {
      if (res) setDevices(res)
    })

    // 2. Lấy 15 điểm đo mới nhất từ DB
    iotApiService.getLatestChartSensors().then((res) => {
      if (res && res.length > 0) {
        const unique = res.filter((pt, idx, arr) => idx === 0 || pt.time !== arr[idx - 1].time)
        setChartData(unique.slice(-15))
      }
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
              prevLatestTimeRef.current = latestPoint.time
              lastPacketTimeRef.current = Date.now()
              setIsEspOnline(true)
            } else if (lastPacketTimeRef.current > 0 && Date.now() - lastPacketTimeRef.current > 5000) {
              setIsEspOnline(false)
            }
          }
        } else if (chartRes === null) {
          setIsConnected(false)
          setIsEspOnline(false)
        }

        // B. Lấy trạng thái thiết bị thực tế từ MySQL
        const devRes = await iotApiService.getDeviceStatus()
        if (devRes) {
          setDevices(devRes)
        }
      } catch (err) {
        console.warn('[Polling] Lỗi khi làm mới dữ liệu qua API:', err)
        setIsConnected(false)
        setIsEspOnline(false)
      }
    }

    const pollingInterval = setInterval(pollRealtimeData, 2000)

    return () => {
      clearInterval(pollingInterval)
    }
  }, [token])

  // Xử lý bật/tắt thiết bị: Gửi tới Spring Boot API và Polling trạng thái sau 0.5s
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

      // 3. Polling kiểm tra xác nhận tối đa 5 giây (mỗi 500ms kiểm tra 1 lần)
      let elapsedMs = 0
      const checkInterval = setInterval(async () => {
        elapsedMs += 500
        const updatedStatus = await iotApiService.getDeviceStatus()
        const isTargetReached = updatedStatus && updatedStatus[key] === (targetAction === 'ON')

        if (isTargetReached || elapsedMs >= 5000) {
          clearInterval(checkInterval)
          if (updatedStatus) {
            setDevices(updatedStatus)
          }
          setPendingDevices((prev) => ({ ...prev, [key]: false }))

          // Cập nhật lại lịch sử (nếu thành công -> SUCCESS, nếu quá 5s -> FAIL)
          const historyRes = await iotApiService.getDeviceHistoryLogsPaged({ page: 1, limit: 10 })
          if (historyRes && historyRes.data) {
            setHistoryLogs((prev) => {
              const updatedMap = new Map(historyRes.data.map((l) => [l.id, l]))
              return prev.map((l) => updatedMap.get(l.id) || l)
            })
          }
        }
      }, 500)
    } else {
      console.warn('[Device] Gọi API toggle thất bại hoặc Backend chưa phản hồi')
      setPendingDevices((prev) => ({ ...prev, [key]: false }))
    }
  }

  // Nếu chưa đăng nhập -> Hiển thị màn hình Login
  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Layout currentUser={currentUser} onLogout={handleLogout}>
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
        <Route path="/datasensor" element={<DataSensorPage />} />
        <Route path="/data-sensor" element={<Navigate to="/datasensor" replace />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/alerts" element={<AlertChartPage />} />
        <Route path="/monthly-alerts" element={<Navigate to="/alerts" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-profile" element={<Navigate to="/profile" replace />} />
        <Route path="/myprofile" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
