import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiClient } from '../../services/apiClient'
import defaultLogo from '../../assets/pekalipan-logo.jpg'


export function Sidebar({ isOpen, onClose, currentTab, onTabSelect, storeName, storeLogo, storeAddress, activeBranch, onBranchChange, branchRefreshKey }) {
  const { user, hardLogout } = useAuth()
  const navigate = useNavigate()
  const isOwner = user?.role === 'owner'
  const [branches, setBranches] = useState([])
  const [branchOpen, setBranchOpen] = useState(false)

  useEffect(() => {
    if (isOwner) {
      apiClient.get('/api/branches').then(d => setBranches(d || [])).catch(() => {})
    }
  }, [isOwner, branchRefreshKey])

  const city = React.useMemo(() => {
    if (!storeAddress) return 'Cirebon'
    const parts = storeAddress.split(',')
    return parts[parts.length - 1]?.trim() || 'Cirebon'
  }, [storeAddress])

  const menuGroups = [
    {
      title: 'Menu Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'kasir', label: 'Kasir', icon: 'point_of_sale' },
      ]
    },

    ...(isOwner ? [{
      title: 'Cabang',
      items: [
        { id: 'cabang', label: 'Kelola Cabang', icon: 'store' },
      ]
    }] : []),
    {
      title: 'Manajemen',
      items: [
        { id: 'produk', label: 'Produk', icon: 'inventory_2' },
        { id: 'kategori', label: 'Kategori', icon: 'category' },
        { id: 'bundel', label: 'Paket Bundling', icon: 'inventory' },
      ]
    },
    {
      title: 'Aktivitas & Data',
      items: [
        { id: 'pesanan', label: 'Pesanan', icon: 'list_alt' },
        { id: 'transaksi', label: 'Transaksi', icon: 'receipt_long' },
        { id: 'laporan', label: 'Laporan', icon: 'analytics' },
        { id: 'modal', label: 'Modal', icon: 'savings' },
        { id: 'pengeluaran', label: 'Pengeluaran', icon: 'money_off' },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { id: 'promo', label: 'Promo Diskon', icon: 'local_offer' },
    { id: 'stok', label: 'Manajemen Stok', icon: 'inventory' },
    { id: 'supplier', label: 'Supplier', icon: 'local_shipping' },
    { id: 'tema', label: 'Tema', icon: 'palette' },
    { id: 'hakakses', label: 'Hak Akses', icon: 'admin_panel_settings' },
    { id: 'support', label: 'Hubungi CS', icon: 'headset_mic' },
    { id: 'integrasi', label: 'Integrasi & Layanan', icon: 'api' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings' },
  ]
    }
  ]

  const getRBAC = () => {
    try {
      const raw = localStorage.getItem('rbacConfig')
      if (!raw) return null
      return JSON.parse(raw)
    } catch { return null }
  }

  const hasView = (itemId) => {
    if (isOwner) return true
    const rbac = getRBAC()
    if (!rbac || !rbac.permissions || !rbac.permissions[user?.role]) {
      return ['kasir', 'transaksi'].includes(itemId)
    }
    return rbac.permissions[user?.role]?.[itemId]?.read === true
  }

  const allowedGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (isOwner && item.id === 'hakakses') return true
      return hasView(item.id)
    })
  })).filter(group => group.items.length > 0)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full flex flex-col z-50 w-sidebar-width border-r border-outline-variant bg-surface transition-transform duration-300 ease-in-out lg:z-40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-lg flex items-center justify-between border-b border-outline-variant h-[72px] bg-surface z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-outline-variant/50">
              {storeLogo ? (
                <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
              ) : (
                <img src={defaultLogo} alt="Pekalipan Logo" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-title-md font-black text-primary leading-tight tracking-tight uppercase truncate max-w-[120px]" title={storeName || 'PEKALIPAN'}>
                {storeName || 'PEKALIPAN'}
              </h1>
              <p className="text-label-sm text-on-surface-variant tracking-widest font-semibold uppercase text-[10px] truncate max-w-[120px]" title={city}>
                {city}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {isOwner && branches.length > 0 && (
          <div className="px-4 pt-3 pb-1 relative">
            <button onClick={() => setBranchOpen(!branchOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-high text-on-surface text-label-sm font-medium hover:bg-surface-container-higher transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-primary">store</span>
              <span className="flex-1 text-left truncate">{activeBranch ? branches.find(b => b.id === activeBranch)?.name || 'Semua Cabang' : 'Semua Cabang'}</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{branchOpen ? 'expand_less' : 'expand_more'}</span>
            </button>
            {branchOpen && (
              <div className="absolute left-4 right-4 top-full mt-1 z-50 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden">
                <button onClick={() => { onBranchChange(null); setBranchOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-label-sm hover:bg-surface-container-high transition-colors cursor-pointer ${!activeBranch ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface'}`}>
                  Semua Cabang
                </button>
                {branches.filter(b => b.active).map(b => (
                  <button key={b.id} onClick={() => { onBranchChange(b.id); setBranchOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-label-sm hover:bg-surface-container-high transition-colors cursor-pointer ${activeBranch === b.id ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface'}`}>
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 flex flex-col pt-3 gap-6 overflow-y-auto hide-scrollbar relative z-0 pb-6">
          {allowedGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-1">
              <h3 className="px-8 text-[11px] font-bold tracking-wider text-on-surface-variant uppercase mb-1">
                {group.title}
              </h3>
              {group.items.map((item) => {
                const isActive = currentTab === item.id
                const href = item.id === 'superadmin' ? '/superadmin' : `/merchant/${item.id}`
                return (
                  <Link
                    key={item.id}
                    to={href}
                    onClick={() => { if (onTabSelect) onTabSelect(item.id); onClose() }}
                    className={`group flex items-center gap-4 px-4 py-2.5 mx-4 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
                      isActive
                        ? 'bg-primary text-on-primary font-bold shadow-md shadow-primary/20 scale-[1.02]'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:scale-[1.02]'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[22px] transition-transform duration-300 ${isActive ? 'filled-icon scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </span>
                    <span className="text-body-sm font-medium tracking-wide">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="mx-3 mb-3 rounded-2xl bg-surface-container-high border border-outline-variant/30 mt-auto shadow-sm overflow-hidden">
          <div className="flex items-center px-3 py-2.5 border-b border-outline-variant/20">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-primary">person</span>
            </div>
            <div className="flex-1 min-w-0 ml-2">
              <p className="text-label-sm font-bold text-on-surface truncate leading-tight">{user?.name || 'User'}</p>
              <p className="text-label-xs text-on-surface-variant capitalize truncate leading-tight">{user?.role || '-'}</p>
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => { hardLogout(); navigate('/login', { replace: true }) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { hardLogout(); navigate('/login', { replace: true }) } }}
            className="flex items-center justify-center gap-2 py-2 text-label-sm font-medium text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Keluar
          </div>
        </div>
      </aside>
    </>
  )
}
