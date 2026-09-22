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

export function formatFullTime(d: Date): string { // nhan 1 object date, tra ve string → "14:05:03 20/9/2026"
  const hh = String(d.getHours()).padStart(2, '0') // padStart(2, '0') = "09"
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` // Tháng (bắt đầu từ 0)
}

export function shortTime(d: Date): string {  // "14:05"
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function shortTimeSec(d: Date): string {  // "14:05:03"
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

// API Service layer (Connected to backend when available, otherwise uses local mock logic)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const iotApiService = {
  // Fetch latest telemetry
  async getLatestSensors(): Promise<SensorReading[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sensors?limit=30`)
      if (!res.ok) throw new Error('API request failed')
      return await res.json()
    } catch {
      // Fallback for standalone/mock mode
      return []
    }
  },

  // Toggle device command
  async toggleDevice(device: 'Light' | 'Fan', action: 'ON' | 'OFF'): Promise<HistoryLog> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device, action }),
      })
      if (!res.ok) throw new Error('Failed to toggle device')
      return await res.json()
    } catch {
      // Fallback mock behavior with 15% network glitch simulation
      const mismatch = Math.random() < 0.15
      const status: 'ON' | 'OFF' = mismatch ? (action === 'ON' ? 'OFF' : 'ON') : action
      return {
        id: Date.now(),
        device,
        action,
        status,
        fullTime: formatFullTime(new Date()),
      }
    }
  },

  // Fetch device logs
  async getHistoryLogs(): Promise<HistoryLog[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/logs`)
      if (!res.ok) throw new Error('Failed to fetch history')
      return await res.json()
    } catch {
      return []
    }
  },
}
