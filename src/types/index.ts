import { ReactNode } from 'react'

export type PageTab = 'dashboard' | 'data-sensor' | 'history' | 'my-profile'

export interface SensorReading {
  id: number
  time: string
  fullTime: string
  temp: number
  humidity: number
  light: number
}

export type DeviceAction = 'ON' | 'OFF'
export type DeviceStatus = 'ON' | 'OFF' | 'PENDING'

export interface HistoryLog {
  id: number
  device: string
  action: DeviceAction
  status: DeviceStatus
  fullTime: string
}

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
  bg: string
  icon: ReactNode // JSX: <svg/>, <img/>, <span/>...
}

export interface UserProfileInfo {
  name: string
  studentId: string
  className: string
  university: string
  role: string
}
