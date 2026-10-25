import React from 'react'
import { Toggle } from '../common'
import { DEVICES_CONFIG } from '../../services/mockData'
import { DeviceStates } from '../../types'

interface DeviceControlProps {
  devices: DeviceStates
  pendingDevices?: Record<string, boolean>
  onToggle: (key: string) => void
}

export default function DeviceControl({
  devices,
  pendingDevices = {},
  onToggle,
}: DeviceControlProps) {
  return (
    <div className="w-full lg:w-60 flex flex-row lg:flex-col gap-4">
      {DEVICES_CONFIG.map((d) => { // d = từng phần tử, lần lượt:
        const isDeviceOn = devices[d.key]
        const isPending = pendingDevices[d.key]

        let borderColor = 'border-[#1e2d42]'
        if (isPending) {
          borderColor = 'border-amber-500/50 '
        } else if (isDeviceOn) {
          borderColor = 'border-[#00d4a8]/50 '
        }

        return (
          <div // border
            key={d.key}
            className={`flex-1 bg-[#0f1720] border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-md ${borderColor}`}
          >
            <div // icon
              className={`text-4xl select-none transition-all duration-300 ${isPending
                ? 'animate-pulse'
                : isDeviceOn
                  ? 'scale-110'
                  : 'opacity-30 grayscale'
                }`}
            >
              {d.icon}
            </div>

            <div className="text-center">{/* text */}
              <div className="text-sm font-semibold text-[#e2e8f0]">{d.label}</div>
            </div>

            <Toggle // switch on/off
              on={isDeviceOn}
              onChange={() => !isPending && onToggle(d.key)}
              size="lg"
              loading={isPending}
            />

            <div className={`text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 ${isPending ? 'visible' : 'invisible'}`}>
              <svg className="animate-spin h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>PENDING...</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
