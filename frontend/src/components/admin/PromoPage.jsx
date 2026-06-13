import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { apiClient } from '../../services/apiClient'
import { TopBar } from '../common/TopBar'

const PROMO_TYPES = [
  { value: 'PERCENT', label: 'Diskon Persen (%)', icon: 'percent', desc: 'Diskon berdasarkan persentase dari total belanja' },
  { value: 'NOMINAL', label: 'Diskon Nominal (Rp)', icon: 'money', desc: 'Potongan harga dalam jumlah tetap (Rupiah)' },
  { value: 'BOGO', label: 'Beli X Gratis Y', icon: 'local_offer', desc: 'Beli beberapa item, dapat gratis item lain' },
]

const DAYS = [
  { value: '0', label: 'Min' }, { value: '1', label: 'Sen' }, { value: '2', label: 'Sel' },
  { value: '3', label: 'Rab' }, { value: '4', label: 'Kam' }, { value: '5', label: 'Jum' },
  { value: '6', label: 'Sab' },
]

const PRESETS = [
  { label: 'Happy Hour Siang', days: ['1','2','3','4','5','6'], start: '12:00', end: '14:00' },
  { label: 'Happy Hour Malam', days: ['1','2','3','4','5','6'], start: '18:00', end: '21:00' },
  { label: 'Weekend Special', days: ['0','6'], start: '10:00', end: '22:00' },
  { label: 'Diskon Pagi', days: ['1','2','3','4','5'], start: '07:00', end: '10:00' },
]

const to12Hour = (time24) => {
  if (!time24) return { hour: '12', min: '00', period: 'AM' }
  const [h, m] = time24.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return { hour: String(hour12).padStart(2, '0'), min: m, period }
}

