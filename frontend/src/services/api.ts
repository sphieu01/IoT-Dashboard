import { SensorReading, DeviceHistory, HistoryLog, DeviceStates } from '../types'

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

export interface PagedResponse<T> {
  data: T[]
  total: number
  totalPages: number
  currentPage: number
}

// API Service layer (Kết nối tới Spring Boot Backend và WebSocket Server)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws'

// Helper tạo header xác thực Bearer Token
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('iot_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const iotApiService = {
  // 0. Xác thực & Đăng nhập / Đăng xuất
  async login(username: string, password: string): Promise<{ token: string; username: string; fullName: string; role: string } | null> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Tên đăng nhập hoặc mật khẩu không đúng')
    }
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('iot_token', data.token)
      localStorage.setItem('iot_user', JSON.stringify({
        username: data.username,
        fullName: data.fullName,
        role: data.role,
      }))
    }
    return data
  },

  async register(username: string, password: string, fullName?: string): Promise<{ token: string; username: string; fullName: string; role: string } | null> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, fullName }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Đăng ký thất bại')
    }
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('iot_token', data.token)
      localStorage.setItem('iot_user', JSON.stringify({
        username: data.username,
        fullName: data.fullName,
        role: data.role,
      }))
    }
    return data
  },

  async getMe(): Promise<{ id: number; username: string; fullName: string; role: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  },

  logout(): void {
    localStorage.removeItem('iot_token')
    localStorage.removeItem('iot_user')
  },

  // 1. Lấy trạng thái thiết bị
  async getDeviceStatus(): Promise<DeviceStates | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/status`, {
        headers: getAuthHeaders(),
      })
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
      const res = await fetch(`${API_BASE_URL}/sensors/latest?limit=15`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch chart sensors')
      return await res.json()
    } catch (e) {
      console.warn('[API] Khong the lay du lieu bieu do tu backend:', e)
      return null
    }
  },

  // 3. Lấy dữ liệu cảm biến cho DataSensorPage từ CSDL (Server-side Search & Pagination)
  async getSensorsPaged(params: {
    page?: number
    limit?: number
    searchType?: string
    query?: string
    sort?: string
  }): Promise<PagedResponse<SensorReading> | null> {
    try {
      const sp = new URLSearchParams()
      if (params.page) sp.set('page', String(params.page))
      if (params.limit) sp.set('limit', String(params.limit))
      if (params.searchType) sp.set('searchType', params.searchType)
      if (params.query !== undefined) sp.set('query', params.query)
      if (params.sort) sp.set('sort', params.sort)

      const res = await fetch(`${API_BASE_URL}/sensors/history?${sp.toString()}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch sensors')
      return await res.json()
    } catch (e) {
      console.warn('[API] Khong the lay bang du lieu cam bien tu backend:', e)
      return null
    }
  },

  // 3b. Tương thích ngược
  async getSensors(page = 1, limit = 1000): Promise<SensorReading[] | null> {
    const res = await this.getSensorsPaged({ page, limit, sort: 'newest' })
    return res ? res.data : null
  },

  // 4. Lấy lịch sử bật tắt thiết bị (Server-side Search & Pagination)
  async getDeviceHistoryLogsPaged(params: {
    device?: string
    action?: string
    status?: string
    query?: string
    sort?: string
    page?: number
    limit?: number
  }): Promise<PagedResponse<DeviceHistory> | null> {
    try {
      const sp = new URLSearchParams()
      if (params.device) sp.set('device', params.device)
      if (params.action) sp.set('action', params.action)
      if (params.status) sp.set('status', params.status)
      if (params.query !== undefined) sp.set('query', params.query)
      if (params.sort) sp.set('sort', params.sort)
      if (params.page) sp.set('page', String(params.page))
      if (params.limit) sp.set('limit', String(params.limit))

      const res = await fetch(`${API_BASE_URL}/devices/history?${sp.toString()}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch history')
      return await res.json()
    } catch (e) {
      console.warn('[API] Khong the lay lich su thiet bi tu backend:', e)
      return null
    }
  },

  async getDeviceHistoryLogs(): Promise<DeviceHistory[] | null> {
    const res = await this.getDeviceHistoryLogsPaged({ page: 1, limit: 1000 })
    return res ? res.data : null
  },

  async getHistoryLogs(): Promise<DeviceHistory[] | null> {
    return this.getDeviceHistoryLogs()
  },

  // 5. Gửi lệnh bật/tắt thiết bị tới Backend (chuyển tiếp tới MQTT -> ESP32)
  async toggleDevice(device: string, action: 'ON' | 'OFF'): Promise<DeviceHistory | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/control`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ device, action }),
      })
      if (!res.ok) throw new Error('Failed to toggle device')
      return await res.json()
    } catch (e) {
      console.warn('[API] Gui lenh toggle toi backend that bai:', e)
      return null
    }
  },

  // 6. Lấy ngưỡng ánh sáng cảnh báo x
  async getLightThreshold(): Promise<number> {
    try {
      const res = await fetch(`${API_BASE_URL}/sensors/threshold/light`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        return Number(data.threshold) || 1000
      }
    } catch (e) {
      console.warn('[API] Khong the lay nguong anh sang:', e)
    }
    return 1000
  },

  // 7. Cập nhật ngưỡng ánh sáng cảnh báo x
  async setLightThreshold(threshold: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/sensors/threshold/light`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ threshold }),
      })
      return res.ok
    } catch (e) {
      console.warn('[API] Khong the cap nhat nguong anh sang:', e)
      return false
    }
  },

  // 8. Lấy thống kê số lượng cảnh báo theo ngày trong tháng (cho biểu đồ tháng, có lọc theo led cảnh báo)
  async getMonthlyAlerts(year = 2026, month = 10, device = 'Alert LED'): Promise<any> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/sensors/alerts/monthly?year=${year}&month=${month}&device=${encodeURIComponent(device)}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {
      console.warn('[API] Khong the lay thong ke canh bao thang:', e)
    }
    return null
  },

  // 6. [WEBSOCKET] Giữ lại làm mẫu tham khảo (Hiện tại Frontend sử dụng REST API Polling theo yêu cầu)
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
          if (onStatusChange) onStatusChange(true)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            onMessage(data)
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        ws.onerror = (error) => {
          console.warn('WebSocket error:', error)
        }

        ws.onclose = () => {
          if (!isClosedManually) {
            if (onStatusChange) onStatusChange(false)
            reconnectTimeout = setTimeout(connect, 3000)
          }
        }
      } catch (err) {
        console.error('WebSocket connection failed:', err)
        if (!isClosedManually) {
          reconnectTimeout = setTimeout(connect, 3000)
        }
      }
    }

    // connect()

    return () => {
      isClosedManually = true
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.close()
      }
    }
  },
}
