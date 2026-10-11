import React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts'
import { C_TEMP, C_HUMIDITY, C_LIGHT } from '../../services/mockData'

interface LiveChartProps {
  data: { time: string; temp: number; humidity: number; light: number }[]
  isConnected?: boolean
  isEspOnline?: boolean
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f1720] border border-[#1e2d42] rounded-xl px-4 py-3 text-xs font-mono shadow-2xl">
      <div className="text-[#64748b] mb-2 font-semibold">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#94a3b8]">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function LiveChart({
  data,
  isConnected = true,
  isEspOnline = false,
}: LiveChartProps) {
  // Lọc sạch mốc thời gian trùng lặp liên tiếp để trục X không bao giờ bị đúp mốc thời gian
  const chartPoints = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return data.filter((d, i, arr) => i === 0 || d.time !== arr[i - 1].time)
  }, [data])

  const hasData = chartPoints.length > 0

  // Xác định trạng thái kết nối
  const getStatus = () => {
    if (!isConnected) {
      return {
        text: 'Mất kết nối Server',
        color: 'text-[#ef4444]',
        dot: 'bg-[#ef4444]',
      }
    }
    if (!isEspOnline) {
      return {
        text: 'Mất kết nối ESP32',
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
    <div className="flex-1 bg-[#0f1720] border border-[#1e2d42] rounded-2xl p-5 flex flex-col min-w-0 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-[#94a3b8] font-mono uppercase tracking-wider">
          Live Sensor Chart
        </div>
        <div className={`text-[11px] font-mono flex items-center gap-1.5 ${status.color}`}>
          <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
          {status.text}
        </div>
      </div>

      <div className="flex-1 min-h-[340px] flex flex-col justify-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center text-[#64748b] gap-2.5 font-mono text-xs py-20 select-none">
            <span className="text-3xl opacity-30">📊</span>
            <span className="text-sm font-medium text-[#94a3b8]">Chưa có dữ liệu cảm biến</span>
            <span className="text-[11px] text-[#475569]">
              {!isConnected
                ? 'Máy chủ chưa sẵn sàng hoặc mất kết nối'
                : 'ESP32 đang ngoại tuyến hoặc đã ngắt nguồn. Tự động kết nối lại khi có tín hiệu...'}
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartPoints} margin={{ top: 10, right: 48, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                interval={1}
              />
              {/* Left Y-Axis: Temp & Humidity (0 - 100) */}
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                width={50}
                label={{
                  value: 'Temp / Humidity',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748b',
                  fontSize: 9,
                  dx: 15,
                }}
              />
              {/* Right Y-Axis: Light (0 - 1000 Lux) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 1000]}
                tick={{ fill: C_LIGHT, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                width={20}
                label={{
                  value: 'Light (Lux)',
                  angle: 90,
                  position: 'insideRight',
                  fill: C_LIGHT,
                  fontSize: 9,
                  dx: 20,
                  dy: 40,
                }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  paddingTop: '8px',
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temp"
                name="Temp (°C)"
                stroke={C_TEMP}
                strokeWidth={2.5}
                dot={data.length <= 5}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="humidity"
                name="Humidity (%)"
                stroke={C_HUMIDITY}
                strokeWidth={2.5}
                dot={data.length <= 5}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="light"
                name="Light (Lux)"
                stroke={C_LIGHT}
                strokeWidth={2.5}
                dot={data.length <= 5}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
