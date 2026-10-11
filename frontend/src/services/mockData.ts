import { UserProfileInfo, DeviceConfig, PageTab } from '../types'

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

export const PAGE_TITLES: Record<PageTab, string> = {
  dashboard: 'Dashboard',
  'data-sensor': 'Data Sensor',
  history: 'History',
  'my-profile': 'My Profile',
}
