import { ReactNode } from 'react'

export type PageTab = 'dashboard' | 'data-sensor' | 'history' | 'my-profile' | 'alerts'

export type SensorType = 'Light' | 'Humidity' | 'Temperature' | 'Wind Speed'

export interface SensorReading {
  id: number
  sensorType: SensorType
  value: number
  fullTime: string
}

export interface DailyAlertStat {
  day: number
  date: string
  alertCount: number
  maxWindSpeed: number
  totalReadings: number
}

export interface MonthlyAlertSummary {
  year: number
  month: number
  totalAlerts: number
  peakDay: { day: number; count: number }
  maxMonthlyWindSpeed: number
  daysWithAlerts: number
  safeDays: number
  dailyCounts: DailyAlertStat[]
}

export type DeviceAction = 'ON' | 'OFF'
export type DeviceStatus = 'SUCCESS' | 'FAIL' | 'PENDING' | 'ON' | 'OFF'

export interface DeviceHistory {
  id: number
  device: string
  action: DeviceAction
  status: DeviceStatus
  fullTime: string
}

// Alias tương thích ngược
export type HistoryLog = DeviceHistory

export interface DeviceStates {
  light: boolean
  fan: boolean
  [key: string]: boolean // ?
}

export interface DeviceConfig {
  key: string
  label: string
  icon: string
  desc?: string
}

export interface ProfileLinkItem {
  label: string
  href: string
  bg?: string
  icon?: ReactNode // JSX: <svg/>, <img/>, <span/>...
}

export interface UserProfileInfo {
  name: string
  studentId: string
  className: string
  university: string
  role: string
}
