import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { apiClient, API_BASE_URL } from '../../services/apiClient'
import { TopBar } from '../common/TopBar'

export function BundlePage({ products, onToggleSidebar, activeBranch = null }) {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [formItems, setFormItems] = useState([])
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter, Sort & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  const fetchBundles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.get(`/api/bundles${activeBranch ? `?branch_id=${activeBranch}` : ''}`)
      setBundles(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeBranch])

  useEffect(() => { fetchBundles() }, [fetchBundles])
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter, sortField, sortDir])

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40">unfold_more</span>
    return <span className="material-symbols-outlined text-[14px]">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  const processed = useMemo(() => {
    let list = [...bundles]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(b => b.name.toLowerCase().includes(q))
    }
    if (statusFilter === 'aktif') list = list.filter(b => b.active)
    else if (statusFilter === 'nonaktif') list = list.filter(b => !b.active)
    list.sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (sortField === 'name') { va = va?.toLowerCase(); vb = vb?.toLowerCase() }
      if (sortField === 'price') { va = Number(va); vb = Number(vb) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [bundles, searchQuery, statusFilter, sortField, sortDir])

  const totalPages = Math.ceil(processed.length / PER_PAGE)
  const paginated = useMemo(() => processed.slice((page - 1) * PER_PAGE, page * PER_PAGE), [processed, page])

  const handleOpenAdd = () => {
    setEditing(null); setFormName(''); setFormPrice(''); setFormIcon('')
    setImageFile(null); setImagePreview('')
    setFormItems([{ product_id: '', quantity: 1 }]); setFormError(null); setIsModalOpen(true)
  }

  const handleOpenEdit = (bundle) => {
    setEditing(bundle); setFormName(bundle.name); setFormPrice(bundle.price.toString()); setFormIcon(bundle.icon || '')
    setFormItems(bundle.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })))
    setFormError(null); setIsModalOpen(true)
    if (bundle.icon && (bundle.icon.startsWith('/') || bundle.icon.startsWith('http')))
      setImagePreview(bundle.icon.startsWith('/') ? `${API_BASE_URL}${bundle.icon}` : bundle.icon)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formName || !formPrice) return
    setFormError(null); setIsSubmitting(true)
    try {
      let iconUrl = formIcon
      if (imageFile) { const u = await apiClient.uploadFile('/api/upload', imageFile); iconUrl = u.url }
      const data = { name: formName, price: parseInt(formPrice), icon: iconUrl, items: formItems.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) || 1 })) }
      if (editing) await apiClient.put(`/api/bundles/${editing.id}`, data)
      else await apiClient.post('/api/bundles', data)
      await fetchBundles(); setIsModalOpen(false)
    } catch (err) { setFormError(err.message) }
    finally { setIsSubmitting(false) }
  }

  const formatPrice = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v).replace('IDR', 'Rp')

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      <TopBar
        title="Paket Bundling"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <button type="button" onClick={handleOpenAdd} className="rounded-lg font-headline-md font-semibold text-lg transition-colors cursor-pointer bg-primary text-on-primary hover:bg-surface-tint py-2 px-4 flex items-center gap-2">
            <span className="material-symbols-outlined">add</span> Tambah Paket
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {/* Filter Bar */}
        <div className="mb-md flex flex-col sm:flex-row gap-md sm:items-center justify-between">
          <div className="w-full sm:w-80 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama paket..." className="w-full pl-10 pr-4 py-2 border border-outline-variant bg-surface rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body-md font-semibold text-on-surface-variant">Status:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-md py-2 border border-outline-variant bg-surface rounded-lg text-body-md font-semibold text-on-surface cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              <option value="semua">Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <span className="text-label-sm text-on-surface-variant ml-2 whitespace-nowrap">{processed.length} paket</span>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold w-16">Gambar</th>
                  <th className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Nama Paket <SortIcon field="name" /></div>
                  </th>
                  <th className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('price')}>
                    <div className="flex items-center gap-1">Harga <SortIcon field="price" /></div>
                  </th>
                  <th className="p-md font-semibold">Item</th>
                  <th className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('active')}>
                    <div className="flex items-center gap-1">Status <SortIcon field="active" /></div>
                  </th>
                  <th className="p-md font-semibold text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr><td colSpan="6" className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span></td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan="6" className="p-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] block mb-xs">inventory</span>
                    {searchQuery || statusFilter !== 'semua' ? 'Tidak ada paket yang cocok dengan filter.' : 'Belum ada paket bundling.'}
                  </td></tr>
                ) : paginated.map(bundle => (
                  <tr key={bundle.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                    <td className="p-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant overflow-hidden">
                        {bundle.icon && (bundle.icon.startsWith('/') || bundle.icon.startsWith('http')) ? (
                          <img src={bundle.icon.startsWith('/') ? `${API_BASE_URL}${bundle.icon}` : bundle.icon} alt={bundle.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined">inventory</span>
                        )}
                      </div>
                    </td>
                    <td className="p-md font-medium">{bundle.name}</td>
                    <td className="p-md font-semibold">{formatPrice(bundle.price)}</td>
                    <td className="p-md">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {bundle.items?.map((item, i) => (
                          <span key={i} className="px-2 py-0.5 bg-surface-container-high border border-outline-variant/30 rounded-full text-label-xs truncate max-w-full" title={`${item.product?.name || `ID:${item.product_id}`} x${item.quantity}`}>
                            {item.product?.name || `ID:${item.product_id}`} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-md">
                      <button type="button" onClick={async () => {
                        try {
                          await apiClient.put(`/api/bundles/${bundle.id}`, {
                            name: bundle.name, price: bundle.price, icon: bundle.icon || '',
                            items: (bundle.items || []).map(i => ({ product_id: i.product_id, quantity: i.quantity })),
                            active: !bundle.active,
                          })
                          await fetchBundles()
                        } catch (err) { alert(err.message) }
                      }} className={`px-3 py-1 rounded-full text-label-sm font-medium transition-all cursor-pointer hover:scale-105 ${
                        bundle.active ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700' : 'bg-surface-container-high text-on-surface-variant hover:bg-green-50 hover:text-green-700'
                      }`} title={bundle.active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}>
                        {bundle.active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="p-md text-right whitespace-nowrap">
                      <button type="button" onClick={() => handleOpenEdit(bundle)} className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer mr-1" title="Edit"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                      <button type="button" onClick={async () => {
                        if (confirm(`Hapus paket ${bundle.name}?`)) {
                          try { await apiClient.delete(`/api/bundles/${bundle.id}`); await fetchBundles() }
                          catch (err) { alert(err.message) }
                        }
                      }} className="p-2 text-error hover:bg-error/10 rounded-full cursor-pointer" title="Hapus"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {processed.length > 0 && (
          <div className="mt-md flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant font-medium">
              Menampilkan {((page - 1) * PER_PAGE) + 1} - {Math.min(page * PER_PAGE, processed.length)} dari {processed.length} paket
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors disabled:opacity-50 cursor-pointer text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-body-sm font-bold transition-colors cursor-pointer ${page === p ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-highest'}`}>
                      {p}
                    </button>
                  )
                if (p === page - 2 || p === page + 2) return <span key={p} className="text-on-surface-variant px-1">...</span>
                return null
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors disabled:opacity-50 cursor-pointer text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden animate-slide-up border border-outline-variant/30">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface">{editing ? 'Edit Paket' : 'Tambah Paket Baru'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-lg bg-surface">
              {formError && <div className="mb-lg p-4 bg-error-container text-on-error-container rounded-lg font-medium">Error: {formError}</div>}
              <form id="bundleForm" onSubmit={handleSubmit} className="space-y-xl">
                <div className="space-y-2">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Nama Paket</label>
                  <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Paket Bukber" className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-lg text-on-surface" />
                </div>
                <div className="space-y-2">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Harga Paket (Rp)</label>
                  <input type="text" required value={formPrice} onChange={e => setFormPrice(e.target.value.replace(/\D/g, ''))} placeholder="45000" className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-lg text-on-surface" />
                </div>
                <div className="space-y-2">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Gambar Paket</label>
                  <div className="flex gap-md items-center">
                    <div className="w-20 h-20 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-[36px] border border-outline-variant shadow-sm overflow-hidden">
                      {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[36px]">inventory</span>}
                    </div>
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setImageFile(f); const r = new FileReader(); r.onloadend = () => setImagePreview(r.result); r.readAsDataURL(f) } }} className="hidden" id="bundle-image" />
                    <label htmlFor="bundle-image" className="px-4 py-2 border border-dashed border-outline-variant hover:border-primary rounded-lg text-center cursor-pointer transition-colors text-body-md font-medium text-on-surface-variant hover:text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[20px]">upload</span> Pilih Gambar
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-label-lg font-semibold text-on-surface-variant block">Item dalam Paket</label>
                    <button type="button" onClick={() => setFormItems([...formItems, { product_id: '', quantity: 1 }])} className="text-primary text-label-sm font-semibold hover:bg-primary/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">add</span> Tambah Item
                    </button>
                  </div>
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select value={item.product_id} onChange={e => { const n = [...formItems]; n[idx].product_id = e.target.value; setFormItems(n) }} required className="flex-1 px-3 py-2 border border-outline-variant bg-surface-container-high rounded-lg text-body-md text-on-surface">
                        <option value="">Pilih Produk</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} - {formatPrice(p.price)}</option>)}
                      </select>
                      <input type="number" min="1" value={item.quantity} onChange={e => { const n = [...formItems]; n[idx].quantity = parseInt(e.target.value) || 1; setFormItems(n) }} className="w-20 px-3 py-2 border border-outline-variant bg-surface-container-high rounded-lg text-body-md text-on-surface" />
                      <button type="button" onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))} className="p-2 text-error hover:bg-error/10 rounded-full cursor-pointer"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                  ))}
                </div>
              </form>
            </div>
            <div className="p-md border-t border-outline-variant flex justify-end gap-md bg-surface-container-lowest">
              <button type="button" onClick={() => setIsModalOpen(false)} className="py-3 px-6 rounded-xl font-headline-md font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer">Batal</button>
              <button type="submit" form="bundleForm" disabled={isSubmitting} className="py-3 px-6 rounded-xl bg-primary text-on-primary hover:bg-surface-tint font-headline-md font-semibold cursor-pointer disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Paket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
