import React from 'react'

export interface PaginationProps {
  page: number  // Trang hiện tại
  total: number
  perPage: number // Số dòng hiển thị trên mỗi trang
  onChange: (p: number) => void
}

export default function Pagination({ page, total, perPage, onChange }: PaginationProps) {
  const pages = Math.ceil(total / perPage) // 35 / 8 = 4.375 => 5
  if (pages <= 1) return null

  // Tính toán cửa sổ hiển thị trang (hiển thị tối đa 3 nút xung quanh trang hiện tại)
  // đang trang 5: start = 4, end = 6 → hiển thị mảng [4, 5, 6]
  let start = Math.max(1, page - 1)
  let end = Math.min(pages, page + 1)

  // Điều chỉnh nếu đang ở trang đầu hoặc trang cuối
  if (page === 1) end = Math.min(pages, 3)
  if (page === pages) start = Math.max(1, pages - 2)

  const visible = []
  for (let i = start; i <= end; i++) {
    visible.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-1 py-2">
      {[
        { label: 'First', to: 1 },
        { label: 'Previous', to: page - 1 },
      ].map(({ label, to }) => (
        <button
          key={label}
          disabled={page === 1}
          onClick={() => onChange(Math.max(1, to))}
          className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 bg-white border border-slate-200 hover:border-[#00d4a8]/50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        >
          {label}
        </button>
      ))}

      {visible.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-xs font-mono transition-all cursor-pointer ${p === page
            ? 'bg-[#00d4a8] text-white font-bold shadow-sm'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-[#00d4a8]/50 hover:text-slate-900 shadow-sm'
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
          className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 bg-white border border-slate-200 hover:border-[#00d4a8]/50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
