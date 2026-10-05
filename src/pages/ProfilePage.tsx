import React from 'react'
import { USER_INFO } from '../services/mockData'
import { ProfileLinkItem } from '../types'

const PROFILE_LINKS: ProfileLinkItem[] = [
  {
    label: 'GitHub Repo',
    href: 'https://github.com/sphieu01/IoT-Dashboard',
    bg: '#24292e',
    icon: (
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    ),
  },
  {
    label: 'Figma',
    href: 'https://www.figma.com/design/nMxw4QuOb5eQGHu4kk2w5G/Figma-IoT?t=K46PkW3FirboTfOz-1',
    bg: '#a259ff',
    icon: (
      <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4zm0-20H4c-2.2 0-4 1.8-4 4s1.8 4 4 4h4V4zM12 0H8C5.8 0 4 1.8 4 4s1.8 4 4 4h4V0zm4 8c2.2 0 4-1.8 4-4s-1.8-4-4-4h-4v8h4zm0 2h-4v8h4c2.2 0 4-1.8 4-4s-1.8-4-4-4z" />
    ),
  },
  {
    label: 'Report PDF',
    href: '#',
    bg: '#dc2626',
    icon: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
    ),
  },
  {
    label: 'Postman',
    href: 'https://postman.com',
    bg: '#ff6c37',
    icon: (
      <path d="M13.527.099C6.955-.744.942 3.9.099 10.473c-.843 6.572 3.8 12.584 10.373 13.428 6.573.843 12.587-3.801 13.428-10.374C24.744 6.955 20.101.943 13.527.099zm-.919 11.289l-2.019 2.018L9.21 12.03l1.942-1.942 2.4 2.4-.944.9zm-3.84-2.394l4.287-4.288 2.4 2.4-4.287 4.29-2.4-2.402zm6.24 6.24l-2.4-2.4 2.4-2.399 2.4 2.4-2.4 2.4z" />
    ),
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1e2d42] hover:border-[#00d4a8]/40 hover:bg-[#162031] transition-all group"
                  style={{ background: l.bg + '15' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow"
                    style={{ background: l.bg }}
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      {l.icon}
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-[#e2e8f0] group-hover:text-white transition-colors truncate">
                    {l.label}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-[#64748b] ml-auto group-hover:text-[#00d4a8] group-hover:translate-x-0.5 transition-all shrink-0"
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
