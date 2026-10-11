import { SensorReading, HistoryLog, DeviceStates } from '../types'

export function formatFullTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

export function shortTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function shortTimeSec(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// API Service layer (Kết nối tới Spring Boot Backend và WebSocket Server)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws'

export const iotApiService = {
  // 1. Lấy trạng thái thiết bị
  async getDeviceStatus(): Promise<DeviceStates | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/status`)
      if (!res.ok) throw new Error('Failed to fetch devices status')
      return await res.json()
    } catch (e) {
      console.warn('[API] Khong the lay trang thai thiet bi tu backend:', e)
      return null
    }
  },

  // 2. Lấy 15 điểm đo mới nhất cho LiveChart
  async getLatestChartSensors(): Promise<{ time: string; temp: number; humidity: number; light: number }[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/sensors/latest?limit=15`)
      if (!res.ok) throw new Error('Failed to fetch chart sensors')
      return await res.json()
    } catch (e) {
      console.warn('[API] Khong the lay du lieu bieu do tu backend:', e)
      return null
    }
  },

  // 3. Lấy dữ liệu cảm biến cho DataSensorPage từ CSDL
  async getSensors(page = 1, limit = 100): Promise<SensorReading[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/sensors?page=${page}&limit=${limit}&sort=newest`)
      if (!res.ok) throw new Error('Failed to fetch sensors')
      const json = await res.json()
      if (Array.isArray(json)) return json
      return json.data || null
    } catch (e) {
      console.warn('[API] Khong the lay bang du lieu cam bien tu backend:', e)
      return null
    }
  },

  // 4. Lấy lịch sử bật tắt thiết bị
  async getHistoryLogs(): Promise<HistoryLog[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/history`)
      if (!res.ok) throw new Error('Failed to fetch history')
      const data = await res.json()
      return Array.isArray(data) ? data : (data.data || null)
    } catch (e) {
      console.warn('[API] Khong the lay lich su thiet bi tu backend:', e)
      return null
    }
  },

  // 5. Gửi lệnh bật/tắt thiết bị tới Backend (chuyển tiếp tới MQTT -> ESP32)
  async toggleDevice(device: 'Light' | 'Fan', action: 'ON' | 'OFF'): Promise<HistoryLog | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device, action }),
      })
      if (!res.ok) throw new Error('Failed to toggle device')
      return await res.json()
    } catch (e) {
      console.warn('[API] Gui lenh toggle toi backend that bai:', e)
      return null
    }
  },

  // 6. Kết nối WebSocket để nhận dữ liệu Realtime từ ESP32
  connectWebSocket(
    onMessage: (data: any) => void,
    onStatusChange?: (connected: boolean) => void
  ): () => void {
    let ws: WebSocket | null = null
    let reconnectTimeout: any = null
    let isClosedManually = false

    const connect = () => {
      try {
        ws = new WebSocket(WS_BASE_URL)

        ws.onopen = () => {
          if (isClosedManually) {
            ws?.close()
            return
          }
          console.log('✅ [WebSocket] Da ket noi toi Backend Realtime:', WS_BASE_URL)
          onStatusChange?.(true)
        }

        ws.onmessage = (event) => {
          if (isClosedManually) return
          try {
            const data = JSON.parse(event.data)
            onMessage(data)
          } catch (err) {
            console.error('[WebSocket] Parse error:', err)
          }
        }

        ws.onerror = (err) => {
          if (isClosedManually) return
          console.warn('[WebSocket] Warning/Error:', err)
          onStatusChange?.(false)
        }

        ws.onclose = () => {
          if (isClosedManually) return
          onStatusChange?.(false)
          console.log('[WebSocket] Connection closed. Thu ket noi lai sau 3s...')
          reconnectTimeout = setTimeout(connect, 3000)
        }
      } catch (err) {
        console.error('[WebSocket] Connect error:', err)
        onStatusChange?.(false)
      }
    }

    connect()

    return () => {
      isClosedManually = true
      clearTimeout(reconnectTimeout)
      if (ws) {
        try {
          ws.onopen = null
          ws.onmessage = null
          ws.onerror = null
          ws.onclose = null
          ws.close()
        } catch (e) {
          // ignore
        }
      }
    }
  },
}
