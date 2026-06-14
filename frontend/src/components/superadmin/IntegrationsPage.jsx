import React, { useState, useEffect, useRef, useMemo } from 'react'
import { apiClient } from '../../services/apiClient'

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
    { key: 'corporate_id', label: 'Corporate ID', type: 'text' },
  ]},
  { key: 'bank_mandiri', name: 'Mandiri API', icon: 'account_balance', category: 'Rekonsiliasi Bank', desc: 'Rekonsiliasi otomatis Mandiri', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'client_id', label: 'Client ID', type: 'text' },
  ]},
  { key: 'whatsapp', name: 'WhatsApp API', icon: 'chat', category: 'Komunikasi', desc: 'Notifikasi otomatis via WA', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'sender', label: 'Nomor Pengirim', type: 'text' },
    { key: 'api_url', label: 'API URL', type: 'text' },
  ]},
  { key: 'email', name: 'Email Transaksional', icon: 'mail', category: 'Komunikasi', desc: 'Invoice & notifikasi via email', fields: [
    { key: 'smtp_host', label: 'SMTP Host', type: 'text' },
    { key: 'smtp_port', label: 'SMTP Port', type: 'text' },
    { key: 'smtp_user', label: 'Username', type: 'text' },
    { key: 'smtp_pass', label: 'Password', type: 'password' },
    { key: 'from_email', label: 'Dari Email', type: 'text' },
  ]},
  { key: 'sms', name: 'SMS Gateway', icon: 'sms', category: 'Komunikasi', desc: 'Notifikasi via SMS', fields: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'sender', label: 'Sender ID', type: 'text' },
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
    { key: 'theme', label: 'Tema', type: 'text' },
  ]},
  { key: 'qr_menu', name: 'QR Menu / Self-Order', icon: 'table_restaurant', category: 'Omnichannel', desc: 'Menu digital via QR code', fields: [
    { key: 'template', label: 'Template Menu', type: 'text' },
  ]},
  { key: 'kds', name: 'Kitchen Display System', icon: 'tv', category: 'Omnichannel', desc: 'Layar dapur otomatis', fields: [
    { key: 'device_id', label: 'Device ID', type: 'text' },
  ]},
  { key: 'printer', name: 'Thermal Printer', icon: 'print', category: 'Operasional', desc: 'Cetak struk otomatis', fields: [
    { key: 'printer_ip', label: 'IP Printer', type: 'text' },
    { key: 'port', label: 'Port', type: 'text' },
  ]},
  { key: 'barcode', name: 'Barcode / QR Scanner', icon: 'document_scanner', category: 'Operasional', desc: 'Scan barcode produk', fields: [
    { key: 'scanner_type', label: 'Tipe Scanner', type: 'text' },
  ]},
  { key: 'efaktur', name: 'e-Faktur PPN', icon: 'receipt_long', category: 'Pajak', desc: 'Faktur pajak elektronik', fields: [
    { key: 'npwp', label: 'NPWP', type: 'text' },
    { key: 'api_key', label: 'API Key', type: 'password' },
  ]},
  { key: 'ebupot', name: 'e-Bupot PPh', icon: 'receipt', category: 'Pajak', desc: 'Bukti potong PPh elektronik', fields: [
    { key: 'npwp', label: 'NPWP', type: 'text' },
    { key: 'api_key', label: 'API Key', type: 'password' },
  ]},
  { key: 'akuntansi', name: 'Export Akuntansi', icon: 'description', category: 'Akuntansi', desc: 'Export ke Accurate / Jurnal', fields: [
    { key: 'target_app', label: 'Aplikasi Tujuan', type: 'text' },
    { key: 'api_key', label: 'API Key', type: 'password' },
  ]},
  { key: 'api_keys', name: 'API Keys & Webhooks', icon: 'key', category: 'Developer', desc: 'Akses API eksternal', fields: [
    { key: 'webhook_url', label: 'Webhook URL', type: 'text' },
    { key: 'api_key', label: 'Secret Key', type: 'password' },
  ]},
  { key: 'branding', name: 'Custom Branding', icon: 'brush', category: 'Developer', desc: 'Tampilan & identitas toko', fields: [
    { key: 'app_name', label: 'Nama Aplikasi', type: 'text' },
    { key: 'domain', label: 'Custom Domain', type: 'text' },
    { key: 'primary_color', label: 'Warna Utama', type: 'color' },
    { key: 'secondary_color', label: 'Warna Kedua', type: 'color' },
    { key: 'favicon_url', label: 'Favicon URL', type: 'text' },
    { key: 'login_bg', label: 'Background Login', type: 'text' },
    { key: 'logo_url', label: 'URL Logo', type: 'text' },
  ]},
]

