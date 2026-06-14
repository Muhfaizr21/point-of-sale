import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logoSentrakas from '../../assets/Sentrakas.png'

const MENU_GROUPS = [
  {
    title: 'Ringkasan & Data',
    items: [
      { id: 'overview', label: 'Ringkasan Platform', icon: 'dashboard', path: '/superadmin' },
      { id: 'analytics', label: 'AI & Analitik', icon: 'insights', path: '/superadmin/analytics' },
    ]
  },
    {
      title: 'Manajemen',
      items: [
        { id: 'tenants', label: 'Daftar Klien / Toko', icon: 'storefront', path: '/superadmin/tenants' },
        { id: 'billing', label: 'Langganan & Tagihan', icon: 'credit_card', path: '/superadmin/billing' },
        { id: 'broadcasts', label: 'Pengumuman Global', icon: 'campaign', path: '/superadmin/broadcasts' },
        { id: 'integrations', label: 'Integrasi Aplikasi', icon: 'settings', path: '/superadmin/integrations' },
      ]
    },
    {
      title: 'Keuangan & Sistem',
      items: [
        { id: 'finance-revenue', label: 'Ringkasan Keuangan', icon: 'trending_up', path: '/superadmin/finance-revenue' },
        { id: 'finance-orders', label: 'Semua Transaksi', icon: 'receipt_long', path: '/superadmin/finance-orders' },
        { id: 'finance-merchants', label: 'Pendapatan Merchant', icon: 'storefront', path: '/superadmin/finance-merchants' },
        { id: 'finance-payments', label: 'Riwayat Pembayaran', icon: 'credit_card', path: '/superadmin/finance-payments' },
        { id: 'finance-health', label: 'Kesehatan Sistem', icon: 'monitor_heart', path: '/superadmin/finance-health' },
      { id: 'demographics', label: 'Demografi Toko', icon: 'map', path: '/superadmin/demographics' },
      { id: 'export', label: 'Export Data', icon: 'file_download', path: '/superadmin/export' },
      ]
    },
    {
      title: 'Pengaturan & Logs',
      items: [
        { id: 'audit-log', label: 'Audit Trail', icon: 'history', path: '/superadmin/audit-log' },
        { id: 'platform-settings', label: 'Pengaturan Platform', icon: 'settings', path: '/superadmin/platform-settings' },
        { id: 'maintenance', label: 'Mode Maintenance', icon: 'construction', path: '/superadmin/maintenance' },
        { id: 'support-inbox', label: 'Kotak Masuk CS', icon: 'mail', path: '/superadmin/support-inbox' },
        { id: 'tickets', label: 'Tiket Support', icon: 'confirmation_number', path: '/superadmin/tickets' },
      ]
    },
]

export function SuperadminSidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      <aside className={`w-[260px] bg-[#0a0a0a] border-r border-white/5 flex flex-col h-full z-50 fixed lg:relative transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      <div className="h-[72px] flex items-center justify-center border-b border-white/5 px-6">
        <img src={logoSentrakas} alt="SentraKas Logo" className="h-12 w-auto object-contain brightness-0 invert" />
      </div>
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto pb-24">
        {MENU_GROUPS.map((group, gIdx) => (
          <div key={gIdx}>
            <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(item => (
                <button key={item.id} onClick={() => { navigate(item.path); if(onClose) onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-sm font-medium ${
                    currentPath === item.path
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}>
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5 bg-[#050505]">
        <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white/10">SA</div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[13px] font-semibold text-white/90 truncate">System Admin</p>
            <p className="text-[10px] text-emerald-400 font-medium">Platform Owner</p>
          </div>
        </div>
        <button onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/60 transition-all cursor-pointer text-xs font-semibold">
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Logout
        </button>
      </div>
    </aside>
    </>
  )
}
