import React from 'react'

export interface PaginationProps {
  page: number  // Trang hiện tại
  total: number
  perPage: number // Số dòng hiển thị trên mỗi trang
  onChange: (p: number) => void
}

export default function Pagination({ page, total, perPage, onChange }: PaginationProps) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null

  // Tính toán cửa sổ hiển thị trang (hiển thị tối đa 3 nút xung quanh trang hiện tại)
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
          onClick={() => onChange(Math.max(1, to))} // / Không bao giờ lùi quá trang 1
          className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#64748b] border border-[#1e2d42] hover:border-[#00d4a8]/30 hover:text-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {label}
        </button>
      ))}

      {visible.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)} // onChange(2)
          className={`w-8 h-8 rounded-lg text-xs font-mono transition-all cursor-pointer ${p === page //  nút này trùng với trang hiện tại
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
