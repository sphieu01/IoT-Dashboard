import React, { useState } from 'react'
import { Pagination, selectCls, inputCls, thCls, tdCls } from '../components/common'
import { C_LIGHT, C_HUMIDITY, C_TEMP } from '../services/mockData'
import { SensorReading, SensorType } from '../types'

interface DataSensorPageProps {
  rows?: SensorReading[]
}

const SENSOR_META: Record<SensorType, { unit: string; color: string }> = {
  Light: { unit: 'lux', color: C_LIGHT },
  Humidity: { unit: '%', color: C_HUMIDITY },
  Temperature: { unit: '°C', color: C_TEMP },
}

export default function DataSensorPage({ rows = [] }: DataSensorPageProps) {
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [searchType, setSearchType] = useState<'all' | 'light' | 'humidity' | 'temp' | 'time'>('all')
  const [query, setQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  // 1. Sắp xếp theo ID
  const sorted = [...rows].sort((a, b) => (sort === 'newest' ? b.id - a.id : a.id - b.id))

  // 2. Lọc theo tìm kiếm
  const filtered = sorted.filter((f) => {
    if (!committedQuery.trim()) return true
    const q = committedQuery.trim().toLowerCase()

    if (searchType === 'all') {
      return (
        f.sensorType.toLowerCase().includes(q) ||
        String(f.value).includes(q) ||
        f.fullTime.toLowerCase().includes(q)
      )
    }
    if (searchType === 'light') return f.sensorType === 'Light' && String(f.value).includes(q)
    if (searchType === 'humidity') return f.sensorType === 'Humidity' && String(f.value).includes(q)
    if (searchType === 'temp') return f.sensorType === 'Temperature' && String(f.value).includes(q)
    if (searchType === 'time') return f.fullTime.toLowerCase().includes(q)

    return true
  })

  // 3. Giới hạn chính xác: Chỉ lấy đúng số dòng theo pageSize (mặc định 8 dòng đầu ở page 1)
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const showFrom = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showTo = Math.min(page * pageSize, filtered.length)

  return (
    <div className="flex flex-col gap-5">
      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {/* Sort button */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as 'newest' | 'oldest')
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">▾</span>
        </div>

        {/* Search type */}
        <div className="relative">
          <select
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value as 'all' | 'light' | 'humidity' | 'temp' | 'time')
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="all">All Sensors</option>
            <option value="light">Light</option>
            <option value="humidity">Humidity</option>
            <option value="temp">Temperature</option>
            <option value="time">Timestamp</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">▾</span>
        </div>

        {/* Search input + Search button */}
        <div className="flex flex-1 gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Search value..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCommittedQuery(query)
                setPage(1)
              }
            }}
          />
          <button
            onClick={() => {
              setCommittedQuery(query)
              setPage(1)
            }}
            className="px-5 py-2 bg-[#1e2d42] hover:bg-[#00d4a8]/20 border border-[#1e2d42] hover:border-[#00d4a8]/50 text-[#94a3b8] hover:text-[#00d4a8] rounded-xl text-sm font-mono font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Sensor Data Table */}
      <div className="bg-[#0f1720] border border-[#1e2d42] overflow-hidden rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="bg-[#121c29]">
                <th className={thCls}>ID</th>
                <th className={thCls}>Sensor Type</th>
                <th className={thCls}>Value</th>
                <th className={thCls}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((f, i) => {
                const meta = SENSOR_META[f.sensorType] || { unit: '', color: '#fff' }
                return (
                  <tr
                    key={f.id}
                    className={`border-b border-[#1e2d42]/50 transition-colors hover:bg-[#162031] ${i % 2 !== 0 ? 'bg-[#0a1020]/40' : ''}`}
                  >
                    <td className={`${tdCls} text-[#94a3b8]`}>#{f.id}</td>
                    <td className={tdCls} style={{ color: meta.color }}>{f.sensorType}</td>
                    <td className={`${tdCls} font-semibold`} style={{ color: meta.color }}>
                      {f.value} {meta.unit}
                    </td>
                    <td className={`${tdCls} text-[#00d4a8]`}>{f.fullTime}</td>
                  </tr>
                )
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-[#64748b] text-sm font-mono">
                    No sensor records matched your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination + count */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 px-6 py-2.5 border-t border-[#1e2d42] shrink-0">
          <span className="text-xs font-mono text-[#64748b]">
            Showing {filtered.length === 0 ? '0 of 0' : `${showFrom}-${showTo} of ${filtered.length}`} records
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

          <Pagination page={page} total={filtered.length} perPage={pageSize} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

