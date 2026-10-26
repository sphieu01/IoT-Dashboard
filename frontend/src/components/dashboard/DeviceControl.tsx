import React from 'react'
import { Toggle } from '../common'
import { DEVICES_CONFIG } from '../../services/mockData'
import { DeviceStates } from '../../types'

interface DeviceControlProps {
  devices: DeviceStates
  pendingDevices?: Record<string, boolean>
  onToggle: (key: string) => void
  isLightAlert?: boolean
  thresholdInput?: string
  onThresholdChange?: (val: string) => void
  onThresholdSubmit?: () => void
}

export default function DeviceControl({
  devices,
  pendingDevices = {},
  onToggle,
  isLightAlert = false,
  thresholdInput = '1000',
  onThresholdChange,
  onThresholdSubmit,
}: DeviceControlProps) {
  return (
    <div className="w-full lg:w-72 flex flex-col gap-2.5 lg:h-[420px] justify-between">
      {/* 3 Đèn điều khiển (Light, Fan, Light 2) - Bố cục ngang (Icon - Tên - Toggle) */}
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
            className={`flex-1 bg-[#0f1720] border rounded-xl px-4 py-2 flex flex-row items-center justify-between gap-3 transition-all duration-300 shadow-sm ${borderColor}`}
          >
            {/* Cụm trái: Icon + Tên thiết bị + Trạng thái Pending */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`text-3xl select-none transition-all duration-300 shrink-0 ${
                  isPending
                    ? 'animate-pulse'
                    : isDeviceOn
                      ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,212,168,0.5)]'
                      : 'opacity-30 grayscale'
                }`}
              >
                {d.icon}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-[#e2e8f0] truncate">{d.label}</span>
                {isPending && (
                  <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1 animate-pulse">
                    <svg className="animate-spin h-2.5 w-2.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    PENDING...
                  </span>
                )}
              </div>
            </div>

            {/* Cụm phải: Toggle bật/tắt */}
            <div className="shrink-0">
              <Toggle
                on={isDeviceOn}
                onChange={() => !isPending && onToggle(d.key)}
                size="sm"
                loading={isPending}
              />
            </div>
          </div>
        )
      })}

      {/* Thẻ thứ 4: Alert LED - Tối giản hết mức có thể, bố cục ngang đồng bộ */}
      <div
        className={`flex-1 bg-[#0f1720] border rounded-xl px-4 py-2 flex flex-row items-center justify-between gap-3 transition-all duration-300 shadow-sm ${
          isLightAlert
            ? 'border-rose-500/80 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
            : 'border-[#1e2d42]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`text-3xl select-none transition-all duration-300 shrink-0 ${
              isLightAlert
                ? 'scale-110 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-bounce'
                : 'opacity-30 grayscale'
            }`}
          >
            🚨
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[#e2e8f0]">Alert LED</span>
          </div>
        </div>

        {/* Badge trạng thái ON/OFF tối giản */}
        <div className="shrink-0">
          <div
            className={`h-6 min-w-11 px-3 inline-flex items-center justify-center rounded-full text-xs font-mono font-bold tracking-wider transition-all duration-300 ${
              isLightAlert
                ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-[#1e2d42] text-[#64748b]'
            }`}
          >
            {isLightAlert ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>

      {/* Ô nhập ngưỡng Alert > [ ] LUX đặt ngay dưới thẻ Alert LED */}
      {onThresholdChange && (
        <div className="bg-[#0f1720] border border-[#1e2d42] rounded-xl px-3.5 py-1.5 flex items-center justify-between text-xs font-mono shadow-sm">
          <span className="text-[#94a3b8] text-[11px]">Ngưỡng cảnh báo:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold text-[11px]">Alert &gt;</span>
            <input
              type="number"
              value={thresholdInput}
              onChange={(e) => onThresholdChange(e.target.value)}
              onBlur={onThresholdSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onThresholdSubmit?.()
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              title="Nhập ngưỡng ánh sáng (LUX) để kích hoạt đèn cảnh báo"
              className="w-16 bg-[#121c29] border border-[#2d3f58] rounded px-2 py-0.5 text-amber-300 font-bold text-center focus:outline-none focus:border-amber-400 transition-colors"
            />
            <span className="text-[#64748b] text-[10px]">LUX</span>
          </div>
        </div>
      )}
    </div>
  )
}
