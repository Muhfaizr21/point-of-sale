import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState(null); const [messages, setMessages] = useState([]); const [reply, setReply] = useState(''); const [sending, setSending] = useState(false); const [statusFilter, setStatusFilter] = useState(''); const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    setLoading(true); const p = new URLSearchParams({ page, limit }); if (statusFilter) p.set('status', statusFilter)
    apiClient.get(`/api/superadmin/tickets?${p}`).then(d => { setTickets(d.data || []); setTotal(d.total || 0); setTotalPages(d.total_pages || 1) }).catch(() => {}).finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { if (selected) apiClient.get(`/api/superadmin/tickets/${selected.id}`).then(d => setMessages(d?.messages || [])).catch(() => {}) }, [selected])

  const sendReply = async () => {
    if (!reply.trim()) return; setSending(true)
    try {
      await apiClient.post(`/api/superadmin/tickets/${selected.id}/reply`, { message: reply })
      setReply(''); const upd = await apiClient.get(`/api/superadmin/tickets/${selected.id}`); setMessages(upd?.messages || [])
    } catch (e) { console.error(e) } finally { setSending(false) }
  }

  return (
    <div className="p-6 lg:p-8 h-full">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-4"><div><h1 className="text-xl font-bold text-white/90">Tiket Support</h1><p className="text-sm text-white/30">Pesan dari merchant</p></div></div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left panel */}
          <div className="w-72 shrink-0 flex flex-col">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-2 mb-2">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="w-full bg-transparent text-xs text-white outline-none px-2 py-1.5">
                <option value="" className="bg-[#0a0a0a]">Semua</option><option value="open" className="bg-[#0a0a0a]">Terbuka</option>
                <option value="replied" className="bg-[#0a0a0a]">Dibalas</option><option value="closed" className="bg-[#0a0a0a]">Selesai</option>
              </select>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {loading ? <div className="flex justify-center py-12"><span className="material-symbols-outlined animate-spin text-[28px] text-white/20">sync</span></div> :
              tickets.map(t => (
                <button key={t.id} onClick={() => setSelected(t)}
                  className={`w-full text-left bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-3 transition-all cursor-pointer ${selected?.id === t.id ? 'border-blue-500/40' : 'hover:border-white/10'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-white/80 truncate">{t.subject || '(tanpa subjek)'}</p>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                      t.status === 'open' ? 'bg-green-500/10 text-green-400' :
                      t.status === 'replied' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>{t.status}</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">{t.name}</p>
                  <p className="text-[9px] text-white/20 mt-0.5">{new Date(t.created_at).toLocaleDateString('id-ID')}</p>
                </button>
              ))}
              {tickets.length === 0 && <p className="text-center py-12 text-white/20 text-xs">Tidak ada tiket</p>}
            </div>
            {totalPages > 1 && <div className="flex items-center justify-center gap-1 mt-2"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-2 py-1 rounded text-xs bg-white/5 disabled:opacity-20 cursor-pointer text-white/50">←</button><span className="text-xs text-white/30">{page}/{totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 rounded text-xs bg-white/5 disabled:opacity-20 cursor-pointer text-white/50">→</button></div>}
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col bg-[#0a0a0a] border border-white/[0.06] rounded-xl min-h-0">
            {selected ? (
              <>
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-white/90">{selected.subject || '(tanpa subjek)'}</p><p className="text-[11px] text-white/40">{selected.name} · {selected.email || '-'}</p></div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selected.status === 'open' ? 'bg-green-500/10 text-green-400' : selected.status === 'replied' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>{selected.status}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(m => {
                    const isSupport = m.sender === 'support'
                    return (
                      <div key={m.id} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-xl ${isSupport ? 'bg-blue-600/20 border border-blue-500/20' : 'bg-white/5 border border-white/[0.06]'}`}>
                          <p className={`text-[10px] font-semibold mb-1 ${isSupport ? 'text-blue-400' : 'text-white/40'}`}>{isSupport ? 'Support' : selected.name}</p>
                          <p className="text-xs text-white/80 whitespace-pre-wrap">{m.message}</p>
                          {m.attachment_url && <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 underline mt-1 inline-block">📎 Lampiran</a>}
                          <p className="text-[9px] text-white/20 mt-1">{new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="p-4 border-t border-white/[0.06]">
                  <div className="flex items-end gap-2">
                    <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Ketik balasan..." rows={2}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50 resize-none placeholder:text-white/20"
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }} />
                    <button onClick={sendReply} disabled={sending || !reply.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer">
                      {sending ? '...' : 'Kirim'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/20 text-sm">Pilih tiket untuk melihat detail</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
