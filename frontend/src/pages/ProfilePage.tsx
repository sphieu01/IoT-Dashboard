import React from 'react'
import { USER_INFO } from '../services/mockData'
import { ProfileLinkItem } from '../types'

const PROFILE_LINKS: ProfileLinkItem[] = [
  {
    label: 'GitHub Repo',
    href: 'https://github.com/sphieu01/IoT-Dashboard',
  },
  {
    label: 'Figma',
    href: 'https://www.figma.com/design/nMxw4QuOb5eQGHu4kk2w5G/Figma-IoT?t=K46PkW3FirboTfOz-1',
  },
  {
    label: 'Report PDF',
    href: 'https://zvhmx-my.sharepoint.com/:b:/g/personal/onedrivecuahieu1_zvhmx_onmicrosoft_com/IQDGAi8s0tK2QLuqCOdVGrG1AUuUd6ew3BgMUlASoC7vgv0?e=CXZTJT',
  },
  {
    label: 'Postman',
    href: 'https://sphieu01-9332274.postman.co/workspace/Hi%E1%BA%BFu-Trung%27s-Workspace~0151e6cc-beb7-4125-8dea-cf866a4b81f3/request/53379028-b9b950a5-a6fb-4b4d-931c-1879c0f6f0cc?sideView=agentMode',
  },
]

export default function ProfilePage() {
  return (
    <div className="flex justify-center items-start pt-2">
      <div className="w-full max-w-xl">
        {/* Profile Card Container */}
        <div className="bg-[#0f1720] border border-[#1e2d42] rounded-3xl overflow-hidden shadow-2xl">
          {/* Header Banner & Avatar */}
          <div className="px-6 pb-4 pt-6">
            <div className="mb-4 flex items-center gap-4">

              <div className="w-20 h-25 rounded-xl border-4 border-[#1e2d42] bg-gradient-to-br from-teal-400 via-sky-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg">
                <img

                  src={'src/assets/anh the.jpg'}  // <-- Truyền biến vào đây
                  alt="Profile Avatar"
                  className="w-full h-full object-cover rounded-2xl"

                />
              </div>

              <div className="flex flex-col">
                <div className="text-xl font-bold text-white tracking-wide">{USER_INFO.name}</div>
                <div className="text-sm font-mono text-[#00d4a8] mt-1 font-semibold">
                  {USER_INFO.role}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#1e2d42] mb-4" />

            {/* Student Info Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { label: 'Student ID', value: USER_INFO.studentId },
                { label: 'Full Name', value: USER_INFO.name },
                { label: 'Class', value: USER_INFO.className },
                { label: 'University', value: USER_INFO.university },
              ].map((f) => (
                <div
                  key={f.label}
                  className="bg-[#090d13] border border-[#1e2d42] rounded-xl px-4 py-3 hover:border-[#00d4a8]/40 transition-colors"
                >
                  <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-widest mb-1 font-semibold">
                    {f.label}
                  </div>
                  <div className="text-sm font-semibold text-[#e2e8f0] truncate">{f.value}</div>
                </div>
              ))}
            </div>

            {/* Project Links Section */}
            <div className="mb-2 text-[10px] font-mono text-[#64748b] uppercase tracking-widest font-semibold">
              Project Resources
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              {PROFILE_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#090d13] border border-[#1e2d42] hover:border-[#00d4a8]/40 hover:bg-[#162031] transition-all group"
                >
                  <span className="text-xs font-semibold text-[#e2e8f0] group-hover:text-white transition-colors truncate">
                    {l.label}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#00d4a8] group-hover:translate-x-0.5 transition-all shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
