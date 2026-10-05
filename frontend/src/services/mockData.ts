import { HistoryLog, SensorReading, UserProfileInfo, DeviceConfig, PageTab } from '../types'
import { formatFullTime, randomLight, randomTemp, randomHumidity } from './api'

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

const BASE_DATE = new Date('2026-09-22T10:39:45')

export const INITIAL_SENSOR_ROWS: SensorReading[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(BASE_DATE.getTime() - i * 2000)
  const fullTime = formatFullTime(d)
  const baseId = (30 - i) * 3

  return [
    {
      id: baseId,
      sensorType: 'Light' as const,
      value: randomLight(),
      fullTime,
    },
    {
      id: baseId - 1,
      sensorType: 'Humidity' as const,
      value: randomHumidity(),
      fullTime,
    },
    {
      id: baseId - 2,
      sensorType: 'Temperature' as const,
      value: randomTemp(),
      fullTime,
    },
  ]
}).flat()

export const INITIAL_HISTORY_ROWS: HistoryLog[] = [
  { id: 12, device: 'Fan', action: 'OFF', status: 'OFF', fullTime: '10:39:38 22/9/2026' },
  { id: 11, device: 'Light', action: 'OFF', status: 'PENDING', fullTime: '10:38:15 22/9/2026' },
  { id: 10, device: 'Fan', action: 'ON', status: 'ON', fullTime: '10:36:12 22/9/2026' },
  { id: 9, device: 'Light', action: 'ON', status: 'ON', fullTime: '10:18:52 22/9/2026' },
  { id: 8, device: 'Fan', action: 'OFF', status: 'ON', fullTime: '10:18:49 22/9/2026' },
  { id: 7, device: 'Fan', action: 'ON', status: 'ON', fullTime: '10:18:48 22/9/2026' },
  { id: 6, device: 'Light', action: 'OFF', status: 'OFF', fullTime: '10:17:37 22/9/2026' },
  { id: 5, device: 'Fan', action: 'OFF', status: 'OFF', fullTime: '10:17:37 22/9/2026' },
  { id: 4, device: 'Light', action: 'ON', status: 'OFF', fullTime: '10:15:20 22/9/2026' },
  { id: 3, device: 'Fan', action: 'ON', status: 'ON', fullTime: '10:10:05 22/9/2026' },
  { id: 2, device: 'Light', action: 'OFF', status: 'OFF', fullTime: '10:05:11 22/9/2026' },
  { id: 1, device: 'Light', action: 'ON', status: 'ON', fullTime: '09:58:44 22/9/2026' },
]
