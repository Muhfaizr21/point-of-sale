import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../common/Button'
import { apiClient } from '../../services/apiClient'

const PRESETS = [
  {
    name: 'Merah Klasik',
    mode: 'light',
    colors: { primary: '#af101a', tint: '#ba1a20', container: '#d32f2f', error: '#ba1a1a', bg: '#fbf9f9', surface: '#ffffff', sidebar: '#fbf9f9' },
  },
  {
    name: 'Biru Laut',
    mode: 'light',
    colors: { primary: '#1e40af', tint: '#2563eb', container: '#3b82f6', error: '#dc2626', bg: '#f8fafc', surface: '#ffffff', sidebar: '#f8fafc' },
  },
  {
    name: 'Hijau Alam',
    mode: 'light',
    colors: { primary: '#166534', tint: '#16a34a', container: '#4ade80', error: '#dc2626', bg: '#f0fdf4', surface: '#ffffff', sidebar: '#f0fdf4' },
  },
  {
    name: 'Ungu Elegan',
    mode: 'light',
    colors: { primary: '#6d28d9', tint: '#8b5cf6', container: '#a78bfa', error: '#e11d48', bg: '#faf5ff', surface: '#ffffff', sidebar: '#faf5ff' },
  },
  {
    name: 'Mode Gelap',
    mode: 'dark',
    colors: { primary: '#f87171', tint: '#ef4444', container: '#b91c1c', error: '#fca5a5', bg: '#0a0a0a', surface: '#171717', sidebar: '#0a0a0a' },
  },
  {
    name: 'Dark Biru',
    mode: 'dark',
    colors: { primary: '#60a5fa', tint: '#3b82f6', container: '#1e3a8a', error: '#fca5a5', bg: '#0f172a', surface: '#1e293b', sidebar: '#0f172a' },
  },
  {
    name: 'Dark Hijau',
    mode: 'dark',
    colors: { primary: '#34d399', tint: '#10b981', container: '#065f46', error: '#fca5a5', bg: '#0c0a0c', surface: '#1c1917', sidebar: '#0c0a0c' },
  },
  {
    name: 'Minimal Abu',
    mode: 'light',
    colors: { primary: '#525252', tint: '#737373', container: '#a3a3a3', error: '#dc2626', bg: '#fafafa', surface: '#ffffff', sidebar: '#f5f5f5' },
  },
]

const FONTS = [
  { name: 'Inter', family: "'Inter', sans-serif", class: 'font-sans' },
  { name: 'Poppins', family: "'Poppins', sans-serif", class: 'font-sans' },
  { name: 'Plus Jakarta', family: "'Plus Jakarta Sans', sans-serif", class: 'font-sans' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", class: 'font-mono' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", class: 'font-sans' },
]

const SHAPES = [
  { name: 'Tajam', radius: '6px', desc: 'sharp' },
  { name: 'Normal', radius: '12px', desc: 'normal' },
  { name: 'Bulat', radius: '20px', desc: 'rounded' },
  { name: 'Pill', radius: '999px', desc: 'pill' },
]

const BG_STYLES = [
  { name: 'Polos', value: 'solid' },
  { name: 'Gradien Halus', value: 'gradient-subtle' },
  { name: 'Gradien Kuat', value: 'gradient-bold' },
]

const THEME_STORAGE_KEY = 'appTheme'

function getDefaultTheme() {
  return {
    ...PRESETS[0].colors,
    mode: 'light',
    font: FONTS[0].family,
    shape: SHAPES[1].radius,
    bgStyle: 'solid',
    preset: PRESETS[0].name,
  }
}

