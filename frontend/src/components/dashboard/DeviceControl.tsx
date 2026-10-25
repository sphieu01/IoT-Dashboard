import React from 'react'
import { Toggle } from '../common'
import { DEVICES_CONFIG } from '../../services/mockData'
import { DeviceStates } from '../../types'

interface DeviceControlProps {
  devices: DeviceStates
  pendingDevices?: Record<string, boolean>
  onToggle: (key: string) => void
  isWindAlert?: boolean
  windSpeed?: number
}

export default function DeviceControl({
  devices,
  pendingDevices = {},
  onToggle,
  isWindAlert = false,
}: DeviceControlProps) {
  return (
    <div className="w-full lg:w-56 flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:h-[420px]">
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
            className={`flex-1 bg-[#0f1720] border rounded-xl py-2.5 px-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-sm ${borderColor}`}
          >
            {/* 1. Icon */}
            <div
              className={`text-3xl select-none transition-all duration-300 ${isPending
                  ? 'animate-pulse'
                  : isDeviceOn
                    ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,212,168,0.4)]'
                    : 'opacity-30 grayscale'
                }`}
            >
              {d.icon}
            </div>

            {/* 2. Label */}
            <div className="text-center">
              <div className="text-sm font-semibold text-[#e2e8f0]">{d.label}</div>
            </div>

            {/* 3. Toggle Switch */}
            <Toggle
              on={isDeviceOn}
              onChange={() => !isPending && onToggle(d.key)}
              size="sm"
              loading={isPending}
            />

            {/* Status note / pending */}
            <div
              className={`text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1 h-3.5 ${isPending ? 'visible' : 'invisible'
                }`}
            >
              <svg className="animate-spin h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>PENDING...</span>
            </div>
          </div>
        )
      })}

      {/* Thẻ thứ 3: Alert LED - Tối giản hết mức có thể */}
      <div
        className={`flex-1 bg-[#0f1720] border rounded-xl py-2.5 px-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-sm ${isWindAlert
            ? 'border-rose-500/80 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
            : 'border-[#1e2d42]'
          }`}
      >
        {/* 1. Icon */}
        <div
          className={`text-3xl select-none transition-all duration-300 ${isWindAlert
              ? 'scale-110 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-bounce'
              : 'opacity-30 grayscale'
            }`}
        >
          🚨
        </div>

        {/* 2. Label */}
        <div className="text-center">
          <div className="text-sm font-semibold text-[#e2e8f0]">Alert LED</div>
        </div>

        {/* 3. Badge ON/OFF tối giản (kích thước tương đương Toggle) */}
        <div
          className={`h-6 min-w-11 px-3 inline-flex items-center justify-center rounded-full text-xs font-mono font-bold tracking-wider transition-all duration-300 ${isWindAlert
              ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-[#1e2d42] text-[#64748b]'
            }`}
        >
          {isWindAlert ? 'ON' : 'OFF'}
        </div>

      </div>
    </div>
  )
}

