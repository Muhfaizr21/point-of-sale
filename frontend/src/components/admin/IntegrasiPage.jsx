import React, { useState, useEffect, useMemo } from 'react'
import { apiClient } from '../../services/apiClient'
import { TopBar } from '../common/TopBar'

const CATEGORY_ICONS = {
  Pembayaran: 'payments',
  'Rekonsiliasi Bank': 'account_balance',
  Komunikasi: 'chat',
  Marketplace: 'shopping_cart',
  Omnichannel: 'lan',
  Operasional: 'build',
  Pajak: 'receipt_long',
  Akuntansi: 'description',
  Developer: 'code',
}

const APPS = [
  { key: 'midtrans', name: 'Midtrans', icon: 'credit_card', category: 'Pembayaran', desc: 'QRIS, GoPay, OVO, Kartu Kredit', fields: [
    { key: 'server_key', label: 'Server Key', type: 'password' },
    { key: 'client_key', label: 'Client Key', type: 'text' },
    { key: 'merchant_id', label: 'Merchant ID', type: 'text' },
  ]},
  { key: 'xendit', name: 'Xendit', icon: 'account_balance', category: 'Pembayaran', desc: 'QRIS, Virtual Account, E-Wallet', fields: [
    { key: 'secret_api_key', label: 'Secret API Key', type: 'password' },
    { key: 'public_api_key', label: 'Public API Key', type: 'text' },
  ]},
  { key: 'gopay', name: 'GoPay', icon: 'payments', category: 'Pembayaran', desc: 'Integrasi pembayaran GoPay', fields: [
    { key: 'merchant_id', label: 'Merchant ID', type: 'text' },
    { key: 'api_key', label: 'API Key', type: 'password' },
  ]},
  { key: 'qris', name: 'QRIS', icon: 'qr_code_scanner', category: 'Pembayaran', desc: 'QRIS Statis & Dinamis', fields: [
    { key: 'nmid', label: 'NMID', type: 'text' },
    { key: 'merchant_pan', label: 'Merchant PAN', type: 'text' },
  ]},
  { key: 'bank_bca', name: 'BCA API', icon: 'account_balance', category: 'Rekonsiliasi Bank', desc: 'Rekonsiliasi otomatis BCA', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'api_secret', label: 'API Secret', type: 'password' },
  ]},
  { key: 'bank_mandiri', name: 'Mandiri API', icon: 'account_balance', category: 'Rekonsiliasi Bank', desc: 'Rekonsiliasi otomatis Mandiri', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'client_id', label: 'Client ID', type: 'text' },
  ]},
  { key: 'whatsapp', name: 'WhatsApp API', icon: 'chat', category: 'Komunikasi', desc: 'Notifikasi otomatis via WA', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'sender', label: 'Nomor Pengirim', type: 'text' },
  ]},
  { key: 'email', name: 'Email Transaksional', icon: 'mail', category: 'Komunikasi', desc: 'Invoice & notifikasi via email', fields: [
    { key: 'smtp_host', label: 'SMTP Host', type: 'text' },
    { key: 'smtp_port', label: 'SMTP Port', type: 'text' },
    { key: 'smtp_user', label: 'Username', type: 'text' },
    { key: 'smtp_pass', label: 'Password', type: 'password' },
    { key: 'from_email', label: 'Dari Email', type: 'text' },
  ]},
  { key: 'tokopedia', name: 'Tokopedia', icon: 'shopping_cart', category: 'Marketplace', desc: 'Sinkron produk & stok', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'shop_id', label: 'Shop ID', type: 'text' },
  ]},
  { key: 'shopee', name: 'Shopee', icon: 'shopping_bag', category: 'Marketplace', desc: 'Sinkron produk & stok', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'shop_id', label: 'Shop ID', type: 'text' },
  ]},
  { key: 'lazada', name: 'Lazada', icon: 'inventory_2', category: 'Marketplace', desc: 'Sinkron produk & stok', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'seller_id', label: 'Seller ID', type: 'text' },
  ]},
  { key: 'online_order', name: 'Online Ordering', icon: 'web', category: 'Omnichannel', desc: 'Website order white-label', fields: [
    { key: 'domain', label: 'Custom Domain', type: 'text' },
  ]},
  { key: 'qr_menu', name: 'QR Menu', icon: 'table_restaurant', category: 'Omnichannel', desc: 'Menu digital via QR code', fields: [
    { key: 'template', label: 'Template Menu', type: 'text' },
  ]},
  { key: 'kds', name: 'Kitchen Display', icon: 'tv', category: 'Omnichannel', desc: 'Layar dapur otomatis', fields: [
    { key: 'device_id', label: 'Device ID', type: 'text' },
  ]},
  { key: 'printer', name: 'Thermal Printer', icon: 'print', category: 'Operasional', desc: 'Cetak struk otomatis', fields: [
    { key: 'printer_ip', label: 'IP Printer', type: 'text' },
    { key: 'port', label: 'Port', type: 'text' },
  ]},
  { key: 'barcode', name: 'Barcode Scanner', icon: 'document_scanner', category: 'Operasional', desc: 'Scan barcode produk', fields: [
    { key: 'scanner_type', label: 'Tipe Scanner', type: 'text' },
  ]},
  { key: 'efaktur', name: 'e-Faktur PPN', icon: 'receipt_long', category: 'Pajak', desc: 'Faktur pajak elektronik', fields: [
    { key: 'npwp', label: 'NPWP', type: 'text' },
    { key: 'api_key', label: 'API Key', type: 'password' },
  ]},
  { key: 'ebupot', name: 'e-Bupot PPh', icon: 'receipt', category: 'Pajak', desc: 'Bukti potong PPh elektronik', fields: [
    { key: 'npwp', label: 'NPWP', type: 'text' },
  ]},
  { key: 'akuntansi', name: 'Export Akuntansi', icon: 'description', category: 'Akuntansi', desc: 'Export ke Accurate / Jurnal', fields: [
    { key: 'target_app', label: 'Aplikasi Tujuan', type: 'text' },
  ]},
  { key: 'api_keys', name: 'API Keys', icon: 'key', category: 'Developer', desc: 'Akses API eksternal', fields: [
    { key: 'webhook_url', label: 'Webhook URL', type: 'text' },
    { key: 'api_key', label: 'Secret Key', type: 'password' },
  ]},
  { key: 'branding', name: 'Custom Branding', icon: 'brush', category: 'Developer', desc: 'Tampilan & identitas toko Anda', fields: [
    { key: 'app_name', label: 'Nama Aplikasi', type: 'text' },
    { key: 'domain', label: 'Custom Domain', type: 'text' },
    { key: 'primary_color', label: 'Warna Utama', type: 'color' },
    { key: 'secondary_color', label: 'Warna Kedua', type: 'color' },
    { key: 'favicon_url', label: 'Favicon URL', type: 'text' },
    { key: 'login_bg', label: 'Background Login (URL)', type: 'text' },
  ]},
]

