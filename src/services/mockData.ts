import { HistoryLog, SensorReading, UserProfileInfo, DeviceConfig, PageTab } from '../types'
import { formatFullTime, shortTime, randomLight, randomTemp, randomHumidity } from './api'

export const C_TEMP = '#f97316'
export const C_HUMIDITY = '#3b82f6'
export const C_LIGHT = '#ecde19ff'

export const USER_INFO: UserProfileInfo = {
  name: 'Đào Trung Hiếu',
  studentId: 'B23DCCN298',
  className: 'D23CNPM02',
  university: 'PTIT',
  role: 'Software Engineer',
}

export const DEVICES_CONFIG: DeviceConfig[] = [
  { key: 'light', label: 'Light', icon: '💡' },
  { key: 'fan', label: 'Fan', icon: '🌀' },

]

export const PAGE_TITLES: Record<PageTab, string> = { // <key, value>
  dashboard: 'Dashboard',
  'data-sensor': 'Data Sensor',
  history: 'History',
  'my-profile': 'My Profile',
}

const BASE_DATE = new Date('2025-03-10T10:39:45')

export const INITIAL_SENSOR_ROWS: SensorReading[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(BASE_DATE.getTime() - i * 3000)
  return {
    id: i + 1,
    time: shortTime(d),
    fullTime: formatFullTime(d),
    temp: randomTemp(),
    humidity: randomHumidity(),
    light: randomLight(),
  }
})

export const INITIAL_HISTORY_ROWS: HistoryLog[] = [
  { id: 1, device: 'Fan', action: 'OFF', status: 'OFF', fullTime: '10:39:38 3/10/2025' },
  { id: 2, device: 'Light', action: 'OFF', status: 'PENDING', fullTime: '10:38:15 3/10/2025' },
  { id: 3, device: 'Fan', action: 'ON', status: 'ON', fullTime: '10:36:12 3/10/2025' },
  { id: 3, device: 'Light', action: 'OFF', status: 'OFF', fullTime: '10:18:54 3/10/2025' },
  { id: 4, device: 'Light', action: 'ON', status: 'ON', fullTime: '10:18:52 3/10/2025' },
  { id: 5, device: 'Fan', action: 'OFF', status: 'ON', fullTime: '10:18:49 3/10/2025' },
  { id: 6, device: 'Fan', action: 'ON', status: 'ON', fullTime: '10:18:48 3/10/2025' },
  { id: 7, device: 'Light', action: 'OFF', status: 'OFF', fullTime: '10:17:37 3/10/2025' },
  { id: 8, device: 'Fan', action: 'OFF', status: 'OFF', fullTime: '10:17:37 3/10/2025' },
  { id: 9, device: 'Light', action: 'ON', status: 'OFF', fullTime: '10:15:20 3/10/2025' },
  { id: 10, device: 'Fan', action: 'ON', status: 'ON', fullTime: '10:10:05 3/10/2025' },
  { id: 11, device: 'Light', action: 'OFF', status: 'OFF', fullTime: '10:05:11 3/10/2025' },
  { id: 12, device: 'Light', action: 'ON', status: 'ON', fullTime: '09:58:44 3/10/2025' },
]
