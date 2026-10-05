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
}

export default function DashboardPage({
  chartData,
  devices,
  pendingDevices = {},
  onToggle,
}: DashboardPageProps) {
  const latest = chartData[chartData.length - 1] ?? { temp: 0, humidity: 0, light: 0 }

  return (
    <div className="flex-1 flex flex-col gap-6 min-h-0">
      {/* Sensor Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3"> {/* responsive : md = medium screen*/}
        <SensorCard
          label="Temperature"
          value={String(latest.temp)}
          unit="°C"
          icon="🌡️"
          bg="bg-gradient-to-br from-orange-500 to-amber-600" // gradient: to bottom-right
        />
        <SensorCard
          label="Humidity"
          value={String(latest.humidity)}
          unit="%"
          icon="💧"
          bg="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <SensorCard
          label="Light"
          value={String(Math.round(latest.light))}
          unit="LUX"
          icon="☀️"
          bg="bg-gradient-to-br from-amber-400 to-yellow-500"
        />
      </div>

      {/* Main Section: Chart + Device Switches */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0"> {/* responsive : lg = large screen ; flex-1: chiếm hết chỗ còn lại*/}
        <LiveChart data={chartData} />
        <DeviceControl
          devices={devices}
          pendingDevices={pendingDevices}
          onToggle={onToggle}
        />
      </div>
    </div>
  )
}
