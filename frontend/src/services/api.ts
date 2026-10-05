import { SensorReading, HistoryLog, DeviceStates } from '../types'

export function randomLight() {
  return +(700 + Math.random() * 300).toFixed(4)
}

export function randomTemp() {
  return +(29 + Math.random() * 2).toFixed(1)
}

export function randomHumidity() {
  return +(77 + Math.random() * 2).toFixed(1)
}

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

export function generateLiveReading(date: Date = new Date()) {
  return {
    time: shortTimeSec(date),
    temp: randomTemp(),
    humidity: randomHumidity(),
    light: randomLight(),
  }
}

// API Base URLs
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

  // 3. Lấy dữ liệu cảm biến cho DataSensorPage
  async getSensors(page = 1, limit = 90): Promise<SensorReading[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/sensors?page=${page}&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch sensors')
      const data = await res.json()
      return Array.isArray(data) ? data : (data.data || null)
    } catch (e) {
      console.warn('[API] Khong the lay bang du lieu cam bien tu backend:', e)
      return null
    }
  },

  // 4. Lấy lịch sử bật tắt thiết bị
  async getHistoryLogs(): Promise<HistoryLog[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/logs`)
      if (!res.ok) throw new Error('Failed to fetch history')
      return await res.json()
    } catch (e) {
      console.warn('[API] Khong the lay lich su thiet bi tu backend:', e)
      return null
    }
  },

  // 5. Gửi lệnh bật/tắt thiết bị tới Backend (chuyển tiếp tới MQTT -> ESP32)
  async toggleDevice(device: 'Light' | 'Fan', action: 'ON' | 'OFF'): Promise<HistoryLog | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/toggle`, {
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
  connectWebSocket(onMessage: (data: any) => void): () => void {
    let ws: WebSocket | null = null
    let reconnectTimeout: any = null
    let isClosedManually = false

    const connect = () => {
      try {
        ws = new WebSocket(WS_BASE_URL)

        ws.onopen = () => {
          console.log('✅ [WebSocket] Da ket noi toi Backend Realtime:', WS_BASE_URL)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            onMessage(data)
          } catch (err) {
            console.error('[WebSocket] Parse error:', err)
          }
        }

        ws.onclose = () => {
          if (!isClosedManually) {
            reconnectTimeout = setTimeout(connect, 3000)
          }
        }

        ws.onerror = (err) => {
          console.warn('[WebSocket] Loi ket noi (dang thu lai sau 3s)...')
          ws?.close()
        }
      } catch (err) {
        if (!isClosedManually) {
          reconnectTimeout = setTimeout(connect, 3000)
        }
      }
    }

    connect()

    return () => {
      isClosedManually = true
      clearTimeout(reconnectTimeout)
      ws?.close()
    }
  },
}