function hexToRgb(h) {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export function ThemePage({ onToggleSidebar }) {
  const [theme, setTheme] = useState(getDefaultTheme)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('warna')

  const notif = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const applyCSS = useCallback((t) => {
    const root = document.documentElement
    const isDark = t.mode === 'dark'
    root.classList.toggle('dark-theme', isDark)
    root.style.setProperty('--color-primary', t.primary)
    root.style.setProperty('--color-surface-tint', t.tint)
    root.style.setProperty('--color-primary-container', t.container)
    root.style.setProperty('--color-error', t.error)
    root.style.setProperty('--color-background', t.bg)
    root.style.setProperty('--color-surface', t.surface)
    root.style.setProperty('--color-surface-container-low', t.mode === 'dark' ? '#000000' : '#f5f3f3')
    root.style.setProperty('--color-surface-container', t.mode === 'dark' ? '#000000' : '#efeded')
    root.style.setProperty('--color-surface-container-high', t.mode === 'dark' ? '#171717' : '#e9e8e7')
    root.style.setProperty('--color-surface-container-lowest', t.mode === 'dark' ? '#000000' : '#ffffff')
    root.style.setProperty('--color-on-surface', t.mode === 'dark' ? '#e5e5e5' : '#1b1c1c')
    root.style.setProperty('--color-on-surface-variant', t.mode === 'dark' ? '#a3a3a3' : '#5b403d')
    root.style.setProperty('--color-outline', t.mode === 'dark' ? '#525252' : '#8f6f6c')
    root.style.setProperty('--color-outline-variant', t.mode === 'dark' ? '#262626' : '#e4beba')
    root.style.setProperty('--color-on-primary', t.mode === 'dark' ? '#000000' : '#ffffff')
    root.style.setProperty('--color-on-primary-container', t.mode === 'dark' ? '#000000' : '#fff2f0')
    root.style.setProperty('--font-body', t.font)

    // Shape
    root.style.setProperty('--radius-sm', `calc(${t.shape} * 0.4)`)
    root.style.setProperty('--radius-md', t.shape)
    root.style.setProperty('--radius-lg', `calc(${t.shape} * 1.5)`)
    root.style.setProperty('--radius-xl', `calc(${t.shape} * 2.5)`)

    // BG
    if (t.bgStyle === 'solid') {
      root.style.setProperty('--bg-app', t.bg)
      root.style.setProperty('--bg-app-secondary', 'none')
    } else if (t.bgStyle === 'gradient-subtle') {
      root.style.setProperty('--bg-app', `linear-gradient(135deg, ${t.bg} 0%, ${t.surface} 100%)`)
      root.style.setProperty('--bg-app-secondary', `linear-gradient(135deg, ${t.container}15 0%, ${t.primary}08 100%)`)
    } else {
      root.style.setProperty('--bg-app', `linear-gradient(135deg, ${t.bg} 0%, ${t.primary}15 50%, ${t.bg} 100%)`)
      root.style.setProperty('--bg-app-secondary', `linear-gradient(135deg, ${t.container}25 0%, ${t.primary}15 100%)`)
    }

    // CSS vars for Tailwind compatibility
    root.style.setProperty('--color-sidebar-bg', t.sidebar || t.bg)
    root.style.setProperty('--color-primary-rgb', hexToRgb(t.primary))
    root.style.setProperty('--color-error-rgb', hexToRgb(t.error))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/settings/theme')
      if (res?.value) {
        const parsed = JSON.parse(res.value)
        const t = { ...getDefaultTheme(), ...parsed }
        setTheme(t)
        applyCSS(t)
        setLoading(false)
        return
      }
    } catch {}
    const local = localStorage.getItem(THEME_STORAGE_KEY)
    if (local) {
      try {
        const t = { ...getDefaultTheme(), ...JSON.parse(local) }
        setTheme(t)
        applyCSS(t)
        setLoading(false)
        return
      } catch {}
    }
    applyCSS(getDefaultTheme())
    setLoading(false)
  }, [applyCSS])

  useEffect(() => { load() }, [load])

  const update = useCallback((partial) => {
    setTheme(prev => {
      const next = { ...prev, ...partial }
      applyCSS(next)
      return next
    })
  }, [applyCSS])

  const selectPreset = (p) => {
    update({ ...p.colors, mode: p.mode, preset: p.name })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiClient.put('/api/settings/theme', { value: JSON.stringify(theme) })
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
      notif('Tema berhasil disimpan')
    } catch {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
      notif('Tema disimpan secara lokal')
    }
    setSaving(false)
  }

  const resetAll = () => {
    const def = getDefaultTheme()
    setTheme(def)
    applyCSS(def)
  }

  if (loading) return (
    <div className="flex-1 flex h-full items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
      <span className="material-symbols-outlined animate-spin text-[48px]" style={{ color: 'var(--color-primary)' }}>sync</span>
    </div>
  )

  const previewBg = theme.bgStyle === 'solid' ? theme.bg
    : `linear-gradient(135deg, ${theme.bg}, ${theme.primary}15)`

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-background)', background: 'var(--bg-app)', color: 'var(--color-on-surface)' }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 lg:px-8 py-3 shrink-0"
        style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg cursor-pointer transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.tint})`, color: '#fff' }}>
            <span className="material-symbols-outlined text-[20px]">palette</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--color-on-surface)' }}>Tema</h1>
            <p className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>Sesuaikan tampilan aplikasi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetAll}
            className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined text-[16px]">restart_alt</span> Reset
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: '#fff' }}>
            <span className="material-symbols-outlined text-[16px]">{saving ? 'sync' : 'save'}</span>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="flex gap-0.5 px-4 lg:px-8 pt-4" style={{ backgroundColor: 'var(--bg-app)' }}>
        {[
          { id: 'warna', label: 'Warna & Mode', icon: 'palette' },
          { id: 'huruf', label: 'Huruf & Bentuk', icon: 'text_fields' },
          { id: 'pratinjau', label: 'Pratinjau', icon: 'visibility' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors cursor-pointer border-b-2"
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
              color: activeTab === tab.id ? theme.primary : 'var(--color-on-surface-variant)',
              borderBottomColor: activeTab === tab.id ? theme.primary : 'transparent',
            }}>
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-5">
        <div className="max-w-4xl space-y-6 pb-8">

          {/* TAB: WARNA */}
          {activeTab === 'warna' && (
            <>
              {/* MODE TOGGLE */}
              <div className="rounded-xl border overflow-hidden transition-all"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }}>
                <div className="px-5 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-low)' }}>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>Mode Tampilan</h3>
                </div>
                <div className="p-5">
                  <div className="flex gap-3">
                    {[
                      { id: 'light', label: 'Terang', icon: 'light_mode', desc: 'Tampilan cerah default' },
                      { id: 'dark', label: 'Gelap', icon: 'dark_mode', desc: 'Mode malam, nyaman di mata' },
                    ].map(m => {
                      const active = theme.mode === m.id
                      return (
                        <button key={m.id} onClick={() => update({ mode: m.id })}
                          className="flex-1 flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left"
                          style={{
                            borderColor: active ? theme.primary : 'var(--color-outline-variant)',
                            backgroundColor: active ? `${theme.primary}10` : 'var(--color-surface-container-low)',
                          }}>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                            style={{ backgroundColor: active ? theme.primary : 'var(--color-surface-container-high)', color: active ? '#fff' : 'var(--color-on-surface-variant)' }}>
                            <span className="material-symbols-outlined">{m.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>{m.label}</p>
                            <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{m.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* PRESETS */}
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }}>
                <div className="px-5 py-3"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-low)' }}>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>Tema Cepat</h3>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESETS.map(p => {
                    const active = theme.preset === p.name
                    return (
                      <button key={p.name} onClick={() => selectPreset(p)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer"
                        style={{
                          borderColor: active ? theme.primary : 'var(--color-outline-variant)',
                          backgroundColor: active ? `${theme.primary}10` : 'var(--color-surface-container-low)',
                        }}>
                        <div className="flex gap-1.5">
                          <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: p.colors.primary }}></div>
                          <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: p.colors.tint }}></div>
                          <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: p.colors.bg }}></div>
                        </div>
                        <span className="text-xs font-semibold text-center" style={{ color: 'var(--color-on-surface)' }}>{p.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                          backgroundColor: p.mode === 'dark' ? '#333' : '#e5e5e5',
                          color: p.mode === 'dark' ? '#ccc' : '#666',
                        }}>{p.mode === 'dark' ? 'Gelap' : 'Terang'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* CUSTOM COLORS */}
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }}>
                <div className="px-5 py-3"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-low)' }}>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>Kustom Warna</h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'primary', label: 'Utama' },
                    { key: 'tint', label: 'Aksen' },
                    { key: 'container', label: 'Container' },
                    { key: 'error', label: 'Error' },
                    { key: 'bg', label: 'Latar Belakang' },
                    { key: 'surface', label: 'Kartu' },
                    { key: 'sidebar', label: 'Sidebar' },
                  ].map(field => (
                    <div key={field.key} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                      <input type="color" value={theme[field.key]} onChange={e => update({ [field.key]: e.target.value, preset: null })}
                        className="w-9 h-9 rounded-lg border-2 cursor-pointer bg-white p-0.5 shrink-0"
                        style={{ borderColor: 'var(--color-outline-variant)' }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{field.label}</p>
                        <p className="text-[10px] font-mono" style={{ color: 'var(--color-on-surface-variant)' }}>{theme[field.key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB: HURUF & BENTUK */}
          {activeTab === 'huruf' && (
            <>
              {/* FONTS */}
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }}>
                <div className="px-5 py-3"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-low)' }}>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>Huruf (Font)</h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FONTS.map(f => {
                    const active = theme.font === f.family
                    return (
                      <button key={f.name} onClick={() => update({ font: f.family })}
                        className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left"
                        style={{
                          fontFamily: f.family,
                          borderColor: active ? theme.primary : 'var(--color-outline-variant)',
                          backgroundColor: active ? `${theme.primary}10` : 'var(--color-surface-container-low)',
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm"
                          style={{ backgroundColor: active ? theme.primary : 'var(--color-surface-container-high)', color: active ? '#fff' : 'var(--color-on-surface-variant)' }}>
                          Aa
                        </div>
                        <div>
                          <p className="text-base font-bold" style={{ color: 'var(--color-on-surface)' }}>{f.name}</p>
                          <p className="text-xs opacity-60" style={{ color: 'var(--color-on-surface-variant)' }}>
                            The quick brown fox jumps over the lazy dog
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* SHAPES */}
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }}>
                <div className="px-5 py-3"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-low)' }}>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>Bentuk Sudut (Radius)</h3>
                </div>
                <div className="p-5">
                  <div className="flex gap-4">
                    {SHAPES.map(s => {
                      const active = theme.shape === s.radius
                      return (
                        <button key={s.name} onClick={() => update({ shape: s.radius })}
                          className="flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer"
                          style={{
                            borderColor: active ? theme.primary : 'var(--color-outline-variant)',
                            backgroundColor: active ? `${theme.primary}10` : 'var(--color-surface-container-low)',
                          }}>
                          <div className="w-12 h-12 border-2 transition-all"
                            style={{
                              borderRadius: s.radius,
                              borderColor: active ? theme.primary : 'var(--color-on-surface-variant)',
                              backgroundColor: active ? theme.primary : 'transparent',
                            }}></div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{s.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* BG STYLE */}
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }}>
                <div className="px-5 py-3"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-low)' }}>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>Gaya Latar</h3>
                </div>
                <div className="p-5">
                  <div className="flex gap-4">
                    {BG_STYLES.map(s => {
                      const active = theme.bgStyle === s.value
                      return (
                        <button key={s.value} onClick={() => update({ bgStyle: s.value })}
                          className="flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer"
                          style={{
                            borderColor: active ? theme.primary : 'var(--color-outline-variant)',
                            backgroundColor: active ? `${theme.primary}10` : 'var(--color-surface-container-low)',
                          }}>
                          <div className="w-full h-10 rounded-lg transition-all" style={{
                            background: s.value === 'solid' ? theme.bg
                              : s.value === 'gradient-subtle' ? `linear-gradient(135deg, ${theme.bg}, ${theme.surface})`
                              : `linear-gradient(135deg, ${theme.bg}, ${theme.primary}20)`,
                            border: '1px solid var(--color-outline-variant)',
                          }}></div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{s.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: PRATINJAU */}
          {activeTab === 'pratinjau' && (
            <div className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-outline-variant)' }}>
              <div className="px-5 py-3"
                style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-low)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>Pratinjau Langsung</h3>
              </div>
              <div className="p-6 space-y-5">
                {/* App mockup */}
                <div className="rounded-xl border shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: 'var(--color-outline-variant)',
                    borderRadius: theme.shape,
                  }}>
                  {/* Mock sidebar */}
                  <div className="flex">
                    <div className="w-48 p-4 space-y-3 min-h-[300px] hidden sm:block"
                      style={{ backgroundColor: theme.sidebar || theme.bg, borderRight: '1px solid var(--color-outline-variant)' }}>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: theme.primary }}></div>
                        <div>
                          <div className="h-3 w-20 rounded" style={{ backgroundColor: theme.primary }}></div>
                          <div className="h-2 w-12 rounded mt-1" style={{ backgroundColor: 'var(--color-outline-variant)' }}></div>
                        </div>
                      </div>
                      {['Dashboard', 'Kasir', 'Transaksi', 'Laporan'].map((item, i) => (
                        <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: i === 0 ? `${theme.primary}20` : 'transparent',
                            color: i === 0 ? theme.primary : 'var(--color-on-surface-variant)',
                          }}>
                          <span className="material-symbols-outlined text-[14px]">
                            {['dashboard', 'point_of_sale', 'receipt_long', 'analytics'][i]}
                          </span>
                          {item}
                        </div>
                      ))}
                    </div>
                    {/* Mock content */}
                    <div className="flex-1 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-4 w-32 rounded font-bold" style={{ backgroundColor: 'var(--color-on-surface)', opacity: 0.1 }}></div>
                          <div className="h-3 w-48 rounded mt-1" style={{ backgroundColor: 'var(--color-on-surface-variant)', opacity: 0.1 }}></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-20 h-8 rounded-lg" style={{ backgroundColor: theme.primary }}></div>
                          <div className="w-20 h-8 rounded-lg" style={{ backgroundColor: 'var(--color-surface-container-high)' }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="p-4 rounded-xl border" style={{
                            backgroundColor: 'var(--color-surface-container-low)',
                            borderColor: 'var(--color-outline-variant)',
                            borderRadius: theme.shape,
                          }}>
                            <div className="h-3 w-16 rounded" style={{ backgroundColor: theme.tint, opacity: 0.3 }}></div>
                            <div className="h-6 w-24 rounded mt-2" style={{ backgroundColor: theme.primary, opacity: 0.8 }}></div>
                            <div className="h-3 w-20 rounded mt-2" style={{ backgroundColor: 'var(--color-on-surface-variant)', opacity: 0.1 }}></div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-xl border" style={{
                        backgroundColor: 'var(--color-surface-container-low)',
                        borderColor: 'var(--color-outline-variant)',
                        borderRadius: theme.shape,
                      }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: `${theme.primary}20` }}>
                            <span className="material-symbols-outlined flex items-center justify-center h-full" style={{ color: theme.primary }}>payments</span>
                          </div>
                          <div>
                            <div className="h-3 w-24 rounded font-medium" style={{ backgroundColor: 'var(--color-on-surface)', opacity: 0.1 }}></div>
                            <div className="h-4 w-32 rounded mt-1" style={{ backgroundColor: theme.primary, opacity: 0.6 }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample elements */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: theme.primary, borderRadius: theme.shape }}>
                    Tombol Utama
                  </div>
                  <div className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                    style={{
                      backgroundColor: `${theme.primary}15`,
                      color: theme.primary,
                      border: `1px solid ${theme.primary}30`,
                      borderRadius: theme.shape,
                    }}>
                    Tombol Outline
                  </div>
                  <div className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: theme.error, borderRadius: theme.shape }}>
                    Tombol Hapus
                  </div>
                  <div className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: 'var(--color-surface-container-high)', color: 'var(--color-on-surface)', borderRadius: theme.shape }}>
                    Tombol Netral
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-on-surface)' }}>
                  <span className="font-bold" style={{ fontFamily: theme.font }}>Contoh teks dengan font dipilih:</span>
                  <span style={{ fontFamily: theme.font }}>"The quick brown fox jumps over the lazy dog"</span>
                </div>

                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Mode: <strong>{theme.mode === 'dark' ? 'Gelap' : 'Terang'}</strong> · Font: <strong>{theme.font.split("'")[1] || theme.font.split(',')[0]}</strong> · Radius: <strong>{theme.shape}</strong>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl animate-slide-up"
          style={{ backgroundColor: '#1c1c1e', color: '#fff' }}>
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}
