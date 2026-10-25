import React from 'react'

export interface ToggleProps {
  on: boolean
  onChange: () => void
  size?: 'sm' | 'lg'
  loading?: boolean
}

export default function Toggle({ on, onChange, size = 'sm', loading = false }: ToggleProps) {
  const track = size === 'lg' ? 'h-8 w-16' : 'h-6 w-11'
  const thumb = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
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
      disabled={loading}
      className={`relative inline-flex ${track} shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${
        on ? 'bg-[#00d4a8]' : 'bg-[#1e2d42]'
      } ${loading ? 'cursor-wait opacity-90' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-flex items-center justify-center ${thumb} rounded-full bg-white shadow transition-transform duration-200 ${tx}`}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5 text-amber-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </span>
    </button>
  )
}
