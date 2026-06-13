import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { apiClient } from '../../services/apiClient'
import { TopBar } from '../common/TopBar'

export function StockPage({ products: initialProducts = [], onToggleSidebar, onRefreshProducts }) {
  const [products, setProducts] = useState(initialProducts)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState('semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjProduct, setAdjProduct] = useState('')
  const [adjChange, setAdjChange] = useState('')
  const [adjNote, setAdjNote] = useState('')
  const [adjError, setAdjError] = useState(null)
  const [adjSuccess, setAdjSuccess] = useState(null)

  // Sync products from parent & always fetch fresh
  useEffect(() => { setProducts(initialProducts) }, [initialProducts])

  const fetchAll = useCallback(async () => {
    try {
      const [prodData, logData] = await Promise.all([
        apiClient.get('/api/products'),
        apiClient.get('/api/stock/logs/all'),
      ])
      setProducts(prodData || [])
      setLogs(logData || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => { setPage(1) }, [selectedProduct, searchQuery])

  const trackableProducts = useMemo(() => products.filter(p => p.track_stock !== false), [products])
  const lowStock = useMemo(() => trackableProducts.filter(p => p.stock > 0 && p.stock <= 5), [trackableProducts])
  const outOfStock = useMemo(() => trackableProducts.filter(p => p.stock <= 0), [trackableProducts])
  const totalStockValue = useMemo(() => trackableProducts.reduce((sum, p) => sum + p.stock * (p.cost_price || 0), 0), [trackableProducts])

  const filtered = useMemo(() => {
    let list = [...logs]
    if (selectedProduct !== 'semua') list = list.filter(l => l.product_id === parseInt(selectedProduct))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(l => l.product?.name?.toLowerCase().includes(q))
    }
    return list
  }, [logs, selectedProduct, searchQuery])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page])

  const handleAdjust = async (e) => {
    e.preventDefault()
    if (!adjProduct || !adjChange) return
    setAdjError(null)
    setAdjSuccess(null)
    try {
      const change = parseInt(adjChange)
      if (change === 0) { setAdjError('Perubahan tidak boleh 0'); return }
      const prod = products.find(p => p.id === parseInt(adjProduct))
      if (prod && !prod.track_stock) { setAdjError('Stok produk ini tidak dilacak'); return }
      await apiClient.post('/api/stock/adjust', {
        product_id: parseInt(adjProduct),
        change,
        note: adjNote,
      })
      await fetchAll()
      if (onRefreshProducts) onRefreshProducts()
      setAdjSuccess(`Stok ${prod?.name || ''} berhasil disesuaikan`)
      setAdjChange('')
      setAdjNote('')
      setTimeout(() => { setIsAdjustOpen(false); setAdjSuccess(null) }, 800)
    } catch (err) { setAdjError(err.message) }
  }

  const quickAdjust = async (productId, amount) => {
    if (!productId || amount === 0) return
    try {
      await apiClient.post('/api/stock/adjust', {
        product_id: productId,
        change: amount,
        note: amount > 0 ? 'Restock cepat' : 'Koreksi cepat',
      })
      await fetchAll()
      if (onRefreshProducts) onRefreshProducts()
    } catch (err) { alert(err.message) }
  }

  const openAdjust = (productId = '') => {
    setAdjProduct(String(productId || ''))
    setAdjChange('')
    setAdjNote('')
    setAdjError(null)
    setAdjSuccess(null)
    setIsAdjustOpen(true)
  }

  const getStockLevel = (stock) => {
    if (stock <= 0) return { label: 'Habis', class: 'bg-red-100 text-red-800 border-red-300' }
    if (stock <= 5) return { label: 'Kritis', class: 'bg-orange-100 text-orange-800 border-orange-300' }
    if (stock <= 15) return { label: 'Menipis', class: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    return { label: 'Aman', class: 'bg-green-100 text-green-800 border-green-300' }
  }

  const formatPrice = (v) => v != null ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v).replace('IDR', 'Rp') : 'Rp0'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      <TopBar
        title="Manajemen Stok"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <button type="button" onClick={() => openAdjust()}
            className="rounded-lg font-headline-md font-semibold transition-colors cursor-pointer bg-primary text-on-primary hover:bg-surface-tint py-2 px-4 flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span> Penyesuaian Stok
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-lg space-y-lg hide-scrollbar">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          <div className="bg-surface rounded-xl border border-outline-variant p-md shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">inventory_2</span></div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Total Produk</p>
                <p className="text-headline-md font-bold text-on-surface">{trackableProducts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-outline-variant p-md shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700"><span className="material-symbols-outlined">check_circle</span></div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Stok Aman</p>
                <p className="text-headline-md font-bold text-green-700">{trackableProducts.filter(p => p.stock > 15).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-outline-variant p-md shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700"><span className="material-symbols-outlined">warning</span></div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Stok Menipis</p>
                <p className="text-headline-md font-bold text-orange-700">{lowStock.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-outline-variant p-md shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700"><span className="material-symbols-outlined">dangerous</span></div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Stok Habis</p>
                <p className="text-headline-md font-bold text-red-700">{outOfStock.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="p-md bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
            <p className="text-body-sm font-semibold text-orange-800 flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
              {lowStock.length} produk dengan stok menipis — segera restock
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-200 rounded-full text-label-sm text-orange-700 cursor-pointer hover:border-orange-400 hover:shadow-sm transition-all" onClick={() => openAdjust(p.id)}>
                  <span className="font-medium">{p.name}</span>
                  <span className="font-bold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[11px]">{p.stock}</span>
                  <span className="material-symbols-outlined text-[14px] text-orange-400">add_circle</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Product Stock List */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row gap-md sm:items-center justify-between">
            <h3 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">inventory</span>
              Stok Produk
            </h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari produk..." className="w-full pl-9 pr-3 py-2 border border-outline-variant bg-surface rounded-lg text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {trackableProducts.length === 0 ? (
              <div className="p-xl text-center text-on-surface-variant">Belum ada produk dengan tracking stok.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                    <th className="p-md font-semibold">Produk</th>
                    <th className="p-md font-semibold">SKU</th>
                    <th className="p-md font-semibold">Harga Pokok</th>
                    <th className="p-md font-semibold text-center">Stok</th>
                    <th className="p-md font-semibold text-right">Nilai Stok</th>
                    <th className="p-md font-semibold text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {trackableProducts
                    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(p => {
                      const level = getStockLevel(p.stock)
                      return (
                        <tr key={p.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                          <td className="p-md">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[16px] ${level.class}`}>
                                <span className="material-symbols-outlined text-[18px]">{p.icon || 'inventory'}</span>
                              </span>
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-label-xs text-on-surface-variant">{p.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-md text-label-sm text-on-surface-variant font-mono">{p.sku || '-'}</td>
                          <td className="p-md font-medium">{formatPrice(p.cost_price)}</td>
                          <td className="p-md text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-bold border ${level.class}`}>
                              <span className="material-symbols-outlined text-[14px]">
                                {p.stock <= 0 ? 'block' : p.stock <= 5 ? 'error_outline' : p.stock <= 15 ? 'info' : 'check_circle'}
                              </span>
                              {p.stock}
                            </span>
                          </td>
                          <td className="p-md text-right font-medium">{formatPrice(p.stock * (p.cost_price || 0))}</td>
                          <td className="p-md text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => quickAdjust(p.id, -1)} disabled={p.stock <= 0}
                                className="w-7 h-7 rounded-md border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all">
                                <span className="material-symbols-outlined text-[14px]">remove</span>
                              </button>
                              <button onClick={() => openAdjust(p.id)}
                                className="w-7 h-7 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center cursor-pointer transition-all">
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                              </button>
                              <button onClick={() => quickAdjust(p.id, 1)}
                                className="w-7 h-7 rounded-md border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-green-300 hover:bg-green-50 hover:text-green-600 cursor-pointer transition-all">
                                <span className="material-symbols-outlined text-[14px]">add</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Riwayat Log Stok */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row gap-md sm:items-center justify-between">
            <h3 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">history</span>
              Riwayat Penyesuaian
            </h3>
            {logs.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-label-sm text-on-surface-variant">Filter:</span>
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="px-3 py-1.5 border border-outline-variant bg-surface rounded-lg text-body-sm font-semibold text-on-surface cursor-pointer outline-none">
                  <option value="semua">Semua Produk</option>
                  {trackableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span></div>
          ) : paginated.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[40px]">history_toggle_off</span>
              <p>Belum ada riwayat penyesuaian stok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                    <th className="p-md font-semibold">Waktu</th>
                    <th className="p-md font-semibold">Produk</th>
                    <th className="p-md font-semibold text-center">Perubahan</th>
                    <th className="p-md font-semibold text-center">Stok Akhir</th>
                    <th className="p-md font-semibold">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {paginated.map(log => (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                      <td className="p-md text-label-sm text-on-surface-variant whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="p-md font-medium">{log.product?.name || `ID:${log.product_id}`}</td>
                      <td className="p-md text-center">
                        <div className="flex items-center justify-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-bold ${
                            log.change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">{log.change > 0 ? 'add' : 'remove'}</span>
                            {log.change > 0 ? `+${log.change}` : log.change}
                          </span>
                        </div>
                      </td>
                      <td className="p-md text-center font-bold text-on-surface">{log.remaining}</td>
                      <td className="p-md text-label-sm text-on-surface-variant">{log.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-lg py-md border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <span className="text-label-sm text-on-surface-variant">Menampilkan {((page-1)*PER_PAGE)+1}-{Math.min(page*PER_PAGE, filtered.length)} dari {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest disabled:opacity-50 cursor-pointer text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {Array.from({length: totalPages}).map((_, i) => {
                  const pn = i+1
                  if (pn===1||pn===totalPages||(pn>=page-1&&pn<=page+1))
                    return <button key={pn} onClick={() => setPage(pn)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-body-sm font-bold cursor-pointer ${page===pn?'bg-primary text-on-primary':'text-on-surface hover:bg-surface-container-highest'}`}>{pn}</button>
                  if (pn===page-2||pn===page+2) return <span key={pn} className="text-on-surface-variant px-1">...</span>
                  return null
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest disabled:opacity-50 cursor-pointer text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Modal */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex justify-center p-md bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setIsAdjustOpen(false)}>
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/30 my-auto" onClick={e => e.stopPropagation()}>
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary">compare_arrows</span>
                Penyesuaian Stok
              </h3>
              <button type="button" onClick={() => setIsAdjustOpen(false)} className="p-1 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-lg space-y-4">
              {adjError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span className="text-label-sm">{adjError}</span>
                </div>
              )}
              {adjSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2 text-green-700">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span className="text-label-sm">{adjSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAdjust} className="space-y-4">
                {/* Product Selection */}
                <div>
                  <label className="text-label-sm font-semibold text-on-surface-variant block mb-1.5">Produk</label>
                  <select required value={adjProduct} onChange={e => setAdjProduct(e.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant bg-surface rounded-xl text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                    <option value="">— Pilih Produk —</option>
                    {trackableProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stok: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Stock Display */}
                {adjProduct && (
                  <div className="p-3 bg-surface-container-high rounded-xl flex items-center justify-between">
                    <span className="text-label-sm text-on-surface-variant">Stok Saat Ini</span>
                    <span className="text-headline-sm font-bold text-on-surface">
                      {products.find(p => p.id === parseInt(adjProduct))?.stock ?? '-'}
                    </span>
                  </div>
                )}

                {/* Quick Preset Buttons */}
                <div>
                  <label className="text-label-sm font-semibold text-on-surface-variant block mb-1.5">Tambah Stok</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 5, 10, 20, 50].map(n => (
                      <button key={n} type="button" onClick={() => setAdjChange(String(n))}
                        className={`py-2 rounded-xl border-2 font-semibold text-body-sm cursor-pointer transition-all ${
                          adjChange === String(n) ? 'border-green-500 bg-green-50 text-green-700' : 'border-outline-variant text-on-surface-variant hover:border-green-300 hover:bg-green-50'
                        }`}>
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-label-sm font-semibold text-on-surface-variant block mb-1.5">Kurangi Stok</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 5, 10, 20, 50].map(n => (
                      <button key={n} type="button" onClick={() => setAdjChange(`-${n}`)}
                        className={`py-2 rounded-xl border-2 font-semibold text-body-sm cursor-pointer transition-all ${
                          adjChange === `-${n}` ? 'border-red-500 bg-red-50 text-red-700' : 'border-outline-variant text-on-surface-variant hover:border-red-300 hover:bg-red-50'
                        }`}>
                        -{n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="text-label-sm font-semibold text-on-surface-variant block mb-1.5">Atau Masukkan Manual</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </div>
                    <input type="number" value={adjChange} onChange={e => setAdjChange(e.target.value)}
                      placeholder="+10 atau -5"
                      className="w-full pl-10 pr-4 py-3 border border-outline-variant bg-surface rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  </div>
                  <p className="text-label-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Positif = tambah stok, Negatif = kurangi stok
                  </p>
                </div>

                {/* Note Presets */}
                <div>
                  <label className="text-label-sm font-semibold text-on-surface-variant block mb-1.5">Catatan (opsional)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['Restock Supplier', 'Koreksi Stok', 'Barang Rusak', 'Hilang', 'Retur'].map(note => (
                      <button key={note} type="button" onClick={() => setAdjNote(adjNote === note ? '' : note)}
                        className={`px-3 py-1.5 rounded-lg border text-label-sm font-medium cursor-pointer transition-all ${
                          adjNote === note ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                        }`}>
                        {note}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
                    placeholder="Atau tulis sendiri..."
                    className="w-full px-4 py-3 border border-outline-variant bg-surface rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsAdjustOpen(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-primary hover:bg-primary/5 cursor-pointer transition-colors border border-outline-variant">
                    Batal
                  </button>
                  <button type="submit"
                    className="flex-1 py-3 rounded-xl bg-primary text-on-primary hover:bg-surface-tint font-semibold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
