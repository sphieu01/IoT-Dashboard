import React from 'react'
import { Toggle } from '../common'
import { DEVICES_CONFIG } from '../../services/mockData'
import { DeviceStates, ThresholdSettings, ExceedCounts } from '../../types'

interface DeviceControlProps {
  devices: DeviceStates
  pendingDevices?: Record<string, boolean>
  onToggle: (key: string) => void
  thresholds: ThresholdSettings
  onUpdateThreshold: (key: keyof ThresholdSettings, val: number) => void
  exceedCounts: ExceedCounts
}

export default function DeviceControl({
  devices,
  pendingDevices = {},
  onToggle,
  thresholds,
  onUpdateThreshold,
  exceedCounts,
}: DeviceControlProps) {
  const sensorThresholdConfig: {
    key: keyof ThresholdSettings
    countKey: keyof ExceedCounts
    label: string
    icon: string
    unit: string
    step: number
  }[] = [
    { key: 'temp', countKey: 'temperature', label: 'Nhiệt độ', icon: '🌡️', unit: '°C', step: 1 },
    { key: 'humidity', countKey: 'humidity', label: 'Độ ẩm', icon: '💧', unit: '%', step: 1 },
    { key: 'light', countKey: 'light', label: 'Ánh sáng', icon: '☀️', unit: 'Lux', step: 50 },
    { key: 'co2', countKey: 'co2', label: 'CO2', icon: '☁️', unit: 'ppm', step: 50 },
  ]

  return (
    <div className="w-full lg:w-80 flex flex-col gap-2.5">
      {/* 2 Thiết bị: Light và Fan (Bố cục ngang: Icon - Tên - Toggle) */}
      {DEVICES_CONFIG.map((d) => {
        const isDeviceOn = devices[d.key]
        const isPending = pendingDevices[d.key]

        let borderColor = 'border-[#1e2d42]'
        if (isPending) {
          borderColor = 'border-amber-500/50'
        } else if (isDeviceOn) {
          borderColor = 'border-[#00d4a8]/50'
        }

        return (
          <div
            key={d.key}
            className={`bg-[#0f1720] border rounded-xl p-3 flex items-center justify-between transition-all duration-300 shadow-md ${borderColor}`}
          >
            {/* Trái: Icon & Tên thiết bị theo hàng ngang */}
            <div className="flex items-center gap-3">
              <div
                className={`text-2xl select-none transition-all duration-300 ${
                  isPending
                    ? 'animate-pulse'
                    : isDeviceOn
                    ? 'scale-110'
                    : 'opacity-40 grayscale'
                }`}
              >
                {d.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#e2e8f0]">{d.label}</div>
                {isPending ? (
                  <div className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                    <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>PENDING...</span>
                  </div>
                ) : (
                  <span className={`text-[10px] font-mono ${isDeviceOn ? 'text-[#00d4a8]' : 'text-[#64748b]'}`}>
                    {isDeviceOn ? 'HOẠT ĐỘNG' : 'ĐANG TẮT'}
                  </span>
                )}
              </div>
            </div>

            {/* Phải: Toggle */}
            <Toggle
              on={isDeviceOn}
              onChange={() => !isPending && onToggle(d.key)}
              size="md"
              loading={isPending}
            />
          </div>
        )
      })}

      {/* Thẻ thứ 3: Cài đặt 4 ngưỡng & Đếm số lần vượt ngưỡng (Tối giản, 4 dấu > thẳng hàng tuyệt đối) */}
      <div className="bg-[#0f1720] border border-[#1e2d42] rounded-xl p-3 shadow-md flex flex-col gap-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#1e2d42]">
          <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
            <span>⚙️ Cài đặt 4 Ngưỡng</span>
          </div>
          <span className="text-[10px] font-mono text-[#64748b]">Số lần vượt</span>
        </div>

        <div className="flex flex-col gap-2">
          {sensorThresholdConfig.map((item) => {
            const count = exceedCounts[item.countKey] || 0
            const isExceeded = count > 0

            return (
              <div
                key={item.key}
                className="flex items-center p-2 bg-[#0a0f18] border border-[#1a2636] rounded-lg text-xs gap-1.5"
              >
                {/* Cột 1: Icon & Tên cảm biến (Độ rộng cố định 82px) */}
                <div className="flex items-center gap-1.5 w-[82px] shrink-0">
                  <span className="text-sm select-none">{item.icon}</span>
                  <span className="text-[#cbd5e1] font-medium text-xs truncate">{item.label}</span>
                </div>

                {/* Cột 2: Dấu > (Độ rộng cố định, CĂN THẲNG HÀNG 100%) */}
                <span className="text-[#64748b] text-xs font-mono font-bold w-3 text-center shrink-0">&gt;</span>

                {/* Cột 3: Input nhập ngưỡng */}
                <input
                  type="number"
                  step={item.step}
                  value={thresholds[item.key]}
                  onChange={(e) => onUpdateThreshold(item.key, Number(e.target.value) || 0)}
                  className="w-14 px-1 py-0.5 bg-[#141e2c] border border-[#26374d] rounded text-white text-right font-mono text-xs focus:outline-none focus:border-[#00d4a8] shrink-0"
                />

                {/* Cột 4: Đơn vị (Độ rộng cố định 28px) */}
                <span className="text-[10px] font-mono text-[#94a3b8] w-7 shrink-0 pl-1">{item.unit}</span>

                {/* Cột 5: Badge số lần vượt (Đẩy về sát mép phải ml-auto) */}
                <div
                  className={`ml-auto px-2 py-0.5 rounded font-mono text-center shrink-0 ${
                    isExceeded
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-[#141e2c] text-[#64748b] border border-[#1e2d42]'
                  }`}
                  title={`Số lần ${item.label} vượt ngưỡng`}
                >
                  <div className="text-[11px] font-bold leading-tight">{count}</div>
                  <div className="text-[9px] opacity-75 leading-tight">lần</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
