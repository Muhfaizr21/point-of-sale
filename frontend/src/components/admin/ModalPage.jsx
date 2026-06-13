import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../services/apiClient'
import { TopBar } from '../common/TopBar'

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

function formatInputNumber(val) {
  if (val === undefined || val === null) return ''
  const clean = String(val).replace(/\D/g, '')
  if (!clean) return ''
  return new Intl.NumberFormat('id-ID').format(parseInt(clean))
}

export function ModalPage({ onToggleSidebar, activeBranch = null }) {
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total_items: 0, total_pages: 0 })
  const [loading, setLoading] = useState(true)

  const [dateFrom, setDateFrom] = useState(getLocalDate)
  const [dateTo, setDateTo] = useState(getLocalDate)

  const [formDate, setFormDate] = useState(getLocalDate)
  const [formAmount, setFormAmount] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const fetchEntries = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/api/expenses?page=${p}&limit=20&category=Modal&date_from=${dateFrom}&date_to=${dateTo}&branch_id=${activeBranch}`)
      if (res) {
        setEntries(res.data || [])
        setPagination(res.pagination || { page: 1, limit: 20, total_items: 0, total_pages: 0 })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [dateFrom, dateTo, activeBranch])

  useEffect(() => { fetchEntries(1) }, [fetchEntries])

  const totalModal = entries.reduce((s, e) => s + e.amount, 0)

  const resetForm = () => {
    setEditingId(null)
    setFormDate(getLocalDate())
    setFormAmount('')
    setFormNotes('')
    setFormError(null)
  }

  const openEdit = (e) => {
    setEditingId(e.id)
    setFormDate(e.date)
    setFormAmount(formatInputNumber(e.amount))
    setFormNotes(e.notes || '')
    setFormError(null)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amountVal = parseInt(formAmount.replace(/\D/g, '')) || 0
    if (amountVal <= 0) { setFormError('Jumlah modal harus lebih dari 0'); return }
    setFormError(null)
    setIsSubmitting(true)
    try {
      const payload = { date: formDate, description: 'Modal Harian', amount: amountVal, category: 'Modal', notes: formNotes.trim() }
      if (editingId) await apiClient.put(`/api/expenses/${editingId}`, payload)
      else await apiClient.post('/api/expenses', payload)
      setShowForm(false)
      resetForm()
      fetchEntries(pagination.page)
    } catch (err) { setFormError(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus modal ini?')) return
    try {
      await apiClient.delete(`/api/expenses/${id}`)
      fetchEntries(pagination.page)
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      <TopBar title="Modal Harian" onToggleSidebar={onToggleSidebar}
        rightContent={
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-tertiary text-on-primary rounded-xl text-label-md font-semibold hover:opacity-90 transition-colors cursor-pointer shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Modal
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-tertiary filled-icon">savings</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Total Modal</span>
            </div>
            <p className="text-headline-md text-tertiary font-bold">{formatPrice(totalModal)}</p>
            <p className="text-label-sm text-on-surface-variant">{pagination.total_items} kali setoran</p>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-surface-tint filled-icon">calendar_month</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Periode</span>
            </div>
            <p className="text-headline-md text-surface-tint font-bold">{dateFrom} s.d. {dateTo}</p>
            <p className="text-label-sm text-on-surface-variant">filter tanggal</p>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-secondary filled-icon">trending_up</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Rata-rata</span>
            </div>
            <p className="text-headline-md text-secondary font-bold">{entries.length > 0 ? formatPrice(Math.round(totalModal / entries.length)) : 'Rp0'}</p>
            <p className="text-label-sm text-on-surface-variant">per setoran</p>
          </div>
        </div>

        {/* Form Inline */}
        {showForm && (
          <div className="bg-tertiary/5 border border-tertiary/20 rounded-xl p-md mb-lg">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-md items-end">
              <div className="w-full sm:w-44">
                <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Tanggal</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg text-body-md text-on-surface bg-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Jumlah Modal (Rp)</label>
                <input type="text" placeholder="0" value={formAmount} onChange={e => setFormAmount(formatInputNumber(e.target.value))}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg text-body-md text-on-surface bg-surface placeholder:text-on-surface-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none" />
                {formError && <p className="text-label-sm text-error mt-1">{formError}</p>}
              </div>
              <div className="flex-1">
                <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Catatan (opsional)</label>
                <input type="text" placeholder="Sumber modal, keperluan..." value={formNotes} onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg text-body-md text-on-surface bg-surface placeholder:text-on-surface-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none" />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-5 py-sm bg-tertiary text-on-primary rounded-lg text-label-md font-semibold hover:opacity-90 disabled:opacity-60 transition-colors cursor-pointer flex items-center justify-center gap-1">
                  {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    : <><span className="material-symbols-outlined text-[18px]">check</span> {editingId ? 'Simpan' : 'Simpan'}</>}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                  className="flex-1 sm:flex-none px-4 py-sm border border-outline-variant rounded-lg text-label-md font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Date Filter */}
        <div className="flex items-center gap-md mb-md">
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-md py-sm border border-outline-variant bg-surface rounded-lg text-body-sm text-on-surface cursor-pointer focus:border-tertiary outline-none" />
            <span className="text-on-surface-variant">s.d.</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-md py-sm border border-outline-variant bg-surface rounded-lg text-body-sm text-on-surface cursor-pointer focus:border-tertiary outline-none" />
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
                  <th className="p-md font-semibold">Keterangan</th>
                  <th className="p-md font-semibold text-right">Jumlah</th>
                  <th className="p-md font-semibold hidden md:table-cell">Catatan</th>
                  <th className="p-md font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr><td colSpan="6" className="p-xl text-center text-tertiary">
                    <div className="flex justify-center items-center gap-sm">
                      <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                      <span className="text-body-lg font-medium">Memuat data...</span>
                    </div>
                  </td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan="6" className="p-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] block mb-xs">savings</span>
                    <p className="text-body-lg font-medium mb-xs">Belum ada setoran modal</p>
                    <p className="text-label-sm">di periode ini</p>
                  </td></tr>
                ) : (
                  entries.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                      <td className="p-md text-on-surface-variant font-data-mono">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                      <td className="p-md font-medium">{e.date}</td>
                      <td className="p-md">{e.description}</td>
                      <td className="p-md text-right font-semibold text-tertiary">{formatPrice(e.amount)}</td>
                      <td className="p-md hidden md:table-cell text-on-surface-variant text-label-sm max-w-[200px] truncate">{e.notes || '-'}</td>
                      <td className="p-md text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => openEdit(e)}
                            className="p-2 text-tertiary hover:bg-tertiary/10 rounded-full cursor-pointer" title="Edit">
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

          {!loading && entries.length > 0 && (
            <div className="px-md py-md border-t border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-md">
              <div className="text-body-sm text-on-surface-variant">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total_items)} dari {pagination.total_items}
              </div>
              <div className="flex items-center gap-xs">
                <button type="button" onClick={() => fetchEntries(1)} disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">first_page</span>
                </button>
                <button type="button" onClick={() => fetchEntries(pagination.page - 1)} disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="px-3 py-1.5 text-label-sm font-semibold bg-surface-container-high rounded-lg">{pagination.page}/{pagination.total_pages || 1}</span>
                <button type="button" onClick={() => fetchEntries(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button type="button" onClick={() => fetchEntries(pagination.total_pages)} disabled={pagination.page === pagination.total_pages}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">last_page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
