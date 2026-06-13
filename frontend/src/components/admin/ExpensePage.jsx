import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { apiClient } from '../../services/apiClient'
import { TopBar } from '../common/TopBar'

const EXPENSE_CATEGORIES = [
  'Bahan Baku', 'Operasional', 'Gaji Karyawan', 'Listrik & Air',
  'Sewa Tempat', 'Transportasi', 'Marketing', 'Perawatan',
  'ATK', 'Lainnya',
]

const getLocalDate = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatPrice(v) {
  if (!v) return 'Rp0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v).replace('IDR', 'Rp')
}

export function ExpensePage({ onToggleSidebar }) {
  const [expenses, setExpenses] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total_items: 0, total_pages: 0 })
  const [loading, setLoading] = useState(true)

  const [dateFrom, setDateFrom] = useState(getLocalDate)
  const [dateTo, setDateTo] = useState(getLocalDate)
  const [filterCategory, setFilterCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ date: getLocalDate(), description: '', amount: '', category: 'Operasional', notes: '' })
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchExpenses = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/api/expenses?page=${p}&limit=20&date_from=${dateFrom}&date_to=${dateTo}&category=${filterCategory}&search=${searchQuery}`)
      if (res) {
        setExpenses(res.data || [])
        setPagination(res.pagination || { page: 1, limit: 20, total_items: 0, total_pages: 0 })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [dateFrom, dateTo, filterCategory, searchQuery])

  useEffect(() => { fetchExpenses(1) }, [fetchExpenses])
  useEffect(() => { setPagination(p => ({ ...p, page: 1 })) }, [dateFrom, dateTo, filterCategory, searchQuery])

  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])

  const openAdd = () => {
    setEditing(null)
    setForm({ date: getLocalDate(), description: '', amount: '', category: 'Operasional', notes: '' })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEdit = (e) => {
    setEditing(e)
    setForm({ date: e.date, description: e.description, amount: String(e.amount), category: e.category || 'Operasional', notes: e.notes || '' })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) { setFormError('Deskripsi wajib diisi'); return }
    if (!form.amount || parseInt(form.amount) <= 0) { setFormError('Jumlah harus lebih dari 0'); return }
    if (!form.date) { setFormError('Tanggal wajib diisi'); return }
    setFormError(null)
    setIsSubmitting(true)
    try {
      const payload = { date: form.date, description: form.description.trim(), amount: parseInt(form.amount), category: form.category, notes: form.notes.trim() }
      if (editing) await apiClient.put(`/api/expenses/${editing.id}`, payload)
      else await apiClient.post('/api/expenses', payload)
      setIsModalOpen(false)
      fetchExpenses(pagination.page)
    } catch (err) { setFormError(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus pengeluaran ini?')) return
    try {
      await apiClient.delete(`/api/expenses/${id}`)
      fetchExpenses(pagination.page)
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      <TopBar title="Pengeluaran" onToggleSidebar={onToggleSidebar}
        rightContent={
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-semibold hover:bg-surface-tint transition-colors cursor-pointer shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Pengeluaran
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-error filled-icon">money_off</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Total Pengeluaran</span>
            </div>
            <p className="text-headline-md text-error font-bold">{formatPrice(totalExpense)}</p>
            <p className="text-label-sm text-on-surface-variant">{pagination.total_items} transaksi</p>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-surface-tint filled-icon">calendar_month</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Periode</span>
            </div>
            <p className="text-headline-md text-surface-tint font-bold">{dateFrom} s.d. {dateTo}</p>
            <p className="text-label-sm text-on-surface-variant">{pagination.total_pages} halaman</p>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-tertiary filled-icon">account_balance</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Rata-rata</span>
            </div>
            <p className="text-headline-md text-tertiary font-bold">{expenses.length > 0 ? formatPrice(Math.round(totalExpense / expenses.length)) : 'Rp0'}</p>
            <p className="text-label-sm text-on-surface-variant">per pengeluaran</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md mb-lg">
          <div className="flex flex-col lg:flex-row gap-md lg:items-end">
            <div className="w-full lg:w-44">
              <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Dari Tanggal</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md text-on-surface cursor-pointer focus:border-primary outline-none" />
            </div>
            <div className="w-full lg:w-44">
              <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Sampai Tanggal</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md text-on-surface cursor-pointer focus:border-primary outline-none" />
            </div>
            <div className="w-full lg:w-44">
              <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Kategori</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md font-medium text-on-surface cursor-pointer focus:border-primary outline-none">
                <option value="">Semua Kategori</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Cari</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input type="text" placeholder="Cari deskripsi atau catatan..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold w-12">#</th>
                  <th className="p-md font-semibold">Tanggal</th>
                  <th className="p-md font-semibold">Deskripsi</th>
                  <th className="p-md font-semibold hidden sm:table-cell">Kategori</th>
                  <th className="p-md font-semibold text-right">Jumlah</th>
                  <th className="p-md font-semibold hidden md:table-cell">Catatan</th>
                  <th className="p-md font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr><td colSpan="7" className="p-xl text-center text-primary">
                    <div className="flex justify-center items-center gap-sm">
                      <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                      <span className="text-body-lg font-medium">Memuat data...</span>
                    </div>
                  </td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan="7" className="p-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] block mb-xs">receipt_long</span>
                    <p className="text-body-lg font-medium mb-xs">Belum ada pengeluaran</p>
                    <p className="text-label-sm">di periode ini</p>
                  </td></tr>
                ) : (
                  expenses.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                      <td className="p-md text-on-surface-variant font-data-mono">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                      <td className="p-md"><span className="font-medium">{e.date}</span></td>
                      <td className="p-md font-medium">{e.description}</td>
                      <td className="p-md hidden sm:table-cell">
                        <span className="px-3 py-1 bg-surface-container-high border border-outline-variant/30 rounded-full text-label-sm">{e.category || '-'}</span>
                      </td>
                      <td className="p-md text-right font-semibold text-error">{formatPrice(e.amount)}</td>
                      <td className="p-md hidden md:table-cell text-on-surface-variant text-label-sm max-w-[180px] truncate">{e.notes || '-'}</td>
                      <td className="p-md text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => openEdit(e)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer" title="Edit">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button type="button" onClick={() => handleDelete(e.id)}
                            className="p-2 text-error hover:bg-error/10 rounded-full cursor-pointer" title="Hapus">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && expenses.length > 0 && (
            <div className="px-md py-md border-t border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-md">
              <div className="text-body-sm text-on-surface-variant">
                Menampilkan <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> -
                <span className="font-semibold"> {Math.min(pagination.page * pagination.limit, pagination.total_items)}</span> dari
                <span className="font-semibold"> {pagination.total_items}</span> pengeluaran
              </div>
              <div className="flex items-center gap-xs">
                <button type="button" onClick={() => fetchExpenses(1)} disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer" title="Pertama">
                  <span className="material-symbols-outlined text-[18px]">first_page</span>
                </button>
                <button type="button" onClick={() => fetchExpenses(pagination.page - 1)} disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="px-3 py-1.5 text-label-sm font-semibold text-on-surface bg-surface-container-high rounded-lg">
                  {pagination.page} / {pagination.total_pages || 1}
                </span>
                <button type="button" onClick={() => fetchExpenses(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button type="button" onClick={() => fetchExpenses(pagination.total_pages)} disabled={pagination.page === pagination.total_pages}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer" title="Terakhir">
                  <span className="material-symbols-outlined text-[18px]">last_page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up border border-outline-variant/30">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface">{editing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-lg space-y-md bg-surface">
              {formError && (
                <div className="p-sm bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[18px]">error</span>
                  <span className="text-label-sm text-error font-medium">{formError}</span>
                </div>
              )}

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Tanggal</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg text-body-md text-on-surface bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Deskripsi</label>
                <input type="text" placeholder="Contoh: Beli bahan baku" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg text-body-md text-on-surface bg-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg text-body-md font-medium text-on-surface bg-surface cursor-pointer focus:border-primary outline-none">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Jumlah (Rp)</label>
                <input type="number" min="0" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg text-body-md text-on-surface bg-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Catatan (opsional)</label>
                <textarea rows="3" placeholder="Catatan tambahan..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg text-body-md text-on-surface bg-surface placeholder:text-on-surface-variant resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div className="flex gap-md pt-sm">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-md border border-outline-variant rounded-xl text-body-md font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-[2] py-3 px-md bg-primary text-on-primary rounded-xl text-body-md font-semibold hover:bg-surface-tint disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2">
                  {isSubmitting ? <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span> Menyimpan...</>
                    : <><span className="material-symbols-outlined text-[20px]">check</span> {editing ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
