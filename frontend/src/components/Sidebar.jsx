import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/pekalipan-logo.jpg'

export function Sidebar({ isOpen, onClose, currentTab, onTabSelect }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'kasir', label: 'Kasir', icon: 'point_of_sale' },
    { id: 'produk', label: 'Produk', icon: 'inventory_2' },
    { id: 'kategori', label: 'Kategori', icon: 'category' },
    { id: 'transaksi', label: 'Transaksi', icon: 'receipt_long' },
    { id: 'laporan', label: 'Laporan', icon: 'analytics' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings' },
  ]

  return (
    <>
      {/* Backdrop for mobile view */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed left-0 top-0 h-full flex flex-col z-50 w-sidebar-width border-r border-outline-variant bg-surface transition-transform duration-300 ease-in-out lg:z-40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-lg flex items-center justify-between border-b border-outline-variant h-[72px] bg-surface z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-outline-variant/50">
              <img src={logo} alt="Pekalipan Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-title-md font-black text-primary leading-tight tracking-tight">PEKALIPAN</h1>
              <p className="text-label-sm text-on-surface-variant tracking-widest font-semibold uppercase text-[10px]">Cirebon</p>
            </div>
          </div>
          
          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col pt-6 gap-2 overflow-y-auto hide-scrollbar relative z-0">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id
            // Dashboard is at /dashboard
            // Kasir is at /
            // Others are at /{id}
            const href = item.id === 'kasir' ? '/' : item.id === 'dashboard' ? '/dashboard' : `/${item.id}`
            return (
              <Link
                key={item.id}
                to={href}
                onClick={(e) => {
                  if (onTabSelect) onTabSelect(item.id)
                  onClose()
                }}
                className={`group flex items-center gap-4 px-4 py-3 mx-4 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary font-bold shadow-md shadow-primary/20 scale-[1.02]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:scale-[1.02]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${
                    isActive ? 'filled-icon scale-110' : 'group-hover:scale-110'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-body-md tracking-wide">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 mx-4 mb-6 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex flex-col gap-2 mt-auto shadow-sm">
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-[20px] text-primary animate-pulse">storefront</span>
            <span className="text-label-md font-bold">Kasir Aktif</span>
          </div>
          <p className="text-body-sm text-on-surface-variant">Sistem Point of Sale siap melayani pelanggan.</p>
        </div>
      </aside>
    </>
  )
}
