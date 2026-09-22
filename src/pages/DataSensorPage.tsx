import React, { useState } from 'react'
import { Pagination, selectCls, inputCls, thCls, tdCls } from '../components/common'
import { C_LIGHT, C_HUMIDITY, C_TEMP } from '../services/mockData'
import { SensorReading } from '../types'

interface DataSensorPageProps {
  rows: SensorReading[]
}

const PER_PAGE = 10

export default function DataSensorPage({ rows }: DataSensorPageProps) {
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [searchType, setSearchType] = useState<'light' | 'humidity' | 'temp' | 'time'>('light')
  const [query, setQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = rows
    .filter((r) => {
      if (!committedQuery.trim()) return true
      const q = committedQuery.trim().toLowerCase()
      if (searchType === 'light') return String(r.light).includes(q)
      if (searchType === 'humidity') return String(r.humidity).includes(q)
      if (searchType === 'temp') return String(r.temp).includes(q)
      if (searchType === 'time') return r.fullTime.toLowerCase().includes(q)
      return true
    })
    .sort((a, b) => (sort === 'newest' ? a.id - b.id : b.id - a.id))

  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="flex flex-col gap-5">
      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center gap-3">
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
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">
            ▾
          </span>
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
            <option value="light">Search by Light</option>
            <option value="humidity">Search by Humidity</option>
            <option value="temp">Search by Temperature</option>
            <option value="time">Search by Timestamp</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">
            ▾
          </span>
        </div>

        <div className="flex flex-1 gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Enter search value or timestamp..."
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
            <thead>
              <tr className="bg-[#121c29]">
                <th className={thCls}>ID</th>
                <th className={thCls}>Light (Lux)</th>
                <th className={thCls}>Humidity (%)</th>
                <th className={thCls}>Temperature (°C)</th>
                <th className={thCls}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-[#1e2d42]/50 transition-colors hover:bg-[#162031] ${i % 2 !== 0 ? 'bg-[#0a1020]/40' : ''
                    }`}
                >
                  <td className={`${tdCls} text-[#94a3b8]`}>#{r.id}</td>
                  <td className={tdCls} style={{ color: C_LIGHT }}>
                    {r.light}
                  </td>
                  <td className={tdCls} style={{ color: C_HUMIDITY }}>
                    {r.humidity}%
                  </td>
                  <td className={tdCls} style={{ color: C_TEMP }}>
                    {r.temp}°C
                  </td>
                  <td className={`${tdCls} text-[#00d4a8]`}>{r.fullTime}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#64748b] text-sm font-mono">
                    No sensor records matched your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
      </div>
    </div>
  )
}
