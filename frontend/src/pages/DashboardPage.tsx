import React from 'react'
import { SensorCard } from '../components/common'
import LiveChart from '../components/dashboard/LiveChart'
import DeviceControl from '../components/dashboard/DeviceControl'
import { DeviceStates } from '../types'

interface DashboardPageProps {
  chartData: { time: string; temp: number; humidity: number; light: number; windSpeed?: number }[]
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
  // Chỉ lấy giá trị số khi cả kết nối Server VÀ phần cứng ESP32 đang trực tiếp hoạt động
  const isOnline = isConnected && isEspOnline
  const hasData = isOnline && chartData && chartData.length > 0
  const latest = hasData ? chartData[chartData.length - 1] : null

  const tempValue = isOnline && latest ? Number(latest.temp).toFixed(1) : '-'
  const humidityValue = isOnline && latest ? Number(latest.humidity).toFixed(1) : '-'
  const lightValue = isOnline && latest ? String(Math.round(latest.light)) : '-'
  const windValue = isOnline && latest && latest.windSpeed !== undefined ? Number(latest.windSpeed).toFixed(1) : '-'
  const windSpeedNum = isOnline && latest && latest.windSpeed !== undefined ? latest.windSpeed : 0

  // Ngưỡng cảnh báo: Tốc độ gió > 300 m/s -> Kích hoạt nhấp nháy giao diện
  const isWindAlert = isOnline && latest !== null && latest.windSpeed !== undefined && latest.windSpeed > 300

  return (
    <div className="flex-1 flex flex-col gap-6 min-h-0">
      {/* 4 Sensor Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        <SensorCard
          label="Light"
          value={lightValue}
          unit="LUX"
          icon="☀️"
          bg="bg-gradient-to-br from-amber-400 to-yellow-500"
        />
        <div className={`rounded-xl transition-all duration-300 ${isWindAlert ? 'ring-2 ring-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.7)]' : ''}`}>
          <SensorCard
            label="Wind Speed"
            value={windValue}
            unit="m/s"
            icon="💨"
            bg={
              isWindAlert
                ? 'bg-gradient-to-br from-rose-600 to-red-700'
                : 'bg-gradient-to-br from-cyan-500 to-teal-600'
            }
          />
        </div>
      </div>

      {/* Main Section: Chart + Device Switches + HW Alert LED */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <LiveChart data={chartData} isConnected={isConnected} isEspOnline={isEspOnline} />
        <DeviceControl
          devices={devices}
          pendingDevices={pendingDevices}
          onToggle={onToggle}
          isWindAlert={isWindAlert}
          windSpeed={windSpeedNum}
        />
      </div>
    </div>
  )
}
