import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'

export default function SupportInboxPage() {
  const [messages, setMessages] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState(''); const [loading, setLoading] = useState(true); const [selected, setSelected] = useState(null); const [notif, setNotif] = useState(null); const limit = 20
  const show=(msg,type='success')=>{setNotif({msg,type});setTimeout(()=>setNotif(null),4000)}

  useEffect(()=>{setLoading(true);const p=new URLSearchParams({page,limit});if(statusFilter)p.set('status',statusFilter)
    apiClient.get(`/api/superadmin/contacts?${p}`).then(d=>{setMessages(d.data||[]);setTotal(d.total||0);setTotalPages(d.total_pages||1)}).catch(()=>{}).finally(()=>setLoading(false))
  },[page,statusFilter])

  const markRead=async(id)=>{try{await apiClient.put(`/api/superadmin/contacts/${id}/read`);setMessages(prev=>prev.map(m=>m.id===id?{...m,is_read:true}:m));setSelected(prev=>prev?.id===id?{...prev,is_read:true}:prev)}catch(e){}}
  const deleteMsg=async(id)=>{try{await apiClient.delete(`/api/superadmin/contacts/${id}`);setMessages(prev=>prev.filter(m=>m.id!==id));if(selected?.id===id)setSelected(null)}catch(e){}}

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-bold text-white/90">Kotak Masuk</h1><p className="text-sm text-white/30 mt-1">Pesan & pertanyaan dari merchant melalui halaman kontak</p></div></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="material-symbols-outlined text-[16px] text-white/30">filter_list</span>
                <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}} className="flex-1 bg-transparent border-none outline-none text-xs text-white">
                  <option value="" className="bg-[#0a0a0a]">Semua Pesan</option>
                  <option value="unread" className="bg-[#0a0a0a]">Belum Dibaca</option>
                  <option value="read" className="bg-[#0a0a0a]">Sudah Dibaca</option>
                </select>
                <span className="text-[10px] text-white/30">{total} pesan</span>
              </div>
            </div>
            <div className="space-y-2">
              {loading?<div className="flex justify-center py-12"><span className="material-symbols-outlined animate-spin text-[32px] text-white/20">sync</span></div>:messages.map(m=>(
                <button key={m.id} onClick={()=>{setSelected(m);if(!m.is_read)markRead(m.id)}}
                  className={`w-full text-left bg-[#0a0a0a] border rounded-xl p-4 transition-all cursor-pointer ${selected?.id===m.id?'border-blue-500/40':'border-white/[0.06] hover:border-white/10'} ${!m.is_read?'border-l-2 border-l-blue-500':''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!m.is_read?'font-bold text-white/90':'text-white/70'}`}>{m.name}</p>
                      <p className={`text-[11px] mt-0.5 truncate ${!m.is_read?'text-white/60':'text-white/40'}`}>{m.subject}</p>
                    </div>
                    <span className="text-[10px] text-white/30 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  {!m.is_read&&<span className="mt-2 inline-block w-2 h-2 rounded-full bg-blue-500"/>}
                </button>
              ))}
              {messages.length===0&&<p className="text-center py-12 text-white/20 text-sm">Belum ada pesan</p>}
            </div>
            {totalPages>1&&<div className="flex items-center justify-center gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="px-2 py-1 rounded text-xs bg-white/5 disabled:opacity-20 cursor-pointer text-white/50">←</button>
              <span className="text-xs text-white/30">{page}/{totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="px-2 py-1 rounded text-xs bg-white/5 disabled:opacity-20 cursor-pointer text-white/50">→</button>
            </div>}
          </div>

          <div className="lg:col-span-2">
            {selected?(
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white/90">{selected.subject}</h3>
                    <p className="text-xs text-white/40 mt-1">
                      Dari <span className="text-white/70 font-semibold">{selected.name}</span>
                      {selected.email?` · ${selected.email}`:''}
                      {selected.phone?` · ${selected.phone}`:''}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">{new Date(selected.created_at).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selected.is_read?'bg-emerald-500/10 text-emerald-400':'bg-amber-500/10 text-amber-400'}`}>{selected.is_read?'Sudah Dibaca':'Baru'}</span>
                    <button onClick={()=>deleteMsg(selected.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>
                {selected.email&&(
                  <div className="mt-6 pt-4 border-t border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-2">Balas ke email merchant:</p>
                    <a href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">reply</span> Balas Email
                    </a>
                  </div>
                )}
              </div>
            ):(
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-[64px] text-white/10">mail_outline</span>
                <p className="text-sm text-white/30 mt-4">Pilih pesan dari daftar untuk melihat detail</p>
              </div>
            )}
          </div>
        </div>

        {notif&&<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up backdrop-blur-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">{notif.msg}</div>}
      </div>
    </div>
  )
}
