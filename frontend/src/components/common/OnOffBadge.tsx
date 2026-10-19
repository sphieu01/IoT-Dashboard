import React from 'react'
import { DeviceStatus } from '../../types'

export interface OnOffBadgeProps {
  value: DeviceStatus
  dim?: boolean // Có muốn làm mờ cái tem này đi không?
}

export default function OnOffBadge({ value, dim }: OnOffBadgeProps) {
  let base = ''
  if (value === 'ON') {
    base = 'bg-[#00d4a8]/15 text-[#009e7c] border border-[#00d4a8]/30'
  } else if (value === 'OFF') {
    base = 'bg-red-50 text-red-600 border border-red-200'
  } else if (value === 'PENDING') {
    base = 'bg-amber-50 text-amber-600 border border-amber-200'
  }

  return (
    <span
      className={`px-3 py-0.5 rounded-full text-xs font-semibold font-mono inline-flex items-center gap-1.5 ${base} ${dim ? 'opacity-50' : ''
        }`}
    >
      {value === 'PENDING' && (
        <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
      )}
      {value}
    </span>
  )
}
