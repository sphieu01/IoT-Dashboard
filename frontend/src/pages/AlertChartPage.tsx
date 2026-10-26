import React, { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { iotApiService } from '../services/api'
import { selectCls } from '../components/common'

export default function AlertChartPage() {
  const [year, setYear] = useState<number>(2026)
  const [month, setMonth] = useState<number>(10)
  const [selectedDevice, setSelectedDevice] = useState<string>('Alert LED')
  const [loading, setLoading] = useState<boolean>(true)
  const [statsData, setStatsData] = useState<any>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    iotApiService
      .getMonthlyAlerts(year, month, selectedDevice)
      .then((res) => {
        if (!isMounted) return
        setLoading(false)
        if (res) {
          setStatsData(res)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [year, month, selectedDevice, reloadKey])

  const chartData = statsData?.dailyCounts || []

  return (
    <div className="flex-1 flex flex-col gap-5 min-h-0">
      {/* Bộ lọc tối giản: Chọn thiết bị cảnh báo + Tháng + Năm */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f1720] border border-[#1e2d42] p-4 rounded-xl shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc theo thiết bị cảnh báo */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94a3b8] font-mono">Thiết bị:</span>
            <div className="relative">
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className={selectCls}
              >
                <option value="Alert LED">Alert LED</option>
                <option value="all">Tất cả thiết bị</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">
                ▾
              </span>
            </div>
          </div>

          {/* Chọn tháng */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94a3b8] font-mono">Tháng:</span>
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className={selectCls}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">
                ▾
              </span>
            </div>
          </div>

          {/* Chọn năm */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94a3b8] font-mono">Năm:</span>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className={selectCls}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">
                ▾
              </span>
            </div>
          </div>
        </div>

        {/* Nút Reload */}
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-3.5 py-1.5 bg-[#1e2d42] hover:bg-[#334155] border border-[#1e2d42] text-[#94a3b8] hover:text-[#00d4a8] rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00d4a8]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reload
        </button>
      </div>

      {/* Biểu đồ tháng (Monthly Bar Chart) */}
      <div className="bg-[#0f1720] border border-[#1e2d42] rounded-2xl p-5 flex flex-col flex-1 min-h-[380px] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-sm font-semibold text-[#e2e8f0]">
              Biểu đồ số cảnh báo theo ngày (Tháng {month}/{year})
            </span>
          </div>
          <span className="text-xs font-mono text-[#64748b]">{selectedDevice}</span>
        </div>

        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" opacity={0.6} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                stroke="#1e2d42"
                label={{ value: 'Ngày trong tháng', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                stroke="#1e2d42"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0].payload
                  return (
                    <div className="bg-[#0a101d] border border-[#1e2d42] rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
                      <div className="text-[#64748b] mb-1 font-semibold">{item.date}</div>
                      <div className="text-rose-400 font-bold">
                        Cảnh báo: {item.alertCount} lần
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="alertCount" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
