import React, { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { iotApiService } from '../services/api'
import { MonthlyAlertSummary, DailyAlertStat } from '../types'
import { selectCls } from '../components/common'

export default function AlertChartPage() {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [loading, setLoading] = useState<boolean>(true)
  const [summary, setSummary] = useState<MonthlyAlertSummary | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    iotApiService
      .getMonthlyAlertStats(selectedYear, selectedMonth)
      .then((res) => {
        if (!isMounted) return
        setSummary(res)
        setLoading(false)
      })
      .catch((err) => {
        console.warn('Lỗi khi tải dữ liệu cảnh báo tháng:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedYear, selectedMonth, reloadKey])

  const chartData = summary ? summary.dailyCounts : []

  return (
    <div className="flex-1 flex flex-col gap-5 min-h-0">
      {/* Header + Month/Year Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f1720] border border-[#1e2d42] rounded-2xl p-5 shadow-lg">
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            Biểu Đồ Cảnh Báo Theo Tháng
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1 font-mono">
            Số lượng cảnh báo tốc độ gió &gt; 300 m/s theo từng ngày (Tháng {selectedMonth}/{selectedYear})
          </p>
        </div>

        {/* Controls: Month + Year + Reload */}
        <div className="flex items-center gap-3">
          {/* Month selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={selectCls}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">▾</span>
          </div>

          {/* Year selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={selectCls}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">▾</span>
          </div>

          {/* Reload button */}
          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            title="Tải lại thống kê"
            className="px-4 py-2 bg-[#1e2d42] hover:bg-[#334155] border border-[#1e2d42] text-[#94a3b8] hover:text-[#00d4a8] rounded-xl text-sm font-mono font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin text-[#00d4a8]' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Monthly Alert Bar Chart */}
      <div className="flex-1 bg-[#0f1720] border border-[#1e2d42] rounded-2xl p-5 flex flex-col min-h-[420px] shadow-lg">
        <div className="h-full w-full flex-1">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-[#64748b] gap-2 font-mono text-xs py-24">
              <svg className="w-8 h-8 animate-spin text-[#00d4a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Đang tải dữ liệu biểu đồ...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#64748b] font-mono text-xs py-24">
              Chưa có dữ liệu cảnh báo trong tháng này.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                <defs>
                  <linearGradient id="alertBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#881337" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(val) => `D${val}`}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  label={{
                    value: 'Số cảnh báo / ngày',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 10,
                    dx: 15,
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as DailyAlertStat
                    return (
                      <div className="bg-[#0f1720] border border-[#1e2d42] rounded-xl px-4 py-3 text-xs font-mono shadow-2xl">
                        <div className="text-white font-bold mb-1">
                          📅 Ngày {d.day} ({d.date})
                        </div>
                        <div className="flex items-center gap-2 text-rose-400 font-semibold">
                          <span>Số cảnh báo (&gt;300 m/s):</span>
                          <span className="text-white font-bold">{d.alertCount} lần</span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="alertCount"
                  name="Số cảnh báo"
                  fill="url(#alertBarGradient)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
