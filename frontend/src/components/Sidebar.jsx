import React from 'react'
import logo from '../assets/pekalipan-logo.jpg'

export function Sidebar({ isOpen, onClose, currentTab, onTabSelect }) {
  const menuItems = [
    { id: 'kasir', label: 'Kasir', icon: 'point_of_sale' },
    { id: 'produk', label: 'Produk', icon: 'inventory_2' },
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
        <div className="p-md flex items-center justify-between border-b border-outline-variant h-[72px]">
          <div className="flex items-center gap-md">
            <img src={logo} alt="Pekalipan Logo" className="w-10 h-10 object-cover rounded" />
            <div>
              <h1 className="text-headline-md font-black text-primary leading-tight">KOPI PEKALIPAN</h1>
              <p className="text-label-sm text-on-surface-variant">CIREBON</p>
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
        <nav className="flex-1 flex flex-col pt-md">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id
            return (
              <a
                key={item.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onTabSelect(item.id)
                  onClose()
                }}
                className={`flex items-center gap-md px-md py-sm border-l-4 transition-all duration-200 ease-in-out cursor-pointer hover:bg-surface-container-low ${
                  isActive
                    ? 'border-primary text-primary font-bold bg-surface-container-high'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[24px] ${
                    isActive ? 'filled-icon' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-body-md">{item.label}</span>
              </a>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
