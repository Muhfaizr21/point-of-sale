import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../common/Button'
import { TopBar } from '../common/TopBar'
import { apiClient } from '../../services/apiClient'
import defaultLogo from '../../assets/pekalipan-logo.jpg'

const DEFAULT_PAYMENT_METHODS = [
  { id: 'cash', name: 'Tunai', icon: 'payments', enabled: true },
  { id: 'transfer', name: 'Transfer Bank', icon: 'account_balance', enabled: true },
  { id: 'ewallet', name: 'E-Wallet', icon: 'qr_code', enabled: true },
  { id: 'installment', name: 'Cicilan / Kredit', icon: 'credit_score', enabled: false },
]

const PAYMENT_ICONS = [
  { value: 'payments', label: 'Uang' },
  { value: 'account_balance', label: 'Bank' },
  { value: 'qr_code', label: 'QR' },
  { value: 'credit_card', label: 'Kartu' },
  { value: 'credit_score', label: 'Cicilan' },
  { value: 'wallet', label: 'Dompet' },
  { value: 'currency_exchange', label: 'Tukar' },
  { value: 'receipt', label: 'Struk' },
]

export function SettingsPage({ onToggleSidebar, onSettingsChange }) {
  // Profile
  const [storeName, setStoreName] = useState('PEKALIPAN')
  const [storeAddress, setStoreAddress] = useState('Jl. Pekalipan No. 99, Cirebon')
  const [storePhone, setStorePhone] = useState('081234567890')
  const [receiptFooter, setReceiptFooter] = useState('Terima Kasih atas Kunjungan Anda')
  const [storeLogo, setStoreLogo] = useState('')

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS)

  // Tax & Fees
  const [ppnEnabled, setPpnEnabled] = useState(false)
  const [ppnRate, setPpnRate] = useState(11)
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false)
  const [serviceChargeRate, setServiceChargeRate] = useState(5)
  const [rounding, setRounding] = useState(true)

  // Integrations
  const [midtransEnabled, setMidtransEnabled] = useState(false)
  const [midtransClientKey, setMidtransClientKey] = useState('')
  const [midtransServerKey, setMidtransServerKey] = useState('')
  const [midtransMerchantId, setMidtransMerchantId] = useState('')
  const [midtransEnv, setMidtransEnv] = useState('sandbox')

  const [notification, setNotification] = useState(null)

  const showNotif = useCallback((type, message, sub) => {
    setNotification({ type, message, sub })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Load
  useEffect(() => {
    const g = (key, fallback) => { const v = localStorage.getItem(key); return v !== null ? v : fallback }
    const j = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback } }

    setStoreName(g('storeName', 'PEKALIPAN'))
    setStoreAddress(g('storeAddress', 'Jl. Pekalipan No. 99, Cirebon'))
    setStorePhone(g('storePhone', '081234567890'))
    setReceiptFooter(g('receiptFooter', 'Terima kasih atas kunjungan Anda'))
    setStoreLogo(g('storeLogo', ''))

    const pm = j('paymentMethods', DEFAULT_PAYMENT_METHODS)
    setPaymentMethods(pm)

    const tax = j('taxSettings', {})
    setPpnEnabled(tax.ppn_enabled ?? false)
    setPpnRate(tax.ppn_rate ?? 11)
    setServiceChargeEnabled(tax.service_charge_enabled ?? false)
    setServiceChargeRate(tax.service_charge_rate ?? 5)
    setRounding(tax.rounding ?? true)

    const integ = j('integrationSettings', {})
    setMidtransEnabled(integ.midtrans?.enabled ?? false)
    setMidtransClientKey(integ.midtrans?.client_key ?? '')
    setMidtransServerKey(integ.midtrans?.server_key ?? '')
    setMidtransMerchantId(integ.midtrans?.merchant_id ?? '')
    setMidtransEnv(integ.midtrans?.environment ?? 'sandbox')
  }, [])

  const handleSave = () => {
    localStorage.setItem('storeName', storeName)
    localStorage.setItem('storeAddress', storeAddress)
    localStorage.setItem('storePhone', storePhone)
    localStorage.setItem('receiptFooter', receiptFooter)
    localStorage.setItem('storeLogo', storeLogo)
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods))
    localStorage.setItem('taxSettings', JSON.stringify({
      ppn_enabled: ppnEnabled, ppn_rate: ppnRate,
      service_charge_enabled: serviceChargeEnabled, service_charge_rate: serviceChargeRate,
      rounding,
    }))
    // Only store public keys in localStorage
    localStorage.setItem('integrationSettings', JSON.stringify({
      midtrans: {
        enabled: midtransEnabled, client_key: midtransClientKey,
        merchant_id: midtransMerchantId,
        environment: midtransEnv,
      },
    }))
    // Store sensitive keys (server_key) on backend only
    apiClient.post('/api/settings/midtrans', {
      server_key: midtransServerKey,
      client_key: midtransClientKey,
      merchant_id: midtransMerchantId,
      environment: midtransEnv,
      enabled: midtransEnabled,
    }).catch((err) => showNotif('error', 'Gagal menyimpan konfigurasi Midtrans', err.message))

    if (onSettingsChange) onSettingsChange()
    showNotif('success', 'Pengaturan berhasil disimpan!', 'Semua perubahan telah diterapkan.')
  }

  const togglePayment = (id) => {
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p))
  }

  const updatePayment = (id, field, value) => {
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const addPaymentMethod = () => {
    const newId = `custom_${Date.now()}`
    setPaymentMethods(prev => [...prev, { id: newId, name: 'Metode Baru', icon: 'payments', enabled: true }])
  }

  const removePaymentMethod = (id) => {
    if (id === 'cash') return
    setPaymentMethods(prev => prev.filter(p => p.id !== id))
  }

  const Toggle = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  )

  const SectionHeader = ({ icon, iconBg, iconColor, title, desc }) => (
    <div className={`px-8 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50`}>
      <div className={`p-2.5 ${iconBg} rounded-xl ${iconColor} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 leading-none">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
      {/* Header */}
      <TopBar
        title="Pengaturan"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <Button variant="primary" className="w-full lg:w-auto cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl px-6 py-2.5 font-semibold" onClick={handleSave}>
            <span className="material-symbols-outlined text-[20px]">save</span>
            Simpan Perubahan
          </Button>
        }
      />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-8 hide-scrollbar">
        <div className="space-y-8 pb-10">

          {/* ===== PROFIL ===== */}
          <section className="bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden">
            <SectionHeader icon="storefront" iconBg="bg-primary/10" iconColor="text-primary" title="Profil & Identitas" desc="Informasi utama yang tampil di aplikasi dan struk cetak" />
            <div className="p-8 space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 p-6 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="relative group shrink-0">
                  <div className="w-28 h-28 rounded-2xl bg-white flex items-center justify-center shadow-inner overflow-hidden border border-gray-200 transition-all group-hover:border-primary/40 group-hover:shadow-md">
                    {storeLogo ? (
                      <img src={storeLogo} alt="Logo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <img src={defaultLogo} alt="Default Logo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <label className="absolute -bottom-3 -right-3 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary cursor-pointer transition-all hover:scale-110 z-10">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0]; if (!file) return
                      if (file.size > 2 * 1024 * 1024) { alert('Maks 2MB'); return }
                      const r = new FileReader(); r.onloadend = () => setStoreLogo(r.result); r.readAsDataURL(file)
                    }} className="hidden" />
                  </label>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base font-bold text-gray-900">Logo Bisnis</h4>
                  <p className="text-sm text-gray-500">Format JPG/PNG, maks 2MB. Tampil di sidebar dan header struk.</p>
                  {storeLogo && (
                    <button onClick={() => setStoreLogo('')} className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">delete</span>Hapus Logo
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Toko</label>
                  <input type="text" value={storeName} onChange={e => setStoreName(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-gray-900 transition-all shadow-sm font-medium uppercase"
                    placeholder="Nama bisnis" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Telepon</label>
                  <input type="text" value={storePhone} onChange={e => setStorePhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-gray-900 transition-all shadow-sm font-medium"
                    placeholder="081234567890" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Lengkap</label>
                  <textarea value={storeAddress} onChange={e => setStoreAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-gray-900 transition-all shadow-sm resize-none h-24 font-medium"
                    placeholder="Alamat operasional toko" />
                </div>
              </div>
            </div>
          </section>

          {/* ===== METODE PEMBAYARAN ===== */}
          <section className="bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden">
            <SectionHeader icon="payments" iconBg="bg-emerald-100" iconColor="text-emerald-600" title="Metode Pembayaran" desc="Aktifkan dan atur metode pembayaran yang tersedia di kasir" />
            <div className="p-8 space-y-4">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all">
                  <Toggle checked={pm.enabled} onChange={() => togglePayment(pm.id)} />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pm.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    <span className="material-symbols-outlined text-[22px]">{pm.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <input type="text" value={pm.name} onChange={e => updatePayment(pm.id, 'name', e.target.value)}
                      className="w-full text-base font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none px-1 py-0.5"
                      placeholder="Nama metode" />
                  </div>
                  <select value={pm.icon} onChange={e => updatePayment(pm.id, 'icon', e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shrink-0">
                    {PAYMENT_ICONS.map(ic => (
                      <option key={ic.value} value={ic.value}>{ic.label}</option>
                    ))}
                  </select>
                  {pm.id !== 'cash' && (
                    <button onClick={() => removePaymentMethod(pm.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addPaymentMethod}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Tambah Metode Pembayaran
              </button>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Metode yang tidak aktif tidak akan muncul di layar kasir.
              </p>
            </div>
          </section>

          {/* ===== PAJAK & BIAYA ===== */}
          <section className="bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden">
            <SectionHeader icon="receipt_long" iconBg="bg-amber-100" iconColor="text-amber-600" title="Pajak & Biaya Tambahan" desc="Konfigurasi PPN, biaya layanan, dan pembulatan" />
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 bg-white hover:border-amber-300 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">receipt</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">PPN (Pajak Pertambahan Nilai)</h4>
                    <p className="text-sm text-gray-500">Pajak standar atas setiap transaksi penjualan</p>
                  </div>
                </div>
                <Toggle checked={ppnEnabled} onChange={() => setPpnEnabled(!ppnEnabled)} />
              </div>
              {ppnEnabled && (
                <div className="pl-16 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tarif PPN (%)</label>
                    <div className="relative">
                      <input type="number" value={ppnRate} onChange={e => setPpnRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 font-bold text-lg focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none" min="0" max="100" step="0.5" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                  </div>
                  <div className="flex items-end pb-3">
                    <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                      Tarif PPN standar Indonesia saat ini adalah 11%
                    </p>
                  </div>
                </div>
              )}

              <hr className="border-gray-100" />

              <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 bg-white hover:border-amber-300 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">room_service</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Biaya Layanan (Service Charge)</h4>
                    <p className="text-sm text-gray-500">Biaya tambahan untuk layanan, biasanya untuk restoran/kafe</p>
                  </div>
                </div>
                <Toggle checked={serviceChargeEnabled} onChange={() => setServiceChargeEnabled(!serviceChargeEnabled)} />
              </div>
              {serviceChargeEnabled && (
                <div className="pl-16 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tarif Service Charge (%)</label>
                    <div className="relative">
                      <input type="number" value={serviceChargeRate} onChange={e => setServiceChargeRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 font-bold text-lg focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none" min="0" max="100" step="0.5" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              )}

              <hr className="border-gray-100" />

              <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 bg-white hover:border-amber-300 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">currency_exchange</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Pembulatan Total</h4>
                    <p className="text-sm text-gray-500">Bulatkan total transaksi ke ribuan terdekat untuk memudahkan kembalian</p>
                  </div>
                </div>
                <Toggle checked={rounding} onChange={() => setRounding(!rounding)} />
              </div>
            </div>
          </section>

          {/* ===== INTEGRASI ===== */}
          <section className="bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden">
            <SectionHeader icon="api" iconBg="bg-violet-100" iconColor="text-violet-600" title="Integrasi & Koneksi" desc="Hubungkan sistem dengan layanan pembayaran dan platform eksternal" />
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 bg-white hover:border-violet-300 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 font-black text-sm">
                    MT
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-gray-900">Midtrans</h4>
                      <span className="px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-wider">Populer</span>
                    </div>
                    <p className="text-sm text-gray-500">Payment gateway: terima pembayaran kartu, transfer, QRIS, GoPay, OVO, dan lainnya</p>
                  </div>
                </div>
                <Toggle checked={midtransEnabled} onChange={() => setMidtransEnabled(!midtransEnabled)} />
              </div>
              {midtransEnabled && (
                <div className="pl-16 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setMidtransEnv('sandbox')}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${midtransEnv === 'sandbox' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      <span className="material-symbols-outlined text-[14px] align-text-bottom">science</span> Sandbox
                    </button>
                    <button onClick={() => setMidtransEnv('production')}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${midtransEnv === 'production' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      <span className="material-symbols-outlined text-[14px] align-text-bottom">rocket_launch</span> Production
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Merchant ID</label>
                      <input type="text" value={midtransMerchantId} onChange={e => setMidtransMerchantId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 font-medium focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none"
                        placeholder="G123456789" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Key</label>
                      <input type="text" value={midtransClientKey} onChange={e => setMidtransClientKey(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 font-mono text-sm focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none"
                        placeholder="SB-Mid-client-xxxxx" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Server Key</label>
                      <div className="relative">
                        <input type="password" value={midtransServerKey} onChange={e => setMidtransServerKey(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 font-mono text-sm focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none"
                          placeholder="SB-Mid-server-xxxxx" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Disimpan aman di perangkat</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    API key disimpan secara lokal di browser Anda dan tidak dikirim ke server lain.
                    <a href="https://midtrans.com" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline font-medium ml-1">Daftar Midtrans</a>
                  </p>
                </div>
              )}

              <hr className="border-gray-100" />

              <div className="p-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">extension</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Integrasi Lainnya</h4>
                    <p className="text-sm text-gray-500">Dukungan untuk Xendit, iPaymu, Shopify, dan platform lainnya segera hadir</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-black uppercase tracking-wider">Segera</span>
              </div>
            </div>
          </section>

          {/* ===== STRUK ===== */}
          <section className="bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden">
            <SectionHeader icon="receipt_long" iconBg="bg-blue-100" iconColor="text-blue-600" title="Konfigurasi Struk" desc="Sesuaikan tampilan struk cetak pelanggan" />
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pesan Footer Struk</label>
                <textarea value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 transition-all resize-none h-20 font-mono text-sm"
                  placeholder="Terima kasih atas kunjungan Anda" />
                <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Ditampilkan di bagian paling bawah struk.
                </p>
              </div>
            </div>
          </section>



        </div>
      </div>

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl bg-gray-900 text-white shadow-2xl animate-slide-up">
          <span className="material-symbols-outlined text-green-400 text-[24px]">check_circle</span>
          <div>
            <span className="text-sm font-bold block">{notification.message}</span>
            <span className="text-xs text-gray-400">{notification.sub}</span>
          </div>
        </div>
      )}
    </div>
  )
}
