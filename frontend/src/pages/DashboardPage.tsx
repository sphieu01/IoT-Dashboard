import React, { useState, useEffect } from 'react'
import { SensorCard } from '../components/common'
import LiveChart from '../components/dashboard/LiveChart'
import DeviceControl from '../components/dashboard/DeviceControl'
import { DeviceStates } from '../types'
import { iotApiService } from '../services/api'

interface DashboardPageProps {
  chartData: { time: string; temp: number; humidity: number; light: number }[]
  devices: DeviceStates
  pendingDevices?: Record<string, boolean>
  onToggle: (key: string) => void
  isConnected?: boolean
  isEspOnline?: boolean
}

export default function DashboardPage({
  chartData,
  devices,
  pendingDevices = {},
  onToggle,
  isConnected = true,
  isEspOnline = false,
}: DashboardPageProps) {
  // Ngưỡng ánh sáng x do người dùng tự nhập (mặc định 1000 LUX)
  const [thresholdInput, setThresholdInput] = useState<string>(() => {
    return localStorage.getItem('light_alert_threshold') || '1000'
  })
  const [lightThreshold, setLightThreshold] = useState<number>(() => {
    return Number(localStorage.getItem('light_alert_threshold')) || 1000
  })

  // Đồng bộ ngưỡng từ Backend khi mở trang
  useEffect(() => {
    iotApiService.getLightThreshold().then((val) => {
      if (val && val > 0) {
        setLightThreshold(val)
        setThresholdInput(String(val))
        localStorage.setItem('light_alert_threshold', String(val))
      }
    })
  }, [])

  // Xử lý khi người dùng đổi ngưỡng x
  const handleUpdateThreshold = () => {
    const val = Number(thresholdInput)
    if (!isNaN(val) && val >= 0) {
      setLightThreshold(val)
      localStorage.setItem('light_alert_threshold', String(val))
      iotApiService.setLightThreshold(val)
    } else {
      setThresholdInput(String(lightThreshold))
    }
  }

  // Chỉ lấy giá trị số khi cả kết nối Server VÀ phần cứng ESP32 đang trực tiếp hoạt động
  const isOnline = isConnected && isEspOnline
  const hasData = isOnline && chartData && chartData.length > 0
  const latest = hasData ? chartData[chartData.length - 1] : null

  const tempValue = isOnline && latest ? Number(latest.temp).toFixed(1) : '-'
  const humidityValue = isOnline && latest ? Number(latest.humidity).toFixed(1) : '-'
  const lightNum = isOnline && latest ? Math.round(latest.light) : 0
  const lightValue = isOnline && latest ? String(lightNum) : '-'

  // Điều kiện kích hoạt cảnh báo: khi ánh sáng > x (người dùng tự nhập)
  const isLightAlert = isOnline && latest !== null && lightNum > lightThreshold

  return (
    <div className="flex-1 flex flex-col gap-6 min-h-0">
      {/* Sensor Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SensorCard
          label="Temperature"
          value={tempValue}
          unit="°C"
          icon="🌡️"
          bg="bg-gradient-to-br from-orange-500 to-amber-600"
        />
        <SensorCard
          label="Humidity"
          value={humidityValue}
          unit="%"
          icon="💧"
          bg="bg-gradient-to-br from-blue-500 to-indigo-600"
        />

        {/* Thẻ Ánh sáng: Nhấp nháy giao diện khi ánh sáng > x */}
        <div
          className={`rounded-xl transition-all duration-300 ${
            isLightAlert
              ? 'ring-2 ring-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.7)]'
              : ''
          }`}
        >
          <SensorCard
            label="Light"
            value={lightValue}
            unit="LUX"
            icon="☀️"
            bg={
              isLightAlert
                ? 'bg-gradient-to-br from-rose-600 to-red-700'
                : 'bg-gradient-to-br from-amber-400 to-yellow-500'
            }
          />
        </div>
      </div>

      {/* Main Section: Chart + 4 Device Controls */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <LiveChart data={chartData} isConnected={isConnected} isEspOnline={isEspOnline} />
        <DeviceControl
          devices={devices}
          pendingDevices={pendingDevices}
          onToggle={onToggle}
          isLightAlert={isLightAlert}
          thresholdInput={thresholdInput}
          onThresholdChange={setThresholdInput}
          onThresholdSubmit={handleUpdateThreshold}
        />
      </div>
    </div>
  )
}
