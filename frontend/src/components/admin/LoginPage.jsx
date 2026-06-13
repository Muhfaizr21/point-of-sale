import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSentrakas from '../../assets/Sentrakas.png'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Username dan password wajib diisi')
      return
    }
    setLoading(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex w-full bg-surface"

    >
      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 shrink-0 relative bg-primary overflow-hidden items-center justify-center p-12">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-black/10 rounded-full blur-3xl mix-blend-overlay"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
        </div>

        {/* Glassmorphism Card */}
        <div className="relative z-10 w-full max-w-lg min-w-[320px] p-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
          <div className="mb-8 flex items-center">
            <img src={logoSentrakas} alt="SentraKas Logo" className="h-32 w-auto object-contain brightness-0 invert drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />
          </div>
          <h1 className="text-display-sm font-black text-white tracking-tight mb-4 leading-tight">
            SentraKas<br />Point of Sale
          </h1>
          <p className="text-body-lg text-white/90 font-medium leading-relaxed mb-10">
            Kelola bisnis Anda dengan lebih efisien, pantau stok real-time, dan layani pelanggan dengan sistem kasir yang cerdas.
          </p>

          {/* Features pills */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2.5 bg-white/20 rounded-full border border-white/20 text-white text-label-md font-medium backdrop-blur-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">speed</span> Cepat & Responsif
            </div>
            <div className="px-4 py-2.5 bg-white/20 rounded-full border border-white/20 text-white text-label-md font-medium backdrop-blur-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">sync</span> Sync Real-time
            </div>
            <div className="px-4 py-2.5 bg-white/20 rounded-full border border-white/20 text-white text-label-md font-medium backdrop-blur-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">insights</span> Analitik Lengkap
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 shrink-0 flex items-center justify-center p-6 sm:p-12 bg-surface relative">
        {/* Subtle background element for right side */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[440px] relative z-10">
          <div className="mb-10 lg:mb-12">
            <div className="mb-6 lg:hidden flex items-center">
              <img src={logoSentrakas} alt="SentraKas Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
            </div>
            <h2 className="text-display-sm font-black text-on-surface mb-2 tracking-tight">Selamat Datang 👋</h2>
            <p className="text-body-lg text-on-surface-variant font-medium">Silakan masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-2xl flex items-start gap-3 text-error animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0">error</span>
              <span className="text-body-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-label-md font-bold text-on-surface">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-2xl text-body-lg text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-outline-variant"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-label-md font-bold text-on-surface">Password</label>
                <button type="button" className="text-label-sm font-bold text-primary hover:text-primary/80 transition-colors">
                  Lupa password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[22px]">lock</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-2xl text-body-lg text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-outline-variant"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-primary text-on-primary rounded-2xl text-title-md font-bold hover:bg-surface-tint hover:-translate-y-0.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[24px]">login</span>
              )}
              {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
            </button>
          </form>

          <div className="text-center mt-10">
            <p className="text-label-sm text-on-surface-variant/60 font-medium">SentraKas POS System v1.0 &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
