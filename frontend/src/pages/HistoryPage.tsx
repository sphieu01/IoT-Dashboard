import React, { useState } from 'react'
import { Pagination, OnOffBadge, selectCls, inputCls, thCls, tdCls } from '../components/common'
import { HistoryLog } from '../types'

interface HistoryPageProps {
  logs: HistoryLog[]
}

const PER_PAGE = 10

export default function HistoryPage({ logs }: HistoryPageProps) {
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeQuery, setTimeQuery] = useState('')
  const [committedTimeQuery, setCommittedTimeQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = logs.filter((l) => {
    if (deviceFilter !== 'all' && l.device !== deviceFilter) return false
    if (actionFilter !== 'all' && l.action !== actionFilter) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (committedTimeQuery && !l.fullTime.toLowerCase().includes(committedTimeQuery.toLowerCase().trim()))
      return false
    return true
  })

  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="flex flex-col gap-5">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
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
      <div className="bg-[#0f1720] border border-[#1e2d42] rounded-2xl overflow-hidden shadow-xl">
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
              {pageRows.map((l, i) => {
                const mismatch = l.action !== l.status && l.status !== 'PENDING'
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
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#64748b] text-sm font-mono">
                    No history logs matched your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-2 border-t border-[#1e2d42] shrink-0">
          <span className="text-xs font-mono text-[#64748b]">
            Showing {pageRows.length} values of {filtered.length}
          </span>
          <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}
