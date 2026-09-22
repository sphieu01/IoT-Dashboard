import React from 'react'

export interface PaginationProps {
  page: number
  total: number
  perPage: number
  onChange: (p: number) => void
}

export default function Pagination({ page, total, perPage, onChange }: PaginationProps) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  const visible = Array.from({ length: Math.min(pages, 3) }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-1 py-5">
      {[
        { label: 'First', to: 1 },
        { label: 'Previous', to: page - 1 },
      ].map(({ label, to }) => (
        <button
          key={label}
          disabled={page === 1}
          onClick={() => onChange(Math.max(1, to))}
          className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#64748b] border border-[#1e2d42] hover:border-[#00d4a8]/30 hover:text-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {label}
        </button>
      ))}

      {visible.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-xs font-mono transition-all cursor-pointer ${
            p === page
              ? 'bg-[#00d4a8] text-[#090d13] font-bold shadow-[0_0_10px_rgba(0,212,168,0.3)]'
              : 'border border-[#1e2d42] text-[#64748b] hover:border-[#00d4a8]/30 hover:text-[#e2e8f0]'
          }`}
        >
          {p}
        </button>
      ))}

      {[
        { label: 'Next', to: page + 1 },
        { label: 'Last', to: pages },
      ].map(({ label, to }) => (
        <button
          key={label}
          disabled={page === pages}
          onClick={() => onChange(Math.min(pages, to))}
          className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#64748b] border border-[#1e2d42] hover:border-[#00d4a8]/30 hover:text-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