const CATEGORIES = [...new Set(APPS.map(a => a.category))]

function getStatus(int) {
  if (!int) return { label: 'Nonaktif', color: 'text-gray-400', bg: 'bg-gray-100', dot: 'bg-gray-400' }
  if (!int.enabled) return { label: 'Nonaktif', color: 'text-gray-400', bg: 'bg-gray-100', dot: 'bg-gray-400' }
  const hasConfig = int.config && Object.values(int.config).some(v => v)
  if (!hasConfig) return { label: 'Perlu Konfigurasi', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' }
  return { label: 'Aktif & Terhubung', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' }
}

export function IntegrasiPage({ onToggleSidebar }) {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [notif, setNotif] = useState(null)
  const [configForms, setConfigForms] = useState({})

  const show = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 4000) }

  useEffect(() => {
    apiClient.get('/api/integrations/my')
      .then(data => setIntegrations(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getInt = (appKey) => integrations.find(i => i.app === appKey)

  const handleToggle = async (appKey, enabled) => {
    const existing = getInt(appKey)
    const conf = (existing && existing.config) || {}
    setSaving(appKey)
    try {
      const res = await apiClient.put(`/api/integrations/my/${appKey}`, { enabled, config: conf })
      setIntegrations(prev => {
        const idx = prev.findIndex(i => i.app === appKey)
        if (idx >= 0) { const n = [...prev]; n[idx] = res; return n }
        return [...prev, res]
      })
    } catch (e) { show(e.message, 'error') }
    finally { setSaving(null) }
  }

  const handleSave = async (appKey) => {
    const k = configForms[appKey] || {}
    setSaving(appKey)
    try {
      const res = await apiClient.put(`/api/integrations/my/${appKey}`, { enabled: true, config: k })
      setIntegrations(prev => {
        const idx = prev.findIndex(i => i.app === appKey)
        if (idx >= 0) { const n = [...prev]; n[idx] = res; return n }
        return [...prev, res]
      })
      show('Konfigurasi berhasil disimpan')
    } catch (e) { show(e.message, 'error') }
    finally { setSaving(null) }
  }

  const groupedApps = useMemo(() => {
    const map = {}
    APPS.forEach(a => {
      if (!map[a.category]) map[a.category] = []
      map[a.category].push(a)
    })
    return map
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <TopBar title="Integrasi & Layanan" subtitle="Hubungkan aplikasi & layanan ke toko Anda" onToggleSidebar={onToggleSidebar} />
        <div className="flex-1 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-[48px] text-gray-200">sync</span></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar title="Integrasi & Layanan" subtitle="Hubungkan aplikasi & layanan ke toko Anda" onToggleSidebar={onToggleSidebar} />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-10 max-w-[1600px] mx-auto">
        {CATEGORIES.map(cat => {
          const apps = groupedApps[cat] || []
          const activeCount = apps.filter(a => { const i = getInt(a.key); return i && i.enabled }).length
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-gray-500">{CATEGORY_ICONS[cat] || 'extension'}</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{cat}</h2>
                  <p className="text-[11px] text-gray-400">{activeCount}/{apps.length} aktif</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {apps.map(app => {
                  const int = getInt(app.key)
                  const status = getStatus(int)
                  const cfg = int?.config || {}
                  const k = app.key === 'branding' ? 'branding' : app.key
                  const formKey = `form_${k}`
                  return app.key === 'branding' && int?.enabled ? (
                    <div key="branding" className="md:col-span-2 xl:col-span-2 bg-white rounded-xl border border-blue-200 shadow-sm shadow-blue-100/50">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[20px] text-blue-600">brush</span>
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">Custom Branding</h3>
                              <p className="text-[11px] text-gray-500">Tampilan & identitas toko Anda</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            <span className={`text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium block mb-1">Nama Aplikasi</label>
                              <input type="text" defaultValue={cfg.app_name || ''}
                                onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, app_name: e.target.value } }))}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium block mb-1">Custom Domain</label>
                              <input type="text" defaultValue={cfg.domain || ''}
                                onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, domain: e.target.value } }))}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
                                placeholder="pos.tokoanda.com" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[11px] text-gray-500 font-medium block mb-1">Warna Utama</label>
                                <div className="flex items-center gap-2">
                                  <input type="color" defaultValue={cfg.primary_color || '#6366f1'}
                                    onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, primary_color: e.target.value } }))}
                                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer bg-transparent p-0.5" />
                                  <input type="text" defaultValue={cfg.primary_color || '#6366f1'}
                                    onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, primary_color: e.target.value } }))}
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-blue-400 font-mono" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[11px] text-gray-500 font-medium block mb-1">Warna Kedua</label>
                                <div className="flex items-center gap-2">
                                  <input type="color" defaultValue={cfg.secondary_color || '#f59e0b'}
                                    onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, secondary_color: e.target.value } }))}
                                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer bg-transparent p-0.5" />
                                  <input type="text" defaultValue={cfg.secondary_color || '#f59e0b'}
                                    onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, secondary_color: e.target.value } }))}
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-blue-400 font-mono" />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium block mb-1">Favicon URL</label>
                              <input type="text" defaultValue={cfg.favicon_url || ''}
                                onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, favicon_url: e.target.value } }))}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium block mb-1">Background Login (URL)</label>
                              <input type="text" defaultValue={cfg.login_bg || ''}
                                onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, login_bg: e.target.value } }))}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 font-medium block mb-2">Logo Toko</label>
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                                  {cfg.logo_url ? (
                                    <img src={cfg.logo_url} alt="logo" className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="material-symbols-outlined text-[28px] text-gray-300">store</span>
                                  )}
                                </div>
                                <input type="text" placeholder="URL Logo" defaultValue={cfg.logo_url || ''}
                                  onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, logo_url: e.target.value } }))}
                                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300" />
                              </div>
                            </div>
                            <button onClick={async () => {
                              const cf = configForms.branding || {}
                              const merged = { ...cfg, ...cf }
                              setSaving('branding')
                              try {
                                const res = await apiClient.put('/api/integrations/my/branding', { enabled: true, config: merged })
                                setIntegrations(prev => {
                                  const idx = prev.findIndex(i => i.app === 'branding')
                                  if (idx >= 0) { const n = [...prev]; n[idx] = res; return n }
                                  return [...prev, res]
                                })
                                show('Branding berhasil disimpan')
                              } catch (e) { show(e.message, 'error') }
                              finally { setSaving(null) }
                            }} disabled={saving === 'branding'}
                              className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2">
                              {saving === 'branding'
                                ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Menyimpan...</>
                                : <><span className="material-symbols-outlined text-[16px]">save</span> Simpan Branding</>}
                            </button>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Pratinjau</p>
                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                              <div className="h-2" style={{ background: `linear-gradient(90deg, ${cfg.primary_color || '#6366f1'}, ${cfg.secondary_color || '#f59e0b'})` }} />
                              <div style={{ background: cfg.login_bg ? `url(${cfg.login_bg}) center/cover` : '#f8fafc' }}>
                                <div className="p-4" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                      style={{ background: cfg.primary_color || '#6366f1' }}>
                                      {cfg.logo_url
                                        ? <img src={cfg.logo_url} alt="" className="w-full h-full object-contain" />
                                        : <span className="material-symbols-outlined text-[16px]">store</span>}
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">{cfg.app_name || 'Nama Toko'}</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="h-3 rounded-full w-3/4" style={{ background: `${cfg.primary_color || '#6366f1'}20` }} />
                                    <div className="h-3 rounded-full w-1/2" style={{ background: `${cfg.secondary_color || '#f59e0b'}20` }} />
                                    <div className="h-3 rounded-full w-2/3" style={{ background: `${cfg.primary_color || '#6366f1'}10` }} />
                                  </div>
                                  <div className="mt-4 flex gap-2">
                                    <div className="h-8 rounded-lg flex-1 flex items-center justify-center text-white text-[10px] font-bold"
                                      style={{ background: cfg.primary_color || '#6366f1' }}>Dashboard</div>
                                    <div className="h-8 rounded-lg flex-1 flex items-center justify-center text-[10px] font-bold border"
                                      style={{ borderColor: cfg.primary_color || '#6366f1', color: cfg.primary_color || '#6366f1' }}>Kasir</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center">Tampilan di atas hanya ilustrasi</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-2.5 border-t border-blue-100 bg-blue-50/30 flex items-center justify-between rounded-b-xl">
                        <span className="text-[11px] text-gray-400">Aktif</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={int?.enabled || false} disabled={saving === 'branding'}
                            onChange={e => handleToggle('branding', e.target.checked)}
                            className="sr-only peer" />
                          <div className={`w-9 h-5 rounded-full peer peer-checked:bg-blue-600 bg-gray-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm ${saving === 'branding' ? 'opacity-50' : ''}`} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div key={app.key}
                      className={`bg-white rounded-xl border shadow-sm transition-all ${int?.enabled ? 'border-blue-200 shadow-blue-100/50' : 'border-gray-200/60 hover:border-gray-300'}`}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${int?.enabled ? 'bg-blue-50' : 'bg-gray-50'}`}>
                              <span className={`material-symbols-outlined text-[20px] ${int?.enabled ? 'text-blue-600' : 'text-gray-400'}`}>{app.icon}</span>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900">{app.name}</h3>
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{app.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              <span className={`text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                            </div>
                          </div>
                        </div>

                        {int?.enabled && app.fields.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                            {app.fields.map(f => (
                              <div key={f.key}>
                                <label className="text-[11px] text-gray-500 font-medium block mb-1">{f.label}</label>
                                <input type={f.type}
                                  defaultValue={(int.config && int.config[f.key]) || ''}
                                  onChange={e => setConfigForms(prev => ({
                                    ...prev,
                                    [app.key]: { ...prev[app.key], [f.key]: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300" />
                              </div>
                            ))}
                            <button onClick={() => handleSave(app.key)} disabled={saving === app.key}
                              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1">
                              {saving === app.key
                                ? <><span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Menyimpan...</>
                                : <><span className="material-symbols-outlined text-[14px]">save</span> Simpan</>}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className={`px-5 py-2.5 border-t ${int?.enabled ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-gray-50/30'} flex items-center justify-between rounded-b-xl`}>
                        <span className="text-[11px] text-gray-400">{int?.enabled ? 'Aktif' : 'Nonaktif'}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={int?.enabled || false} disabled={saving === app.key}
                            onChange={e => handleToggle(app.key, e.target.checked)}
                            className="sr-only peer" />
                          <div className={`w-9 h-5 rounded-full peer peer-checked:bg-blue-600 bg-gray-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm ${saving === app.key ? 'opacity-50' : ''}`} />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {notif && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up backdrop-blur-md ${notif.type === 'error'
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
          {notif.msg}
        </div>
      )}
    </div>
  )
}
