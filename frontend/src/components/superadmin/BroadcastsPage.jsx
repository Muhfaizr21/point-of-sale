import React, { useState, useEffect } from 'react'
import { apiClient } from '../../services/apiClient'

export function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState([])
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'general', target_ids: [] })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState(null)
  const [notif, setNotif] = useState(null)
  const limit = 10

  const show = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 4000) }

  const fetchAll = async (p = page) => {
    setLoading(true)
    try {
      const [b, m] = await Promise.all([
        apiClient.get(`/api/broadcasts?page=${p}&limit=${limit}`),
        apiClient.get('/api/merchants'),
      ])
      setBroadcasts(b.data || [])
      setTotal(b.total || 0)
      setTotalPages(b.total_pages || 1)
      setPage(b.page || 1)
      setMerchants(m || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchAll(1) }, [])

  const goPage = (p) => { if (p >= 1 && p <= totalPages) fetchAll(p) }

  const handleSend = async () => {
    if (!form.title || !form.message) return
    try {
      await apiClient.post('/api/broadcasts', {
        title: form.title, message: form.message,
        type: form.type,
        target_merchant_ids: form.type === 'merchant' ? form.target_ids : [],
      })
      setShowForm(false); setForm({ title: '', message: '', type: 'general', target_ids: [] })
      goPage(1); show('Pengumuman berhasil dikirim')
    } catch (e) { show(e.message, 'error') }
  }

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/broadcasts/${id}`)
      setDeleting(null); show('Pengumuman berhasil dihapus')
      if (broadcasts.length === 1 && page > 1) goPage(page - 1); else fetchAll(page)
    } catch (e) { show(e.message, 'error') }
  }

  const toggleTarget = (id) => {
    setForm(prev => ({
      ...prev,
      target_ids: prev.target_ids.includes(id)
        ? prev.target_ids.filter(x => x !== id)
        : [...prev.target_ids, id]
    }))
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white/90">Pengumuman Global</h1>
            <p className="text-sm text-white/30 mt-1">{total} pengumuman terkirim</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-[18px]">campaign</span>Buat Pengumuman</button>
        </div>

        {showForm && (
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 mb-6 animate-fade-in">
            <h3 className="text-sm font-semibold text-white/80 mb-4">Pengumuman Baru</h3>
            <div className="space-y-4">
              <input placeholder="Judul pengumuman" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-white/20" />
              <textarea placeholder="Isi pesan..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-white/20 resize-none h-28" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="general" checked={form.type === 'general'} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm text-white/70">Semua Merchant (General)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="merchant" checked={form.type === 'merchant'} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm text-white/70">Merchant Tertentu</span>
                </label>
              </div>
              {form.type === 'merchant' && (
                <div className="flex flex-wrap gap-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  {merchants.map(m => (
                    <button key={m.id} onClick={() => toggleTarget(m.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${form.target_ids.includes(m.id) ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/50 hover:text-white/70 border border-transparent'}`}>
                      {m.name}
                    </button>
                  ))}
                  {form.target_ids.length === 0 && <span className="text-xs text-white/30 py-1">Pilih merchant tujuan</span>}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleSend}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">send</span>Kirim</button>
                <button onClick={() => setShowForm(false)}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-all cursor-pointer">Batal</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32"><span className="material-symbols-outlined animate-spin text-[48px] text-white/20">sync</span></div>
        ) : (
          <>
            <div className="space-y-3">
              {broadcasts.map(b => (
                <div key={b.id} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-amber-400">campaign</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-white/90">{b.title}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.type === 'general' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {b.type === 'general' ? 'Semua Merchant' : `Target: ${(b.target_merchant_ids || []).length} toko`}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 mt-1 leading-relaxed whitespace-pre-wrap">{b.message}</p>
                      <p className="text-[10px] text-white/25 mt-2">{new Date(b.created_at).toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={() => setDeleting(b)}
                      className="shrink-0 p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Hapus pengumuman">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              {broadcasts.length === 0 && (
                <div className="text-center py-24 text-white/20">
                  <span className="material-symbols-outlined text-[64px]">campaign</span>
                  <p className="text-sm mt-4">Belum ada pengumuman. Buat pengumuman pertama!</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => goPage(page - 1)} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => goPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all cursor-pointer ${p === page ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/10'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}

        <div className="text-center text-[11px] text-white/[0.08] py-6 mt-6 border-t border-white/[0.04]">Pengumuman Global · SentraKas Platform</div>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleting(null)}>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <span className="material-symbols-outlined text-[40px] text-red-400">delete_forever</span>
              <h3 className="text-base font-bold text-white/90 mt-3">Hapus Pengumuman</h3>
              <p className="text-sm text-white/50 mt-1">Yakin ingin menghapus "<span className="text-white/70">{deleting.title}</span>"?</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleting(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-all cursor-pointer">Batal</button>
              <button onClick={() => handleDelete(deleting.id)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {notif && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up backdrop-blur-md ${notif.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'}`}>
          {notif.msg}
        </div>
      )}
    </div>
  )
}
