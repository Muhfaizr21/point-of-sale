import React, { useState, useEffect, useRef } from 'react'
import { apiClient } from '../../services/apiClient'
import { TopBar } from '../common/TopBar'

export function SupportPage({ onToggleSidebar }) {
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '' })
  const [notif, setNotif] = useState(null)
  const chatEnd = useRef(null)
  const fileInput = useRef(null)
  const [attach, setAttach] = useState(null)

  const show = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 4000) }

  useEffect(() => { 
    apiClient.get('/api/tickets/my')
      .then(d => { 
        setTickets(d || []); 
        if (d?.length > 0 && !selected) setSelected(d[0]); 
      })
      .catch(() => {})
      .finally(() => setLoading(false)) 
  }, [])

  useEffect(() => { 
    if (selected) { 
      apiClient.get(`/api/tickets/${selected.id}`)
        .then(d => setMessages(d?.messages || []))
        .catch(() => {}) 
    } 
  }, [selected])
  
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!newMsg.trim() && !attach) return
    setSending(true)
    try {
      let attUrl = ''
      if (attach) {
        const formData = new FormData()
        formData.append('image', attach)
        const upload = await apiClient.uploadFile('/api/upload', attach)
        attUrl = upload?.url || ''
      }
      await apiClient.post(`/api/tickets/${selected.id}/reply`, { message: newMsg, attachment_url: attUrl })
      setNewMsg(''); setAttach(null)
      if (fileInput.current) fileInput.current.value = ''
      const upd = await apiClient.get(`/api/tickets/${selected.id}`)
      setMessages(upd?.messages || [])
    } catch (e) { show(e.message, 'error') }
    finally { setSending(false) }
  }

  const createTicket = async () => {
    if (!form.message.trim()) return
    setSending(true)
    try {
      const t = await apiClient.post('/api/tickets', form)
      setTickets(prev => [t, ...prev])
      setSelected(t); setShowNew(false); setForm({ subject: '', message: '' })
    } catch (e) { show(e.message, 'error') }
    finally { setSending(false) }
  }

  const unread = tickets.filter(t => t.status === 'open' || t.status === 'replied').length

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <TopBar title="Pusat Dukungan" subtitle="Layanan bantuan & support teknis" onToggleSidebar={onToggleSidebar} />
      
      <div className="p-4 lg:p-6 h-[calc(100vh-80px)]">
        <div className="flex h-full max-w-[1400px] mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Left sidebar - ticket list */}
          <div className="w-80 lg:w-96 bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-5 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800">Percakapan Anda</h3>
                {unread > 0 && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    {unread} Aktif
                  </span>
                )}
              </div>
              <button onClick={() => setShowNew(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-600/20 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">edit_square</span> 
                Buat Tiket Baru
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {loading ? (
                <div className="flex justify-center py-12">
                  <span className="material-symbols-outlined animate-spin text-[32px] text-slate-300">sync</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[32px] text-slate-300">forum</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Belum ada percakapan</p>
                  <p className="text-xs text-slate-400 mt-1">Buat tiket baru untuk meminta bantuan.</p>
                </div>
              ) : tickets.map(t => {
                const isActive = selected?.id === t.id && !showNew;
                return (
                  <button key={t.id} onClick={() => { setSelected(t); setShowNew(false) }}
                    className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-white border-slate-200 shadow-sm ring-1 ring-slate-900/5' 
                        : 'bg-transparent border-transparent hover:bg-slate-100/80'
                    }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive || t.status === 'open' || t.status === 'replied' ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                          {t.subject || 'Tanpa Subjek'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 truncate">{t.name}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(t.updated_at || t.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                        </span>
                        {t.status !== 'closed' && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/40" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-white">
            {showNew ? (
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
                <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-[24px] text-indigo-600">support_agent</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Buat Tiket Baru</h3>
                    <p className="text-sm text-slate-500 mt-1">Tim support kami siap membantu menyelesaikan kendala Anda.</p>
                  </div>
                  <div className="p-8 space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Subjek Kendala (Opsional)</label>
                      <input type="text" placeholder="Misal: Kendala sinkronisasi produk..." value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Lengkap *</label>
                      <textarea placeholder="Ceritakan detail kendala yang Anda alami..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none placeholder:text-slate-400" />
                    </div>
                    
                    <div className="pt-2">
                      <button onClick={createTicket} disabled={sending || !form.message.trim()}
                        className="w-full px-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2">
                        {sending ? (
                          <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Memproses...</>
                        ) : (
                          <><span className="material-symbols-outlined text-[18px]">send</span> Kirim Tiket</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : selected ? (
              <>
                <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selected.subject || 'Tiket Tanpa Subjek'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 font-medium">Tiket ID: #{selected.id}</p>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <p className="text-xs text-slate-500">{new Date(selected.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${
                    selected.status === 'open' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50' :
                    selected.status === 'replied' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/50' : 
                    'bg-slate-100 text-slate-600 border border-slate-200/50'}`}>
                    {selected.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                  {messages.map((m, i) => {
                    const isMerchant = m.sender === 'merchant'
                    return (
                      <div key={m.id} className={`flex ${isMerchant ? 'justify-end' : 'justify-start'}`}>
                        {!isMerchant && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                            <span className="material-symbols-outlined text-[16px] text-indigo-600">support_agent</span>
                          </div>
                        )}
                        <div className={`max-w-[85%] lg:max-w-[70%] ${
                          isMerchant 
                            ? 'bg-indigo-600 text-white rounded-3xl rounded-tr-sm shadow-md shadow-indigo-600/10' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-3xl rounded-tl-sm shadow-sm'
                          } p-4 lg:px-5 lg:py-4`}>
                          
                          {isMerchant && (
                            <div className="flex items-center justify-end gap-2 mb-1.5 opacity-80">
                              <span className="text-[10px] font-medium text-indigo-200">
                                {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          {!isMerchant && (
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[11px] font-bold text-slate-700">{m.sender_name || 'Tim Support'}</span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          
                          <p className={`text-[15px] leading-relaxed ${isMerchant ? 'text-white' : 'text-slate-700'} whitespace-pre-wrap`}>
                            {m.message}
                          </p>
                          
                          {m.attachment_url && (
                            <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 mt-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                isMerchant 
                                  ? 'bg-indigo-500 hover:bg-indigo-400 text-white' 
                                  : 'bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200'
                              }`}>
                              <span className="material-symbols-outlined text-[16px]">image</span> Lihat Lampiran
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEnd} />
                </div>
                
                <div className="bg-white border-t border-slate-200 p-4 lg:p-5">
                  {selected.status === 'closed' ? (
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-200">
                      <p className="text-sm font-medium text-slate-500">Tiket ini telah ditutup. Silakan buat tiket baru jika ada kendala lain.</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                      <div className="flex-1 relative pl-2">
                        <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                          placeholder="Ketik balasan Anda di sini..." rows={1}
                          className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none resize-none placeholder:text-slate-400 min-h-[44px] max-h-32"
                          onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                          }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
                        {attach && (
                          <div className="absolute -top-10 left-0 flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm">
                            <span className="material-symbols-outlined text-[14px] text-indigo-500">attachment</span>
                            <span className="text-[11px] font-semibold text-indigo-700 truncate max-w-[200px]">{attach.name}</span>
                            <button onClick={() => {setAttach(null); if(fileInput.current) fileInput.current.value=''}} className="text-indigo-400 hover:text-indigo-600">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pr-1 pb-1">
                        <label className="p-2 rounded-xl hover:bg-slate-200 cursor-pointer text-slate-400 hover:text-slate-700 transition-colors">
                          <input type="file" accept="image/*" ref={fileInput} onChange={e => setAttach(e.target.files?.[0] || null)} className="hidden" />
                          <span className="material-symbols-outlined text-[22px]">attach_file</span>
                        </label>
                        <button onClick={sendMessage} disabled={sending || (!newMsg.trim() && !attach)}
                          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center">
                          {sending ? <span className="material-symbols-outlined text-[20px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-50/30">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3">
                    <span className="material-symbols-outlined text-[40px] text-indigo-400">support</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Pusat Bantuan Merchant</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pilih tiket di sebelah kiri untuk melihat percakapan, atau klik tombol <b>Buat Tiket Baru</b> untuk memulai sesi bantuan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {notif && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-xl shadow-slate-900/10 text-sm font-bold flex items-center gap-2 animate-slide-up ${
          notif.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <span className="material-symbols-outlined text-[18px]">
            {notif.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {notif.msg}
        </div>
      )}
    </div>
  )
}

