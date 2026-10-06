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
        ? 'bg-[#00d4a8]/15 text-[#00d4a8] font-semibold border-l-4 border-[#00d4a8]'
        : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2d42]/60'
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

export default function Layout({ children }: LayoutProps) { // children =  tất cả những gì được nhét vào giữa thẻ <Layout> và </Layout> lúc sử dụng". ở đây là  <DashboardPage />
  const location = useLocation()
  const pathname = location.pathname

  const isDashboard = pathname === '/' || pathname === '/dashboard'
  const isDataSensor = pathname === '/datasensor' || pathname === '/data-sensor'
  const isHistory = pathname === '/history'
  const isProfile = pathname === '/profile' || pathname === '/my-profile' || pathname === '/myprofile'

  return (
    <div className="h-screen overflow-hidden bg-[#090d13] flex font-sans text-[#e2e8f0]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#0a0e14] border-r border-[#1e2d42] flex flex-col py-6">
        <div className="px-5 mb-8 flex items-center justify-center">
          <div className="text-sm font-bold tracking-wide text-white">IOT CONTROL</div>
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
        <div className="px-3 pt-4 border-t border-[#1e2d42]">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#1e2d42] shrink-0 bg-[#121c29]">
              <img
                src={avatarImg}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-white ">
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

