import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { apiClient } from '../../services/apiClient'
import { TopBar } from '../common/TopBar'

export function CustomerPage({ onToggleSidebar }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 8

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', credit_limit: '', notes: '' })
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [detailCustomer, setDetailCustomer] = useState(null)
  const [detailOrders, setDetailOrders] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { setCustomers(await apiClient.get('/api/customers') || []) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [searchQuery])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return customers
    const q = searchQuery.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q))
  }, [customers, searchQuery])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = useMemo(() => filtered.slice((page-1)*PER_PAGE, page*PER_PAGE), [filtered, page])

  const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', email: '', address: '', credit_limit: '', notes: '' }); setFormError(null); setIsModalOpen(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, phone: c.phone||'', email: c.email||'', address: c.address||'', credit_limit: c.credit_limit?.toString()||'', notes: c.notes||'' }); setFormError(null); setIsModalOpen(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return
    setFormError(null); setIsSubmitting(true)
    try {
      const data = { ...form, credit_limit: parseInt(form.credit_limit) || 0 }
      if (editing) await apiClient.put(`/api/customers/${editing.id}`, data)
      else await apiClient.post('/api/customers', data)
      await fetchData(); setIsModalOpen(false)
    } catch (err) { setFormError(err.message) }
    finally { setIsSubmitting(false) }
  }

  const openDetail = async (c) => {
    setDetailCustomer(c)
    setDetailLoading(true)
    try {
      const orders = await apiClient.get(`/api/customers/${c.id}/orders`)
      setDetailOrders(orders || [])
    } catch (err) { console.error(err) }
    finally { setDetailLoading(false) }
  }

  const formatPrice = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v).replace('IDR', 'Rp')
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      <TopBar
        title="Daftar Pelanggan"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <button type="button" onClick={openAdd} className="rounded-lg font-headline-md font-semibold cursor-pointer bg-primary text-on-primary hover:bg-surface-tint py-2 px-4 flex items-center gap-2">
            <span className="material-symbols-outlined">add</span> Tambah Pelanggan
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        <div className="mb-md flex flex-col sm:flex-row gap-md sm:items-center justify-between">
          <div className="w-full sm:w-72 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama/telepon..." className="w-full pl-10 pr-4 py-2 border border-outline-variant bg-surface rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <span className="text-label-sm text-on-surface-variant">{filtered.length} pelanggan</span>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold">Nama</th>
                  <th className="p-md font-semibold">Telepon</th>
                  <th className="p-md font-semibold">Total Belanja</th>
                  <th className="p-md font-semibold">Limit Kredit</th>
                  <th className="p-md font-semibold text-right w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr><td colSpan="5" className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span></td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan="5" className="p-xl text-center text-on-surface-variant">Belum ada pelanggan.</td></tr>
                ) : paginated.map(c => (
                  <tr key={c.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                    <td className="p-md font-medium">{c.name}</td>
                    <td className="p-md">{c.phone || '-'}</td>
                    <td className="p-md font-semibold">{formatPrice(c.total_spent || 0)}</td>
                    <td className="p-md">{c.credit_limit > 0 ? formatPrice(c.credit_limit) : '-'}</td>
                    <td className="p-md text-right whitespace-nowrap">
                      <button type="button" onClick={() => openDetail(c)} className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer mr-1" title="Riwayat"><span className="material-symbols-outlined text-[20px]">receipt_long</span></button>
                      <button type="button" onClick={() => openEdit(c)} className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer mr-1" title="Edit"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                      <button type="button" onClick={async () => {
                        if (confirm(`Hapus pelanggan ${c.name}?`)) { try { await apiClient.delete(`/api/customers/${c.id}`); await fetchData() } catch(err) { alert(err.message) } }
                      }} className="p-2 text-error hover:bg-error/10 rounded-full cursor-pointer" title="Hapus"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {filtered.length > 0 && (
          <div className="mt-md flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">Menampilkan {((page-1)*PER_PAGE)+1}-{Math.min(page*PER_PAGE, filtered.length)} dari {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest disabled:opacity-50 cursor-pointer"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
              {Array.from({length: totalPages}).map((_, i) => { const p = i+1; if (p===1||p===totalPages||(p>=page-1&&p<=page+1)) return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-body-sm font-bold cursor-pointer ${page===p?'bg-primary text-on-primary':'text-on-surface hover:bg-surface-container-highest'}`}>{p}</button>; if (p===page-2||p===page+2) return <span key={p} className="text-on-surface-variant px-1">...</span>; return null })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest disabled:opacity-50 cursor-pointer"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 backdrop-blur-md animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up border border-outline-variant/30" onClick={e => e.stopPropagation()}>
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface">{editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-lg bg-surface">
              {formError && <div className="mb-3 p-3 bg-error-container text-on-error-container rounded-lg text-label-sm">{formError}</div>}
              <form id="customerForm" onSubmit={handleSubmit} className="space-y-4">
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama Pelanggan *" className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-md outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Telepon" className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-md outline-none" />
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-md outline-none" />
                </div>
                <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Alamat" rows={2} className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-md outline-none resize-none" />
                <div>
                  <input type="text" value={form.credit_limit} onChange={e => setForm({...form, credit_limit: e.target.value.replace(/\D/g,'')})} placeholder="Limit Kredit (Rp)" className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-md outline-none" />
                  <p className="text-label-xs text-on-surface-variant mt-1">Biarkan 0 jika tidak ada limit kredit.</p>
                </div>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Catatan" rows={2} className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-md outline-none resize-none" />
              </form>
            </div>
            <div className="p-md border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
              <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 px-4 rounded-xl font-semibold text-primary hover:bg-primary/10 cursor-pointer transition-colors">Batal</button>
              <button type="submit" form="customerForm" disabled={isSubmitting} className="py-2 px-4 rounded-xl bg-primary text-on-primary hover:bg-surface-tint font-semibold cursor-pointer disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah Pelanggan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 backdrop-blur-md animate-fade-in" onClick={() => setDetailCustomer(null)}>
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up border border-outline-variant/30" onClick={e => e.stopPropagation()}>
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="text-headline-md font-semibold text-on-surface">{detailCustomer.name}</h3>
                <p className="text-label-sm text-on-surface-variant">Riwayat Transaksi</p>
              </div>
              <button type="button" onClick={() => setDetailCustomer(null)} className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-lg py-md bg-surface-container-lowest border-b border-outline-variant grid grid-cols-3 gap-3 text-center">
              <div><p className="text-label-xs text-on-surface-variant">Total Belanja</p><p className="text-title-md text-primary font-bold">{formatPrice(detailCustomer.total_spent || 0)}</p></div>
              <div><p className="text-label-xs text-on-surface-variant">Limit Kredit</p><p className="text-title-md font-bold">{detailCustomer.credit_limit > 0 ? formatPrice(detailCustomer.credit_limit) : 'Tidak ada'}</p></div>
              <div><p className="text-label-xs text-on-surface-variant">Transaksi</p><p className="text-title-md font-bold">{detailOrders.length}</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-lg bg-surface">
              {detailLoading ? (
                <div className="text-center py-md"><span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span></div>
              ) : detailOrders.length === 0 ? (
                <p className="text-center text-on-surface-variant py-md">Belum ada transaksi.</p>
              ) : (
                <div className="space-y-2">
                  {detailOrders.map(o => (
                    <div key={o.id} className="flex justify-between items-center p-3 bg-surface-container-low rounded-lg border border-outline-variant/50">
                      <div>
                        <p className="text-body-sm font-medium">{o.invoice_number}</p>
                        <p className="text-label-xs text-on-surface-variant">{formatDate(o.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-body-sm font-semibold">{formatPrice(o.total)}</p>
                        <span className="text-label-xs text-on-surface-variant">{o.payment_method}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
