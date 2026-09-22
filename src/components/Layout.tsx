import React, { ReactNode } from 'react'
import { PageTab } from '../types'
import { PAGE_TITLES } from '../services/mockData'

interface NavItemProps {
  label: string
  active: boolean
  onClick: () => void
  icon?: ReactNode
}

export function NavItem({ label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-3 ${
        active
          ? 'bg-[#00d4a8]/15 text-[#00d4a8] font-semibold border-l-4 border-[#00d4a8]'
          : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2d42]/60'
      }`}
    >
      <span>{label}</span>
    </button>
  )
}

interface LayoutProps {
  currentPage: PageTab
  onSelectPage: (page: PageTab) => void
  children: ReactNode
}

export default function Layout({ currentPage, onSelectPage, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#090d13] flex font-sans text-[#e2e8f0]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#0a0e14] border-r border-[#1e2d42] flex flex-col py-6">
        <div className="px-5 mb-8 flex items-center justify-center">
          <div className="text-sm font-bold tracking-wide text-white">IOT CONTROL</div>
        </div>

        <nav className="flex flex-col gap-1.5 px-3 flex-1">
          <NavItem
            label="Dashboard"
            active={currentPage === 'dashboard'}
            onClick={() => onSelectPage('dashboard')}
          />
          <NavItem
            label="Data Sensor"
            active={currentPage === 'data-sensor'}
            onClick={() => onSelectPage('data-sensor')}
          />
          <NavItem
            label="History"
            active={currentPage === 'history'}
            onClick={() => onSelectPage('history')}
          />
          <NavItem
            label="My Profile"
            active={currentPage === 'my-profile'}
            onClick={() => onSelectPage('my-profile')}
          />
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-16 bg-[#090d13]/90 backdrop-blur border-b border-[#1e2d42] px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <h1 className="text-xl font-bold tracking-wide text-white">
            {PAGE_TITLES[currentPage]}
          </h1>
          <div />
        </header>

        <main className="flex-1 p-8 flex flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
