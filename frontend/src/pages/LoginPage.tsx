import React, { useState } from 'react'
import { iotApiService } from '../services/api'

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await iotApiService.login(username.trim(), password)
      if (res && res.token) {
        onLoginSuccess(res.token, res)
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!')
      }
    } catch (err: any) {
      setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác!')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFill = () => {
    setUsername('admin')
    setPassword('123456')
    setError(null)
  }

  return (
    <div className="min-h-screen w-full bg-[#070b10] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4a8]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-[#0f1722]/80 backdrop-blur-xl border border-[#1e2d42] rounded-2xl shadow-2xl p-8 sm:p-10 z-10 transition-all">
        {/* Header with IoT Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#00d4a8]/15 border border-[#00d4a8]/30 flex items-center justify-center mb-4 text-[#00d4a8] shadow-lg shadow-[#00d4a8]/10">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            IOT DASHBOARD
          </h1>
          <p className="text-xs font-mono text-[#64748b]">
            Secure Access & Realtime Telemetry Control
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono text-[#94a3b8] mb-1.5 uppercase tracking-wider">
              Tên đăng nhập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748b]">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#090d13] border border-[#1e2d42] rounded-xl text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#00d4a8] focus:ring-1 focus:ring-[#00d4a8] transition-all font-mono"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#94a3b8] mb-1.5 uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748b]">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập password..."
                className="w-full pl-10 pr-10 py-2.5 bg-[#090d13] border border-[#1e2d42] rounded-xl text-sm text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-[#00d4a8] focus:ring-1 focus:ring-[#00d4a8] transition-all font-mono"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748b] hover:text-[#94a3b8] cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 bg-[#00d4a8] hover:bg-[#00e6b8] text-[#090d13] font-semibold text-sm rounded-xl transition-all shadow-lg shadow-[#00d4a8]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#090d13]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>ĐĂNG NHẬP</span>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Helper */}
        <div className="mt-6 pt-5 border-t border-[#1e2d42]/80 flex flex-col items-center">
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-xs font-mono text-[#00d4a8] hover:text-[#00e6b8] hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>⚡ Điền nhanh tài khoản Admin (admin / 123456)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
