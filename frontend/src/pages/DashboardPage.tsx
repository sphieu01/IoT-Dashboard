import React from 'react'
import { SensorCard } from '../components/common'
import LiveChart from '../components/dashboard/LiveChart'
import DeviceControl from '../components/dashboard/DeviceControl'
import { DeviceStates, ThresholdSettings, ExceedCounts } from '../types'

interface DashboardPageProps {
  chartData: { time: string; temp: number; humidity: number; light: number; co2?: number }[]
  devices: DeviceStates
  pendingDevices?: Record<string, boolean>
  onToggle: (key: string) => void
  isConnected?: boolean
  isEspOnline?: boolean
  thresholds: ThresholdSettings
  onUpdateThreshold: (key: keyof ThresholdSettings, val: number) => void
  exceedCounts: ExceedCounts
}

export default function DashboardPage({
  chartData,
  devices,
  pendingDevices = {},
  onToggle,
  isConnected = true,
  isEspOnline = false,
  thresholds,
  onUpdateThreshold,
  exceedCounts,
}: DashboardPageProps) {
  // Chỉ lấy giá trị số khi cả kết nối Server VÀ phần cứng ESP32 đang trực tiếp hoạt động
  const isOnline = isConnected && isEspOnline
  const hasData = isOnline && chartData && chartData.length > 0
  const latest = hasData ? chartData[chartData.length - 1] : null

  const tempValue = isOnline && latest ? Number(latest.temp).toFixed(1) : '-'
  const humidityValue = isOnline && latest ? Number(latest.humidity).toFixed(1) : '-'
  const lightValue = isOnline && latest ? String(Math.round(latest.light)) : '-'
  const co2Value = isOnline && latest ? String(Math.round(Number(latest.co2 || 400))) : '-'

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      {/* 4 Sensor Metric Cards: Nhiệt độ, Độ ẩm, Ánh sáng, CO2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <SensorCard
          label="CO2 Gas"
          value={co2Value}
          unit="ppm"
          icon="🫧"
          bg="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
      </div>

      {/* Main Section: 4 Biểu đồ riêng biệt 2x2 (bên trái) + Bảng điều khiển thiết bị & cài ngưỡng (bên phải) */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <LiveChart
          data={chartData}
          isConnected={isConnected}
          isEspOnline={isEspOnline}
          thresholds={thresholds}
          exceedCounts={exceedCounts}
        />
        <DeviceControl
          devices={devices}
          pendingDevices={pendingDevices}
          onToggle={onToggle}
          thresholds={thresholds}
          onUpdateThreshold={onUpdateThreshold}
          exceedCounts={exceedCounts}
        />
      </div>
    </div>
  )
}
