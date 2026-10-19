import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import avatarImg from '../assets/anh the.JPG'
import { USER_INFO } from '../services/mockData'

interface NavItemProps {
  label: string
  to: string
  active: boolean
  icon?: ReactNode
}

export function NavItem({ label, to, active, icon }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-3 ${active
        ? 'bg-[#00d4a8]/10 text-[#00a884] font-semibold border-l-4 border-[#00d4a8]'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </Link>
  )
}

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const pathname = location.pathname

  const isDashboard = pathname === '/' || pathname === '/dashboard'
  const isDataSensor = pathname === '/datasensor' || pathname === '/data-sensor'
  const isHistory = pathname === '/history'
  const isProfile = pathname === '/profile' || pathname === '/my-profile' || pathname === '/myprofile'

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col py-6 shadow-sm">
        <div className="px-5 mb-8 flex items-center justify-center">
          <div className="text-sm font-bold tracking-wide text-slate-900">IOT CONTROL</div>
        </div>

        <nav className="flex flex-col gap-1.5 px-3 flex-1">
          <NavItem
            label="Dashboard"
            to="/dashboard"
            active={isDashboard}
          />
          <NavItem
            label="Data Sensor"
            to="/datasensor"
            active={isDataSensor}
          />
          <NavItem
            label="History"
            to="/history"
            active={isHistory}
          />
          <NavItem
            label="My Profile"
            to="/profile"
            active={isProfile}
          />
        </nav>

        {/* User Info at the bottom-left */}
        <div className="px-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
              <img
                src={avatarImg}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-slate-900 truncate">
              {USER_INFO.name}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-5 flex flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

