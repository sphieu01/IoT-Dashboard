import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { ThresholdSettings, ExceedCounts } from '../../types'

interface LiveChartProps {
  data: { time: string; temp: number; humidity: number; light: number; co2?: number }[]
  isConnected?: boolean
  isEspOnline?: boolean
  thresholds?: ThresholdSettings
  exceedCounts?: ExceedCounts
}

interface SingleSensorChartProps {
  title: string
  icon: string
  dataKey: 'temp' | 'humidity' | 'light' | 'co2'
  data: { time: string; [key: string]: any }[]
  color: string
  gradientId: string
  unit: string
  threshold?: number
  exceedCount?: number
  domain?: [number | string, number | string]
  formatValue?: (val: any) => string
}

function SingleSensorChart({
  title,
  icon,
  dataKey,
  data,
  color,
  gradientId,
  unit,
  threshold,
  exceedCount = 0,
  domain = ['auto', 'auto'],
  formatValue = (v) => String(v),
}: SingleSensorChartProps) {
  const latestVal = data.length > 0 ? data[data.length - 1][dataKey] : null
  const isExceeded = latestVal !== null && threshold !== undefined && Number(latestVal) > threshold

  return (
    <div className={`bg-[#0f1720] border rounded-xl p-3 flex flex-col shadow-sm transition-all duration-300 ${
      isExceeded ? 'border-rose-500/50 shadow-rose-950/20' : 'border-[#1e2d42]'
    }`}>
      {/* Header nhỏ gọn */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          <span className="text-xs font-semibold text-[#cbd5e1]">{title}</span>
          {latestVal !== null && (
            <span className="text-xs font-mono font-bold ml-1" style={{ color }}>
              {formatValue(latestVal)} {unit}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          {threshold !== undefined && (
            <span className="text-[#64748b]">
              Ngưỡng: <b className="text-[#94a3b8]">&gt;{threshold}</b>
            </span>
          )}
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
              exceedCount > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-[#182333] text-[#64748b]'
            }`}
          >
            Vượt: {exceedCount}
          </span>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="w-full h-36">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#64748b] font-mono">
            Chưa có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" opacity={0.6} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                interval="preserveEnd"
              />
              <YAxis
                domain={domain}
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                width={38}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value
                    return (
                      <div className="bg-[#0f1720] border border-[#1e2d42] px-2.5 py-1.5 rounded-lg text-xs font-mono shadow-xl">
                        <div className="text-[#64748b] text-[10px]">{label}</div>
                        <div className="font-bold flex items-center gap-1" style={{ color }}>
                          <span>{title}:</span>
                          <span>{formatValue(val)} {unit}</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {threshold !== undefined && (
                <ReferenceLine
                  y={threshold}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
              )}
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default function LiveChart({
  data,
  isConnected = true,
  isEspOnline = false,
  thresholds = { temp: 35, humidity: 70, light: 2000, co2: 1000 },
  exceedCounts = { temperature: 0, humidity: 0, light: 0, co2: 0 },
}: LiveChartProps) {
  // Lọc trùng lặp mốc thời gian
  const chartPoints = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return data.filter((d, i, arr) => i === 0 || d.time !== arr[i - 1].time)
  }, [data])

  const getStatus = () => {
    if (!isConnected) {
      return {
        text: 'Disconnect Server',
        color: 'text-[#ef4444]',
        dot: 'bg-[#ef4444]',
      }
    }
    if (!isEspOnline) {
      return {
        text: 'Disconnect ESP32',
        color: 'text-[#ef4444]',
        dot: 'bg-[#ef4444]',
      }
    }
    return {
      text: 'Realtime Live',
      color: 'text-[#00d4a8]',
      dot: 'bg-[#00d4a8] animate-pulse',
    }
  }

  const status = getStatus()

  return (
    <div className="flex-1 flex flex-col gap-2 min-w-0">
      {/* Tiêu đề & Trạng thái kết nối */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider font-mono">
          4 Biểu đồ Cảm biến (Live)
        </span>
        <div className={`text-[11px] font-mono flex items-center gap-1.5 ${status.color}`}>
          <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
          {status.text}
        </div>
      </div>

      {/* Lưới 4 biểu đồ 2x2: [][] / [][] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {/* Biểu đồ 1: Nhiệt độ */}
        <SingleSensorChart
          title="Nhiệt độ"
          icon="🌡️"
          dataKey="temp"
          data={chartPoints}
          color="#f43f5e"
          gradientId="gradTemp"
          unit="°C"
          threshold={thresholds.temp}
          exceedCount={exceedCounts.temperature}
          domain={[15, 45]}
          formatValue={(v) => Number(v).toFixed(1)}
        />

        {/* Biểu đồ 2: Độ ẩm */}
        <SingleSensorChart
          title="Độ ẩm"
          icon="💧"
          dataKey="humidity"
          data={chartPoints}
          color="#06b6d4"
          gradientId="gradHum"
          unit="%"
          threshold={thresholds.humidity}
          exceedCount={exceedCounts.humidity}
          domain={[20, 100]}
          formatValue={(v) => Number(v).toFixed(1)}
        />

        {/* Biểu đồ 3: Ánh sáng */}
        <SingleSensorChart
          title="Ánh sáng"
          icon="☀️"
          dataKey="light"
          data={chartPoints}
          color="#eab308"
          gradientId="gradLight"
          unit="Lux"
          threshold={thresholds.light}
          exceedCount={exceedCounts.light}
          domain={[0, 4095]}
          formatValue={(v) => String(Math.round(Number(v)))}
        />

        {/* Biểu đồ 4: CO2 */}
        <SingleSensorChart
          title="CO2"
          icon="☁️"
          dataKey="co2"
          data={chartPoints}
          color="#10b981"
          gradientId="gradCo2"
          unit="ppm"
          threshold={thresholds.co2}
          exceedCount={exceedCounts.co2}
          domain={[300, 2000]}
          formatValue={(v) => String(Math.round(Number(v || 400)))}
        />
      </div>
    </div>
  )
}
