import React from 'react'
import { DeviceStatus } from '../../types'

export interface OnOffBadgeProps {
  value: DeviceStatus
  dim?: boolean // Có muốn làm mờ cái tem này đi không?
}

export default function OnOffBadge({ value, dim }: OnOffBadgeProps) {
  let base = ''
  if (value === 'ON') {
    base = 'bg-[#00d4a8]/15 text-[#00d4a8] border border-[#00d4a8]/20'
  } else if (value === 'OFF') {
    base = 'bg-red-500/15 text-red-400 border border-red-500/20'
  } else if (value === 'PENDING') {
    base = 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold font-mono inline-flex items-center gap-1.5 ${base} ${dim ? 'opacity-50' : ''
        }`}
    >
      {value === 'PENDING' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      {value}
    </span>
  )
}