const to24Hour = (hour12, min, period) => {
  let h = parseInt(hour12)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${min}`
}

const dayName = (val) => DAYS.find(d => d.value === val)?.label || val

const scheduleText = (days, start, end) => {
  if (days.length === 0 && !start && !end) return 'Tidak aktif'
  const dayStr = days.length > 0 ? days.map(dayName).join(', ') : 'Setiap hari'
  if (!start && !end) return dayStr
  const s12 = to12Hour(start); const e12 = to12Hour(end)
  const sText = `${s12.hour}:${s12.min} ${s12.period}`
  const eText = `${e12.hour}:${e12.min} ${e12.period}`
  const overnight = start > end
  return `${dayStr}, ${sText} - ${eText}${overnight ? ' (besoknya)' : ''}`
}

const STATUS_OPTIONS = [
  { value: 'semua', label: 'Semua' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
]

export function PromoPage({ onToggleSidebar, activeBranch = null }) {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    name: '', type: 'PERCENT', value: '', min_amount: '',
    buy_qty: 2, free_qty: 1, free_product_id: '',
    time_start: '', time_end: '', days: [],
    product_ids: '', active: true,
  })
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter, Sort & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [typeFilter, setTypeFilter] = useState('semua')
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  const fetchPromos = useCallback(async () => {
    setLoading(true)
    try { const d = await apiClient.get(`/api/promos${activeBranch ? `?branch_id=${activeBranch}` : ''}`); setPromos(d || []) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [activeBranch])

  useEffect(() => { fetchPromos() }, [fetchPromos])
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter, typeFilter, sortField, sortDir])

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40">unfold_more</span>
    return <span className="material-symbols-outlined text-[14px]">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  const processed = useMemo(() => {
    let list = [...promos]
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q)) }
    if (statusFilter === 'aktif') list = list.filter(p => p.active)
    else if (statusFilter === 'nonaktif') list = list.filter(p => !p.active)
    if (typeFilter !== 'semua') list = list.filter(p => p.type === typeFilter)
    list.sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (sortField === 'name') { va = va?.toLowerCase(); vb = vb?.toLowerCase() }
      if (sortField === 'type') { va = va?.toLowerCase(); vb = vb?.toLowerCase() }
      if (sortField === 'value') { va = Number(va); vb = Number(vb) }
      if (sortField === 'active') { va = va ? 1 : 0; vb = vb ? 1 : 0 }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [promos, searchQuery, statusFilter, typeFilter, sortField, sortDir])

  const totalPages = Math.ceil(processed.length / PER_PAGE)
  const paginated = useMemo(() => processed.slice((page - 1) * PER_PAGE, page * PER_PAGE), [processed, page])

  const handleOpenAdd = () => {
    setEditing(null)
    setForm({ name: '', type: 'PERCENT', value: '', min_amount: '', buy_qty: 2, free_qty: 1, free_product_id: '', time_start: '', time_end: '', days: [], product_ids: '', active: true })
    setFormError(null); setIsModalOpen(true)
  }

  const handleOpenEdit = (promo) => {
    setEditing(promo)
    setForm({
      name: promo.name, type: promo.type, value: promo.value.toString(),
      min_amount: promo.min_amount?.toString() || '', buy_qty: promo.buy_qty || 2, free_qty: promo.free_qty || 1,
      free_product_id: promo.free_product_id?.toString() || '', time_start: promo.time_start || '',
      time_end: promo.time_end || '', days: promo.day_of_week ? promo.day_of_week.split(',') : [],
      product_ids: (promo.product_ids || []).join(','), active: promo.active,
    })
    setFormError(null); setIsModalOpen(true)
  }

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day].sort(),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.value) return
    setFormError(null); setIsSubmitting(true)
    try {
      const data = {
        name: form.name, type: form.type, value: parseInt(form.value),
        min_amount: parseInt(form.min_amount) || 0, buy_qty: parseInt(form.buy_qty) || 0,
        free_qty: parseInt(form.free_qty) || 0,
        free_product_id: form.free_product_id ? parseInt(form.free_product_id) : null,
        time_start: form.time_start, time_end: form.time_end,
        day_of_week: form.days.join(','),
        product_ids: form.product_ids ? form.product_ids.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : [],
        active: form.active,
      }
      if (editing) await apiClient.put(`/api/promos/${editing.id}`, data)
      else await apiClient.post('/api/promos', data)
      await fetchPromos(); setIsModalOpen(false)
    } catch (err) { setFormError(err.message) }
    finally { setIsSubmitting(false) }
  }

  const formatPrice = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v).replace('IDR', 'Rp')
  const typeLabel = (t) => PROMO_TYPES.find(pt => pt.value === t)?.label || t
  const dayLabel = (d) => d ? d.split(',').map(s => DAYS.find(dd => dd.value === s)?.label || s).join(', ') : 'Setiap hari'

  const activeType = PROMO_TYPES.find(t => t.value === form.type)

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      <TopBar
        title="Promo & Diskon"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <button type="button" onClick={handleOpenAdd} className="rounded-lg font-headline-md font-semibold text-lg transition-colors cursor-pointer bg-primary text-on-primary hover:bg-surface-tint py-2 px-4 flex items-center gap-2">
            <span className="material-symbols-outlined">add</span> Tambah Promo
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {/* Filter Bar */}
        <div className="mb-md flex flex-col sm:flex-row gap-md sm:items-center justify-between">
          <div className="w-full sm:w-72 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari promo..." className="w-full pl-10 pr-4 py-2 border border-outline-variant bg-surface rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body-md font-semibold text-on-surface-variant">Tipe:</span>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-outline-variant bg-surface rounded-lg text-body-md font-semibold text-on-surface cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              <option value="semua">Semua</option>
              {PROMO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span className="text-body-md font-semibold text-on-surface-variant ml-1">Status:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-outline-variant bg-surface rounded-lg text-body-md font-semibold text-on-surface cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="text-label-sm text-on-surface-variant whitespace-nowrap">{processed.length} promo</span>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Nama <SortIcon field="name" /></div>
                  </th>
                  <th className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">Tipe <SortIcon field="type" /></div>
                  </th>
                  <th className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('value')}>
                    <div className="flex items-center gap-1">Nilai <SortIcon field="value" /></div>
                  </th>
                  <th className="p-md font-semibold">Jadwal</th>
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
                    <span className="material-symbols-outlined text-[48px] block mb-xs">local_offer</span>
                    {searchQuery || statusFilter !== 'semua' || typeFilter !== 'semua' ? 'Tidak ada promo yang cocok dengan filter.' : 'Belum ada promo.'}
                  </td></tr>
                ) : paginated.map(promo => (
                  <tr key={promo.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                    <td className="p-md font-medium">{promo.name}</td>
                    <td className="p-md">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-label-sm font-medium">{typeLabel(promo.type)}</span>
                    </td>
                    <td className="p-md font-semibold">
                      {promo.type === 'PERCENT' ? `${promo.value}%` : promo.type === 'NOMINAL' ? formatPrice(promo.value) : `Beli ${promo.buy_qty} Gratis ${promo.free_qty}`}
                    </td>
                    <td className="p-md">
                      <span className="text-label-sm text-on-surface-variant">
                        {dayLabel(promo.day_of_week)}
                        {promo.time_start ? <span className="ml-1">• {promo.time_start}-{promo.time_end}</span> : ''}
                      </span>
                    </td>
                    <td className="p-md">
                      <button type="button" onClick={async () => {
                        try {
                          await apiClient.put(`/api/promos/${promo.id}`, {
                            name: promo.name, type: promo.type, value: promo.value,
                            min_amount: promo.min_amount, buy_qty: promo.buy_qty, free_qty: promo.free_qty,
                            free_product_id: promo.free_product_id, time_start: promo.time_start,
                            time_end: promo.time_end, day_of_week: promo.day_of_week,
                            product_ids: promo.product_ids || [], active: !promo.active,
                          })
                          await fetchPromos()
                        } catch (err) { alert(err.message) }
                      }} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-medium transition-all cursor-pointer hover:scale-105 ${
                        promo.active ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700' : 'bg-surface-container-high text-on-surface-variant hover:bg-green-50 hover:text-green-700'
                      }`} title={promo.active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${promo.active ? 'bg-green-500' : 'bg-on-surface-variant/40'}`}></span>
                        {promo.active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="p-md text-right whitespace-nowrap">
                      <button type="button" onClick={() => handleOpenEdit(promo)} className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer mr-1" title="Edit"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                      <button type="button" onClick={async () => {
                        if (confirm(`Hapus promo ${promo.name}?`)) {
                          try { await apiClient.delete(`/api/promos/${promo.id}`); await fetchPromos() }
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
              Menampilkan {((page - 1) * PER_PAGE) + 1} - {Math.min(page * PER_PAGE, processed.length)} dari {processed.length} promo
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors disabled:opacity-50 cursor-pointer text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-body-sm font-bold transition-colors cursor-pointer ${page === p ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-highest'}`}>{p}</button>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[8vh] pb-md px-md sm:px-lg bg-black/50 backdrop-blur-md animate-fade-in overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up border border-outline-variant/30" onClick={e => e.stopPropagation()}>
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest shrink-0">
              <div>
                <h3 className="text-headline-md font-semibold text-on-surface">{editing ? 'Edit Promo' : 'Buat Promo Baru'}</h3>
                <p className="text-label-sm text-on-surface-variant">Atur diskon otomatis untuk transaksi</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="flex-1 overflow-y-auto p-lg bg-surface">
              {formError && <div className="mb-lg p-4 bg-error-container text-on-error-container rounded-lg font-medium flex items-center gap-2"><span className="material-symbols-outlined">error</span> {formError}</div>}

              <form id="promoForm" onSubmit={handleSubmit} className="space-y-xl">
                {/* Nama Promo */}
                <div className="space-y-1.5">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Nama Promo</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Cth: Happy Hour 10%, Beli 2 Gratis 1" className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                      Template Cepat
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p, i) => (
                      <button key={i} type="button" onClick={() => setForm(f => ({...f, days: [...p.days], time_start: p.start, time_end: p.end}))}
                        className="px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-high text-label-sm font-medium text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
                        {p.label}
                      </button>
                    ))}
                    <button type="button" onClick={() => setForm(f => ({...f, days: [], time_start: '', time_end: ''}))}
                      className="px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-high text-label-sm font-medium text-on-surface-variant hover:border-error hover:text-error hover:bg-error/5 transition-all cursor-pointer">
                      Reset
                    </button>
                  </div>
                </div>

                {/* Tipe Promo */}
                <div className="space-y-1.5">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Tipe Promo</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PROMO_TYPES.map(t => (
                      <button type="button" key={t.value} onClick={() => setForm({...form, type: t.value})}
                        className={`flex items-start gap-3 p-3 border-2 rounded-xl text-left transition-all cursor-pointer ${
                          form.type === t.value
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-outline-variant bg-surface-container-high hover:border-primary/50'
                        }`}>
                        <span className={`material-symbols-outlined text-[24px] mt-0.5 ${form.type === t.value ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {t.icon}
                        </span>
                        <div>
                          <p className={`text-body-sm font-semibold ${form.type === t.value ? 'text-primary' : 'text-on-surface'}`}>{t.label}</p>
                          <p className="text-label-xs text-on-surface-variant mt-0.5">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nilai (berubah sesuai tipe) */}
                <div className="space-y-1.5">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">
                    {form.type === 'PERCENT' ? 'Besar Diskon (%)' : form.type === 'NOMINAL' ? 'Besar Diskon (Rp)' : 'Aturan BOGO'}
                  </label>
                  {form.type === 'PERCENT' && (
                    <div className="relative">
                      <input type="number" min="1" max="100" required value={form.value} onChange={e => setForm({...form, value: e.target.value})}
                        placeholder="10" className="w-full px-4 py-3 pr-12 border border-outline-variant bg-surface-container-high rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body-lg font-semibold text-on-surface-variant">%</span>
                    </div>
                  )}
                  {form.type === 'NOMINAL' && (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-lg font-semibold text-on-surface-variant">Rp</span>
                      <input type="text" required value={form.value} onChange={e => setForm({...form, value: e.target.value.replace(/\D/g, '')})}
                        placeholder="10000" className="w-full pl-12 pr-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                  )}
                  {form.type === 'BOGO' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-label-sm text-on-surface-variant block mb-1">Beli</label>
                        <input type="number" min="1" value={form.buy_qty} onChange={e => setForm({...form, buy_qty: parseInt(e.target.value) || 2})}
                          className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="text-label-sm text-on-surface-variant block mb-1">Gratis</label>
                        <input type="number" min="1" value={form.free_qty} onChange={e => setForm({...form, free_qty: parseInt(e.target.value) || 1})}
                          className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                      <p className="text-label-sm text-on-surface-variant col-span-2 -mt-1">Contoh: Beli 2 Gratis 1 → pelanggan bayar 2, dapat 3</p>
                    </div>
                  )}
                </div>

                {/* Minimal Pembelian */}
                <div className="space-y-1.5">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Minimal Belanja (opsional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-lg font-semibold text-on-surface-variant">Rp</span>
                    <input type="text" value={form.min_amount} onChange={e => setForm({...form, min_amount: e.target.value.replace(/\D/g, '')})}
                      placeholder="0 (tanpa minimal)" className="w-full pl-12 pr-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <p className="text-label-sm text-on-surface-variant">Promo hanya berlaku jika total belanja mencapai nominal ini. Kosongkan / isi 0 untuk tanpa minimal.</p>
                </div>

                {/* Separator */}
                <hr className="border-outline-variant" />

                {/* Jadwal Hari */}
                <div className="space-y-1.5">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                      Hari Aktif
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(d => (
                      <button type="button" key={d.value} onClick={() => toggleDay(d.value)}
                        className={`px-4 py-2 rounded-lg border-2 text-body-sm font-semibold transition-all cursor-pointer ${
                          form.days.includes(d.value)
                            ? 'border-primary bg-primary text-on-primary shadow-sm'
                            : 'border-outline-variant bg-surface-container-high text-on-surface-variant hover:border-primary/50'
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                  {form.days.length === 0 && <p className="text-label-sm text-warning flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-[16px]">warning</span>Tidak ada hari dipilih — promo tidak akan berjalan</p>}
                </div>

                {/* Jam Aktif — 12h AM/PM */}
                {(() => {
                  const s = to12Hour(form.time_start)
                  const e = to12Hour(form.time_end)
                  return (
                    <div className="space-y-1.5">
                      <label className="text-label-lg font-semibold text-on-surface-variant block">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px]">schedule</span>
                          Jam Aktif
                        </span>
                      </label>
                      <p className="text-label-sm text-on-surface-variant mb-2">Kosongkan jika berlaku sepanjang hari</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-container-high rounded-xl p-3 border border-outline-variant">
                          <label className="text-label-sm font-semibold text-on-surface-variant block mb-2">Mulai</label>
                          <div className="flex items-center gap-1">
                            <select value={s.hour} onChange={e => setForm({...form, time_start: to24Hour(e.target.value, s.min, s.period)})}
                              className="flex-1 px-2 py-2 border border-outline-variant bg-surface rounded-lg text-body-lg text-on-surface text-center font-semibold outline-none focus:border-primary cursor-pointer">
                              {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <span className="text-body-lg font-bold text-on-surface-variant">:</span>
                            <select value={s.min} onChange={e => setForm({...form, time_start: to24Hour(s.hour, e.target.value, s.period)})}
                              className="flex-1 px-2 py-2 border border-outline-variant bg-surface rounded-lg text-body-lg text-on-surface text-center font-semibold outline-none focus:border-primary cursor-pointer">
                              {Array.from({length: 12}, (_, i) => String(i * 5).padStart(2, '0')).map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <select value={s.period} onChange={e => setForm({...form, time_start: to24Hour(s.hour, s.min, e.target.value)})}
                              className="px-2 py-2 border border-outline-variant bg-surface rounded-lg text-body-sm text-on-surface font-bold outline-none focus:border-primary cursor-pointer">
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="bg-surface-container-high rounded-xl p-3 border border-outline-variant">
                          <label className="text-label-sm font-semibold text-on-surface-variant block mb-2">Sampai</label>
                          <div className="flex items-center gap-1">
                            <select value={e.hour} onChange={e => setForm({...form, time_end: to24Hour(e.target.value, e.min, e.period)})}
                              className="flex-1 px-2 py-2 border border-outline-variant bg-surface rounded-lg text-body-lg text-on-surface text-center font-semibold outline-none focus:border-primary cursor-pointer">
                              {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <span className="text-body-lg font-bold text-on-surface-variant">:</span>
                            <select value={e.min} onChange={e => setForm({...form, time_end: to24Hour(e.hour, e.target.value, e.period)})}
                              className="flex-1 px-2 py-2 border border-outline-variant bg-surface rounded-lg text-body-lg text-on-surface text-center font-semibold outline-none focus:border-primary cursor-pointer">
                              {Array.from({length: 12}, (_, i) => String(i * 5).padStart(2, '0')).map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <select value={e.period} onChange={e => setForm({...form, time_end: to24Hour(e.hour, e.min, e.target.value)})}
                              className="px-2 py-2 border border-outline-variant bg-surface rounded-lg text-body-sm text-on-surface font-bold outline-none focus:border-primary cursor-pointer">
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 px-3 py-2 bg-surface-container-highest rounded-lg text-label-xs text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        <span><strong>AM</strong> = pagi-malam (00:00-11:59), <strong>PM</strong> = siang-malam (12:00-23:59)</span>
                      </div>
                      {form.time_start && form.time_end && (
                        <div className={`mt-2 px-3 py-2 rounded-lg text-label-sm font-medium flex items-center gap-2 ${form.time_start > form.time_end ? 'bg-amber-50 text-amber-700' : 'bg-primary/5 text-primary'}`}>
                          <span className="material-symbols-outlined text-[16px]">{form.time_start > form.time_end ? 'nights_stay' : 'light_mode'}</span>
                          {form.time_start > form.time_end ? 'Promo berlaku hingga besok (melewati tengah malam)' : 'Promo berlaku di hari yang sama'}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Schedule Preview */}
                {form.days.length > 0 && (
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">summarize</span>
                      <div>
                        <p className="text-body-sm font-semibold text-primary">Ringkasan Jadwal Promo</p>
                        <p className="text-label-sm text-on-surface-variant mt-1">
                          {scheduleText(form.days, form.time_start, form.time_end)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Aktif */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <div>
                    <span className="text-body-md font-medium text-on-surface">Promo Aktif</span>
                    <p className="text-label-sm text-on-surface-variant">Nonaktifkan untuk menyembunyikan promo tanpa menghapus</p>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-md border-t border-outline-variant flex justify-end gap-md bg-surface-container-lowest shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="py-3 px-6 rounded-xl font-headline-md font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer">Batal</button>
              <button type="submit" form="promoForm" disabled={isSubmitting} className="py-3 px-6 rounded-xl bg-primary text-on-primary hover:bg-surface-tint font-headline-md font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-2">
                {isSubmitting ? <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Menyimpan...</> : <><span className="material-symbols-outlined text-[18px]">check</span> {editing ? 'Simpan Perubahan' : 'Aktifkan Promo'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
