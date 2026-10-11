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
              on={isPending ? !isDeviceOn : isDeviceOn} // neu k pending thi giu nguyen, neu dang pending thi lay trang thai nguoc lai cua device
              onChange={() => !isPending && onToggle(d.key)}
              size="lg"
            />

            <div className={`text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 ${isPending ? 'visible' : 'invisible'}`}>
              <span>PENDING...</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
