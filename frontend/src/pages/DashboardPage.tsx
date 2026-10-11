import React from 'react'
import { SensorCard } from '../components/common'
import LiveChart from '../components/dashboard/LiveChart'
import DeviceControl from '../components/dashboard/DeviceControl'
import { DeviceStates } from '../types'

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
  // Chỉ lấy giá trị số khi cả kết nối Server VÀ phần cứng ESP32 đang trực tiếp hoạt động
  const isOnline = isConnected && isEspOnline
  const hasData = isOnline && chartData && chartData.length > 0
  const latest = hasData ? chartData[chartData.length - 1] : null

  const tempValue = isOnline && latest ? String(latest.temp) : '-'
  const humidityValue = isOnline && latest ? String(latest.humidity) : '-'
  const lightValue = isOnline && latest ? String(Math.round(latest.light)) : '-'

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
        <SensorCard
          label="Light"
          value={lightValue}
          unit="LUX"
          icon="☀️"
          bg="bg-gradient-to-br from-amber-400 to-yellow-500"
        />
      </div>

      {/* Main Section: Chart + Device Switches */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <LiveChart data={chartData} isConnected={isConnected} isEspOnline={isEspOnline} />
        <DeviceControl
          devices={devices}
          pendingDevices={pendingDevices}
          onToggle={onToggle}
        />
      </div>
    </div>
  )
}
