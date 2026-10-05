import React, { useState } from 'react'
import { Pagination, selectCls, inputCls, thCls, tdCls } from '../components/common'
import { C_LIGHT, C_HUMIDITY, C_TEMP } from '../services/mockData'
import { SensorReading, SensorType } from '../types'

interface DataSensorPageProps {
  rows: SensorReading[]
}

const PER_PAGE = 10

const SENSOR_META: Record<SensorType, { unit: string; color: string }> = {
  Light: { unit: 'lux', color: C_LIGHT },
  Humidity: { unit: '%', color: C_HUMIDITY },
  Temperature: { unit: '°C', color: C_TEMP },
}

export default function DataSensorPage({ rows }: DataSensorPageProps) {
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [searchType, setSearchType] = useState<'light' | 'humidity' | 'temp' | 'time'>('light')
  const [query, setQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [page, setPage] = useState(1)

  const sorted = [...rows].sort((a, b) => (sort === 'newest' ? b.id - a.id : a.id - b.id))

  const filtered = sorted.filter((f) => {
    // Nếu chưa nhập gì vào ô search -> không lọc, hiển thị tất cả
    if (!committedQuery.trim()) return true
    
    const q = committedQuery.trim().toLowerCase()
    
    // Khi có nhập text -> mới bắt đầu lọc theo loại và theo giá trị
    if (searchType === 'light') return f.sensorType === 'Light' && String(f.value).includes(q)
    if (searchType === 'humidity') return f.sensorType === 'Humidity' && String(f.value).includes(q)
    if (searchType === 'temp') return f.sensorType === 'Temperature' && String(f.value).includes(q)
    if (searchType === 'time') return f.fullTime.toLowerCase().includes(q)
    
    return true
  })

  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const showFrom = filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1
  const showTo = Math.min(page * PER_PAGE, filtered.length)

  return (
    <div className="flex flex-col gap-5">
      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
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

        <div className="relative">
          <select
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value as 'light' | 'humidity' | 'temp' | 'time')
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="light">Light</option>
            <option value="humidity">Humidity</option>
            <option value="temp">Temperature</option>
            <option value="time">Timestamp</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">▾</span>
        </div>

        <div className="flex flex-1 gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Enter search value"
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
            className="px-4 py-2 bg-[#1e2d42] hover:bg-[#00d4a8]/20 border border-[#1e2d42] hover:border-[#00d4a8]/50 text-[#94a3b8] hover:text-[#00d4a8] rounded-xl text-sm font-mono font-semibold transition-all duration-200 whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* Sensor Data Table */}
      <div className="bg-[#0f1720] border border-[#1e2d42] rounded-2xl overflow-hidden shadow-xl">
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
                const meta = SENSOR_META[f.sensorType]
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

