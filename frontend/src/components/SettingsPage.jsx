import React, { useState } from 'react'
import { Button } from './common/Button'
import { Input } from './common/Input'

export function SettingsPage({ onToggleSidebar }) {
  const [storeName, setStoreName] = useState('Toko Serba Ada')
  const [storeAddress, setStoreAddress] = useState('Jl. Jend. Sudirman No. 123, Jakarta')
  const [storePhone, setStorePhone] = useState('081234567890')
  const [receiptFooter, setReceiptFooter] = useState('Terima Kasih atas Kunjungan Anda')
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md px-lg py-md border-b border-outline-variant bg-surface z-20">
        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div>
            <h2 className="text-headline-md text-on-surface font-semibold">Pengaturan</h2>
            <p className="text-label-sm text-on-surface-variant">
              Kelola informasi toko dan preferensi aplikasi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-md w-full lg:w-auto mt-sm lg:mt-0">
          <Button variant="primary" className="w-full lg:w-auto">
            <span className="material-symbols-outlined text-[20px]">save</span>
            Simpan Perubahan
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        <div className="max-w-4xl mx-auto space-y-lg">
          
          {/* Informasi Toko */}
          <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
                Informasi Toko
              </h3>
            </div>
            <div className="p-lg space-y-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <Input
                  label="Nama Toko"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Masukkan nama toko"
                />
                <Input
                  label="Nomor Telepon"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="081xxx"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-xs">
                  Alamat Toko
                </label>
                <textarea
                  className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md transition-all resize-none h-24"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Alamat lengkap toko"
                />
              </div>
            </div>
          </section>

          {/* Struk & Printer */}
          <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                Struk & Printer
              </h3>
            </div>
            <div className="p-lg space-y-md">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-xs">
                  Pesan Footer Struk
                </label>
                <textarea
                  className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md transition-all resize-none h-20"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Terima kasih atas kunjungan Anda"
                />
                <p className="text-label-sm text-on-surface-variant mt-1">Pesan ini akan ditampilkan di bagian bawah struk yang dicetak.</p>
              </div>
              <div className="pt-4 border-t border-outline-variant">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
                  <div>
                    <h4 className="text-body-md font-medium text-on-surface">Koneksi Printer Thermal</h4>
                    <p className="text-label-sm text-on-surface-variant">Hubungkan ke printer thermal bluetooth atau USB</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto whitespace-nowrap">
                    <span className="material-symbols-outlined text-[20px]">print_connect</span>
                    Cari Printer
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Manajemen Akun */}
          <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">manage_accounts</span>
                Akun Kasir
              </h3>
            </div>
            <div className="p-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-md border border-outline-variant rounded-lg bg-surface-container-lowest gap-sm">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-title-md shrink-0">
                    A
                  </div>
                  <div>
                    <p className="text-body-md font-medium text-on-surface">Admin Utama</p>
                    <p className="text-label-sm text-on-surface-variant">admin@toko.com</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-label-xs font-bold whitespace-nowrap">
                  Aktif
                </span>
              </div>
              <Button variant="outline" className="w-full mt-md">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Tambah Akun Kasir
              </Button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
