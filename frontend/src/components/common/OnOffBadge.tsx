import React from 'react'
import { DeviceStatus } from '../../types'

export interface OnOffBadgeProps {
  value: DeviceStatus
  dim?: boolean
}

export default function OnOffBadge({ value, dim }: OnOffBadgeProps) {
  let base = ''
  const valUpper = (value || '').toUpperCase()

  if (valUpper === 'SUCCESS' || valUpper === 'ON') {
    base = 'bg-[#00d4a8]/15 text-[#00d4a8] border border-[#00d4a8]/20'
  } else if (valUpper === 'FAIL' || valUpper === 'OFF') {
    base = 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
  } else if (valUpper === 'PENDING') {
    base = 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
  } else {
    base = 'bg-slate-500/15 text-slate-300 border border-slate-500/20'
  }

  return (
    <span
      className={`px-3 py-0.5 rounded-full text-xs font-semibold font-mono inline-flex items-center gap-1.5 ${base} ${
        dim ? 'opacity-50' : ''
      }`}
    >
      {valUpper === 'PENDING' && (
        <svg className="animate-spin h-2.5 w-2.5 text-amber-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {valUpper}
    </span>
  )
}