const CATEGORIES = [...new Set(APPS.map(a => a.category))]

function MerchantDropdown({ merchants, selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!search) return merchants
    const q = search.toLowerCase()
    return merchants.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q))
  }, [merchants, search])

  const selectedMerchant = merchants.find(m => m.id === selected)

  return (
    <div className="relative w-full max-w-sm" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none hover:border-white/20 transition-all cursor-pointer">
        {selectedMerchant ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px] text-blue-400">store</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white/90">{selectedMerchant.name}</p>
              <p className="text-[10px] text-white/40">{selectedMerchant.code}{selectedMerchant.email ? ` · ${selectedMerchant.email}` : ''}</p>
            </div>
            <span className="material-symbols-outlined text-[18px] text-white/30">unfold_more</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px] text-white/30">store</span>
            <span className="flex-1 text-left text-white/40">Pilih merchant...</span>
            <span className="material-symbols-outlined text-[18px] text-white/30">unfold_more</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0f0f0f] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              <span className="material-symbols-outlined text-[16px] text-white/30">search</span>
              <input type="text" placeholder="Cari merchant..." value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20" />
              {search && (
                <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? filtered.map(m => (
              <button key={m.id} type="button" onClick={() => { onSelect(m.id); setOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all cursor-pointer text-left ${m.id === selected ? 'bg-blue-500/10' : 'hover:bg-white/[0.03]'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.id === selected ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                  <span className={`material-symbols-outlined text-[16px] ${m.id === selected ? 'text-blue-400' : 'text-white/30'}`}>storefront</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${m.id === selected ? 'text-blue-300' : 'text-white/80'}`}>{m.name}</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">{m.code}</span>
                  </div>
                  {m.email && <p className="text-[11px] text-white/30 truncate mt-0.5">{m.email}</p>}
                </div>
                {m.id === selected && <span className="material-symbols-outlined text-[16px] text-blue-400">check_circle</span>}
              </button>
            )) : (
              <div className="px-4 py-8 text-center text-sm text-white/30">
                <span className="material-symbols-outlined text-[32px] block mx-auto mb-2 text-white/20">search_off</span>
                Merchant tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function IntegrationsPage() {
  const [merchants, setMerchants] = useState([])
  const [selectedMerchant, setSelectedMerchant] = useState(null)
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [notif, setNotif] = useState(null)
  const [configForms, setConfigForms] = useState({})

  const show = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 4000) }

  useEffect(() => {
    apiClient.get('/api/merchants').then(setMerchants).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedMerchant) { setLoading(false); return }
    setLoading(true)
    apiClient.get(`/api/integrations?merchant_id=${selectedMerchant}`)
      .then(data => { setIntegrations(data || []); setConfigForms({}) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedMerchant])

  const getIntegration = (appKey) =>
    integrations.find(i => i.app === appKey) || { app: appKey, enabled: false, config: {} }

  const handleToggle = async (appKey, enabled) => {
    const existing = getIntegration(appKey)
    const conf = existing.config || {}
    setSaving(appKey)
    try {
      const res = await apiClient.put(`/api/integrations/${selectedMerchant}/${appKey}`, { enabled, config: conf })
      setIntegrations(prev => {
        const idx = prev.findIndex(i => i.app === appKey)
        if (idx >= 0) { const n = [...prev]; n[idx] = res; return n }
        return [...prev, res]
      })
    } catch (e) { show(e.message, 'error') }
    finally { setSaving(null) }
  }

  const handleSaveConfig = async (appKey) => {
    const cfg = appKey === 'branding'
      ? { ...getIntegration(appKey).config, ...(configForms[appKey] || {}) }
      : (configForms[appKey] || getIntegration(appKey).config || {})
    setSaving(appKey)
    try {
      const res = await apiClient.put(`/api/integrations/${selectedMerchant}/${appKey}`, { enabled: true, config: cfg })
      setIntegrations(prev => {
        const idx = prev.findIndex(i => i.app === appKey)
        if (idx >= 0) { const n = [...prev]; n[idx] = res; return n }
        return [...prev, res]
      })
      show('Konfigurasi berhasil disimpan')
    } catch (e) { show(e.message, 'error') }
    finally { setSaving(null) }
  }

  const catIcons = {
    Pembayaran: 'payments', 'Rekonsiliasi Bank': 'account_balance', Komunikasi: 'chat',
    Marketplace: 'shopping_cart', Omnichannel: 'lan', Operasional: 'build',
    Pajak: 'receipt_long', Akuntansi: 'description', Developer: 'code',
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white/90">Integrasi Aplikasi</h1>
            <p className="text-sm text-white/30 mt-1">Atur koneksi aplikasi & layanan untuk setiap merchant</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-white/50 block mb-2">Pilih Merchant</label>
          <MerchantDropdown merchants={merchants} selected={selectedMerchant} onSelect={setSelectedMerchant} />
        </div>

        {!selectedMerchant ? (
          <div className="text-center py-24 text-white/20">
            <span className="material-symbols-outlined text-[64px]">settings</span>
            <p className="text-sm mt-4">Pilih merchant untuk mengatur integrasi</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-32"><span className="material-symbols-outlined animate-spin text-[48px] text-white/20">sync</span></div>
        ) : (
          CATEGORIES.map(cat => (
            <div key={cat} className="mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-white/40">{catIcons[cat] || 'extension'}</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">{cat}</h2>
                  <p className="text-[11px] text-white/30">{APPS.filter(a => a.category === cat).length} aplikasi</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {APPS.filter(a => a.category === cat).map(app => {
                  const int = getIntegration(app.key)
                  const cfg = int.config || {}
                  if (app.key === 'branding' && int.enabled) {
                    return (
                      <div key="branding" className="md:col-span-2 xl:col-span-2 bg-[#0a0a0a] border border-blue-500/30 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[20px] text-blue-400">brush</span>
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-white/90">Custom Branding</h3>
                              <p className="text-[11px] text-white/40">Tampilan & identitas toko</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" checked={int.enabled} disabled={saving === 'branding'}
                              onChange={e => handleToggle('branding', e.target.checked)} className="sr-only peer" />
                            <div className={`w-9 h-5 rounded-full peer peer-checked:bg-blue-600 bg-white/10 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 ${saving === 'branding' ? 'opacity-50' : ''}`} />
                          </label>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[11px] text-white/40 block mb-1">Warna Utama</label>
                                <div className="flex items-center gap-2">
                                  <input type="color" defaultValue={cfg.primary_color || '#6366f1'}
                                    onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, primary_color: e.target.value } }))}
                                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent p-0.5" />
                                  <input type="text" defaultValue={cfg.primary_color || '#6366f1'}
                                    onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, primary_color: e.target.value } }))}
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50 font-mono" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[11px] text-white/40 block mb-1">Warna Kedua</label>
                                <div className="flex items-center gap-2">
                                  <input type="color" defaultValue={cfg.secondary_color || '#f59e0b'}
                                    onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, secondary_color: e.target.value } }))}
                                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent p-0.5" />
                                  <input type="text" defaultValue={cfg.secondary_color || '#f59e0b'}
                                    onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, secondary_color: e.target.value } }))}
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50 font-mono" />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] text-white/40 block mb-1">Nama Aplikasi</label>
                              <input type="text" defaultValue={cfg.app_name || ''}
                                onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, app_name: e.target.value } }))}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50" />
                            </div>
                            <div>
                              <label className="text-[11px] text-white/40 block mb-1">Custom Domain</label>
                              <input type="text" defaultValue={cfg.domain || ''}
                                onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, domain: e.target.value } }))}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[11px] text-white/40 block mb-1">Favicon URL</label>
                                <input type="text" defaultValue={cfg.favicon_url || ''}
                                  onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, favicon_url: e.target.value } }))}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
                              </div>
                              <div>
                                <label className="text-[11px] text-white/40 block mb-1">Background Login</label>
                                <input type="text" defaultValue={cfg.login_bg || ''}
                                  onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, login_bg: e.target.value } }))}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] text-white/40 block mb-1">URL Logo</label>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                  {cfg.logo_url ? <img src={cfg.logo_url} alt="" className="w-full h-full object-contain" /> : <span className="material-symbols-outlined text-[20px] text-white/20">store</span>}
                                </div>
                                <input type="text" defaultValue={cfg.logo_url || ''}
                                  onChange={e => setConfigForms(prev => ({ ...prev, branding: { ...prev.branding, logo_url: e.target.value } }))}
                                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
                              </div>
                            </div>
                            <button onClick={() => handleSaveConfig('branding')} disabled={saving === 'branding'}
                              className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2">
                              {saving === 'branding'
                                ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Menyimpan...</>
                                : <><span className="material-symbols-outlined text-[16px]">save</span> Simpan Branding</>}
                            </button>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Pratinjau</p>
                            <div className="rounded-xl border border-white/10 overflow-hidden">
                              <div className="h-2" style={{ background: `linear-gradient(90deg, ${cfg.primary_color || '#6366f1'}, ${cfg.secondary_color || '#f59e0b'})` }} />
                              <div style={{ background: cfg.login_bg ? `url(${cfg.login_bg}) center/cover` : '#111' }}>
                                <div className="p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                      style={{ background: cfg.primary_color || '#6366f1' }}>
                                      {cfg.logo_url ? <img src={cfg.logo_url} alt="" className="w-full h-full object-contain" /> : <span className="material-symbols-outlined text-[16px]">store</span>}
                                    </div>
                                    <span className="text-sm font-bold text-white">{cfg.app_name || 'Nama Toko'}</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="h-3 rounded-full w-3/4" style={{ background: `${cfg.primary_color || '#6366f1'}20` }} />
                                    <div className="h-3 rounded-full w-1/2" style={{ background: `${cfg.secondary_color || '#f59e0b'}20` }} />
                                    <div className="h-3 rounded-full w-2/3" style={{ background: `${cfg.primary_color || '#6366f1'}10` }} />
                                  </div>
                                  <div className="mt-4 flex gap-2">
                                    <div className="h-8 rounded-lg flex-1 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: cfg.primary_color || '#6366f1' }}>Dashboard</div>
                                    <div className="h-8 rounded-lg flex-1 flex items-center justify-center text-[10px] font-bold border" style={{ borderColor: cfg.primary_color || '#6366f1', color: cfg.primary_color || '#6366f1' }}>Kasir</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={app.key} className={`bg-[#0a0a0a] border rounded-xl p-5 transition-all ${int.enabled ? 'border-blue-500/30' : 'border-white/[0.06] hover:border-white/10'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${int.enabled ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                            <span className={`material-symbols-outlined text-[20px] ${int.enabled ? 'text-blue-400' : 'text-white/30'}`}>{app.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white/90">{app.name}</h3>
                            <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{app.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input type="checkbox" checked={int.enabled} disabled={saving === app.key}
                            onChange={e => handleToggle(app.key, e.target.checked)} className="sr-only peer" />
                          <div className={`w-9 h-5 rounded-full peer peer-checked:bg-blue-600 bg-white/10 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 ${saving === app.key ? 'opacity-50' : ''}`} />
                        </label>
                      </div>
                      {int.enabled && (
                        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                          {app.fields.map(f => (
                            <div key={f.key}>
                              <label className="text-[11px] text-white/40 block mb-1">{f.label}</label>
                              <input type={f.type}
                                defaultValue={int.config?.[f.key] || ''}
                                onChange={e => setConfigForms(prev => ({ ...prev, [app.key]: { ...prev[app.key], [f.key]: e.target.value } }))}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50 placeholder:text-white/20" />
                            </div>
                          ))}
                          <button onClick={() => handleSaveConfig(app.key)} disabled={saving === app.key}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1">
                            {saving === app.key ? (
                              <><span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Menyimpan...</>
                            ) : (
                              <><span className="material-symbols-outlined text-[14px]">save</span> Simpan</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        <div className="text-center text-[11px] text-white/[0.08] py-6 mt-6 border-t border-white/[0.04]">Integrasi Aplikasi · SentraKas Platform</div>
      </div>
      {notif && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up backdrop-blur-md ${notif.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'}`}>
          {notif.msg}
        </div>
      )}
    </div>
  )
}
