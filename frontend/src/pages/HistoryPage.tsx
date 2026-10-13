import React, { useState, useEffect } from 'react'
import { Pagination, OnOffBadge, selectCls, inputCls, thCls, tdCls } from '../components/common'
import { DeviceHistory } from '../types'
import { iotApiService } from '../services/api'

interface HistoryPageProps {
  logs?: DeviceHistory[]
}

export default function HistoryPage({ logs = [] }: HistoryPageProps) {
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeQuery, setTimeQuery] = useState('')
  const [committedTimeQuery, setCommittedTimeQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  const [items, setItems] = useState<DeviceHistory[]>(logs)
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  // 100% Server-side Query & Pagination từ Backend (tối đa 1000 kết quả)
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    iotApiService
      .getDeviceHistoryLogsPaged({
        device: deviceFilter,
        action: actionFilter,
        status: statusFilter,
        query: committedTimeQuery,
        page,
        limit: pageSize,
      })
      .then((res) => {
        if (!isMounted) return
        setLoading(false)
        if (res) {
          setItems(res.data)
          setTotal(res.total)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [deviceFilter, actionFilter, statusFilter, committedTimeQuery, page, pageSize])

  // Khi ở trang 1 và không có bộ lọc/tìm kiếm: tự động cập nhật Realtime khi có lịch sử mới
  useEffect(() => {
    if (page === 1 && deviceFilter === 'all' && actionFilter === 'all' && statusFilter === 'all' && !committedTimeQuery) {
      if (logs && logs.length > 0) {
        setItems(logs.slice(0, pageSize))
        setTotal(logs.length)
      }
    }
  }, [logs, page, deviceFilter, actionFilter, statusFilter, committedTimeQuery, pageSize])

  const showFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showTo = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-5">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* All devices */}
        <div className="relative">
          <select
            value={deviceFilter}
            onChange={(e) => {
              setDeviceFilter(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="all">All Devices</option>
            <option value="Light">Light</option>
            <option value="Fan">Fan</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">
            ▾
          </span>
        </div>

        {/* All actions */}
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="all">All Actions</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">
            ▾
          </span>
        </div>

        {/* All status */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="all">All Status</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
            <option value="PENDING">PENDING</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">
            ▾
          </span>
        </div>

        {/* Search time */}
        <div className="flex flex-1 gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="HH:mm DD/MM/YYYY"
            value={timeQuery}
            onChange={(e) => setTimeQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCommittedTimeQuery(timeQuery)
                setPage(1)
              }
            }}
          />
          <button
            onClick={() => {
              setCommittedTimeQuery(timeQuery)
              setPage(1)
            }}
            className="px-4 py-2 bg-[#1e2d42] hover:bg-[#00d4a8]/20 border border-[#1e2d42] hover:border-[#00d4a8]/50 text-[#94a3b8] hover:text-[#00d4a8] rounded-xl text-sm font-mono font-semibold transition-all duration-200 whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>



      {/* History Log Table */}
      <div className="bg-[#0f1720] border border-[#1e2d42] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#121c29]">
                <th className={thCls}>ID</th>
                <th className={thCls}>Device</th>
                <th className={thCls}>Action</th>
                <th className={thCls}>Device Status</th>
                <th className={thCls}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => {
                return (
                  <tr
                    key={l.id}
                    className={`border-b border-[#1e2d42]/50 transition-colors hover:bg-[#162031] ${i % 2 !== 0 ? 'bg-[#0a1020]/40' : ''
                      }`}
                  >
                    <td className={`${tdCls} text-[#94a3b8]`}>#{l.id}</td>
                    <td className={`${tdCls} text-[#e2e8f0] font-medium`}>{l.device}</td>
                    <td className={tdCls}>
                      <OnOffBadge value={l.action} />
                    </td>
                    <td className={tdCls}>
                      <OnOffBadge value={l.status} />
                    </td>
                    <td className={`${tdCls} text-[#00d4a8]`}>{l.fullTime}</td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#64748b] text-sm font-mono">
                    {loading ? 'Loading history logs...' : 'No history logs matched your filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 px-6 py-2.5 border-t border-[#1e2d42] shrink-0">
          <span className="text-xs font-mono text-[#64748b]">
            Showing {total === 0 ? '0 of 0' : `${showFrom}-${showTo} of ${total}`} records
          </span>

          <div className="flex items-center gap-2 text-xs font-mono text-[#64748b]">
            <span>Rows per page:</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-[#090d13] border border-[#1e2d42] rounded-lg px-2.5 py-1 text-xs text-[#e2e8f0] font-mono focus:outline-none focus:border-[#00d4a8] transition-colors appearance-none pr-6 cursor-pointer"
              >
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] text-[10px]">▾</span>
            </div>
          </div>

          <Pagination page={page} total={total} perPage={pageSize} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}
