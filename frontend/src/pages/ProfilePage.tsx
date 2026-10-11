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
      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z" />
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
      <path d="M13.527.099C6.955-.744.942 3.9.099 10.473c-.843 6.572 3.8 12.584 10.373 13.428 6.573.843 12.587-3.801 13.428-10.374C24.744 6.955 20.101.943 13.527.099zm2.471 7.485a.855.855 0 0 0-.593.25l-4.453 4.453-.307-.307-.643-.643c4.389-4.376 5.18-4.418 5.996-3.753zm-4.863 4.861l4.44-4.44a.62.62 0 1 1 .847.903l-4.699 4.125-.588-.588zm.33.694l-1.1.238a.06.06 0 0 1-.067-.032.06.06 0 0 1 .01-.073l.645-.645.512.512zm-2.803-.459l1.172-1.172.879.878-1.979.426a.074.074 0 0 1-.085-.039.072.072 0 0 1 .013-.093zm-3.646 6.058a.076.076 0 0 1-.069-.083.077.077 0 0 1 .022-.046h.002l.946-.946 1.222 1.222-2.123-.147zm2.425-1.256a.228.228 0 0 0-.117.256l.203.865a.125.125 0 0 1-.211.117h-.003l-.934-.934-.294-.295 3.762-3.758 1.82-.393.874.874c-1.255 1.102-2.971 2.201-5.1 3.268zm5.279-3.428h-.002l-.839-.839 4.699-4.125a.952.952 0 0 0 .119-.127c-.148 1.345-2.029 3.245-3.977 5.091zm3.657-6.46l-.003-.002a1.822 1.822 0 0 1 2.459-2.684l-1.61 1.613a.119.119 0 0 0 0 .169l1.247 1.247a1.817 1.817 0 0 1-2.093-.343zm2.578 0a1.714 1.714 0 0 1-.271.218h-.001l-1.207-1.207 1.533-1.533c.661.72.637 1.832-.054 2.522zM18.855 6.05a.143.143 0 0 0-.053.157.416.416 0 0 1-.053.45.14.14 0 0 0 .023.197.141.141 0 0 0 .084.03.14.14 0 0 0 .106-.05.691.691 0 0 0 .087-.751.138.138 0 0 0-.194-.033z" />
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
