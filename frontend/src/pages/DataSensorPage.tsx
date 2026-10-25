import React, { useState, useEffect } from 'react'
import { Pagination, selectCls, inputCls, thCls, tdCls } from '../components/common'
import { C_LIGHT, C_HUMIDITY, C_TEMP } from '../services/mockData'
import { SensorReading, SensorType } from '../types'
import { iotApiService } from '../services/api'

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
  const [committedSearchType, setCommittedSearchType] = useState<'all' | 'light' | 'humidity' | 'temp' | 'time'>('all')
  const [query, setQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [reloadKey, setReloadKey] = useState(0)

  const [items, setItems] = useState<SensorReading[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const handleSearch = () => {
    setCommittedSearchType(searchType)
    setCommittedQuery(query.trim())
    setPage(1)
  }

  // 100% Server-side Query & Pagination từ Backend (tối đa 1000 kết quả)
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    iotApiService
      .getSensorsPaged({
        page,
        limit: pageSize,
        searchType: committedSearchType,
        query: committedQuery,
        sort,
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
  }, [page, pageSize, sort, committedSearchType, committedQuery, reloadKey])

  const showFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showTo = Math.min(page * pageSize, total)

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
              // Chỉ thay đổi giá trị trong dropdown, đợi bấm nút Search mới lọc
            }}
            className={selectCls}
          >
            <option value="all">All</option>
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            placeholder=""
          />
          <button
            onClick={handleSearch}
            className="px-5 py-2 bg-[#1e2d42] hover:bg-[#00d4a8]/20 border border-[#1e2d42] hover:border-[#00d4a8]/50 text-[#94a3b8] hover:text-[#00d4a8] rounded-xl text-sm font-mono font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            title="Tải lại dữ liệu (Reload)"
            className="px-3.5 py-2 bg-[#1e2d42] hover:bg-[#334155] border border-[#1e2d42] text-[#94a3b8] hover:text-[#00d4a8] rounded-xl text-sm font-mono font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin text-[#00d4a8]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Reload</span>
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
              {items.map((f, i) => {
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
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-[#64748b] text-sm font-mono">
                    {loading ? 'Loading sensor records...' : 'No sensor records matched your query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination + count */}
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

