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
  const [query, setQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  const [items, setItems] = useState<SensorReading[]>(rows)
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  // 100% Server-side Query & Pagination từ Backend (tối đa 1000 kết quả)
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    iotApiService
      .getSensorsPaged({
        page,
        limit: pageSize,
        searchType,
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
  }, [page, pageSize, sort, searchType, committedQuery])

  // Khi ở trang 1 và không có bộ lọc/tìm kiếm: tự động cập nhật Realtime khi có dữ liệu mới từ WebSocket
  useEffect(() => {
    if (page === 1 && sort === 'newest' && searchType === 'all' && !committedQuery) {
      if (rows && rows.length > 0) {
        setItems(rows.slice(0, pageSize))
        setTotal(rows.length)
      }
    }
  }, [rows, page, sort, searchType, committedQuery, pageSize])

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
            className="px-5 py-2 bg-slate-100 hover:bg-[#00d4a8]/15 border border-slate-200 hover:border-[#00d4a8] text-slate-700 hover:text-[#00a884] rounded-xl text-sm font-mono font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer shadow-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* Sensor Data Table */}
      <div className="bg-white border border-slate-200 overflow-hidden rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className={thCls}>ID</th>
                <th className={thCls}>Sensor Type</th>
                <th className={thCls}>Value</th>
                <th className={thCls}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => {
                const meta = SENSOR_META[f.sensorType] || { unit: '', color: '#334155' }
                return (
                  <tr
                    key={f.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${i % 2 !== 0 ? 'bg-slate-50/40' : 'bg-white'}`}
                  >
                    <td className={`${tdCls} text-slate-500`}>#{f.id}</td>
                    <td className={tdCls} style={{ color: meta.color }}>{f.sensorType}</td>
                    <td className={`${tdCls} font-semibold`} style={{ color: meta.color }}>
                      {f.value} {meta.unit}
                    </td>
                    <td className={`${tdCls} text-[#00a884]`}>{f.fullTime}</td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-sm font-mono">
                    {loading ? 'Loading sensor records...' : 'No sensor records matched your query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination + count */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 px-6 py-2.5 border-t border-slate-200 shrink-0">
          <span className="text-xs font-mono text-slate-500">
            Showing {total === 0 ? '0 of 0' : `${showFrom}-${showTo} of ${total}`} records
          </span>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Rows per page:</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-mono focus:outline-none focus:border-[#00d4a8] transition-colors appearance-none pr-6 cursor-pointer shadow-sm"
              >
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">▾</span>
            </div>
          </div>

          <Pagination page={page} total={total} perPage={pageSize} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

