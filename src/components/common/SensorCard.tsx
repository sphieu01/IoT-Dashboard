import React from 'react'

export interface SensorCardProps {
  label: string
  value: string
  unit: string
  icon: string
  bg: string
}

export default function SensorCard({ label, value, unit, icon, bg }: SensorCardProps) {
  return (
    <div
      className={`${bg} rounded-2xl px-6 py-5 flex items-center gap-5 flex-1 min-w-0 shadow-lg transform transition-transform hover:-translate-y-0.5`}
    >
      <span className="text-4xl opacity-90 select-none">{icon}</span>
      <div>
        <div className="text-sm font-medium text-white/80 mb-1">{label}</div>
        <div className="text-3xl font-bold text-white font-mono tracking-tight">
          {value} <span className="text-lg font-semibold text-white/90">{unit}</span>
        </div>
      </div>
    </div>
  )
}
