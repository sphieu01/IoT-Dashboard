import React from 'react'

export interface ToggleProps {
  on: boolean
  onChange: () => void
  size?: 'sm' | 'lg' // không truyền → dùng mặc định 'sm'
}

export default function Toggle({ on, onChange, size = 'sm' }: ToggleProps) { //  nếu không truyền size → dùng 'sm'
  const track = size === 'lg' ? 'h-8 w-16' : 'h-6 w-11' // ranh truot
  const thumb = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4' // cham tron
  const tx =
    size === 'lg'
      ? on
        ? 'translate-x-9'
        : 'translate-x-1'
      : on
        ? 'translate-x-6'
        : 'translate-x-1'

  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`relative inline-flex ${track} shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${on ? 'bg-[#00d4a8]' : 'bg-[#1e2d42]'
        }`}// ranh truot
    >
      <span // cham tron
        className={`inline-block ${thumb} rounded-full bg-white shadow transition-transform duration-200 ${tx}`}
      />
    </button>
  )
}
