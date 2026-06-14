import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'
const rp = (v) => { if (!v && v !== 0) return 'Rp0'; if (v >= 1e9) return `Rp${(v/1e9).toFixed(2)}M`; if (v >= 1e6) return `Rp${(v/1e6).toFixed(1)}JT`; return `Rp${v.toLocaleString()}` }

export default function MerchantsPage() {
  const [data, setData] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState(''); const [loading, setLoading] = useState(true)
  const limit=20

  useEffect(()=>{setLoading(true);apiClient.get(`/api/superadmin/revenue/merchants?page=${page}&limit=${limit}`).then(d=>{setData(d.data||[]);setTotal(d.total||0)}).catch(()=>{}).finally(()=>setLoading(false))},[page])

  const totalPages=Math.ceil(total/limit)
  const filtered=data.filter(m=>{
    if(search){const q=search.toLowerCase();if(!m.name?.toLowerCase().includes(q)&&!m.code?.toLowerCase().includes(q))return false}
    if(statusFilter&&m.subscription_status!==statusFilter)return false
    return true
  })

  const activeCount=data.filter(m=>m.subscription_status==='active').length
  const trialCount=data.filter(m=>m.subscription_status==='trial').length
  const totalRev=data.reduce((s,m)=>s+(m.total_revenue||0),0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-bold text-white/90">Pendapatan Merchant</h1><p className="text-sm text-white/30 mt-1">Analisis performa finansial setiap merchant secara detail</p></div></div>

        {/* WHAT */}
        <div className="mb-6"><div className="flex items-center gap-2 mb-3"><h3 className="text-sm font-semibold text-white/80">Ringkasan Merchant</h3></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Total Merchant</p><p className="text-lg font-bold text-white/90">{total}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Aktif</p><p className="text-lg font-bold text-emerald-400">{activeCount}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Trial</p><p className="text-lg font-bold text-amber-400">{trialCount}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Total Revenue</p><p className="text-lg font-bold text-white/90">{rp(totalRev)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Rata-rata/Merchant</p><p className="text-lg font-bold text-white/90">{data.length>0?rp(totalRev/data.length):'Rp0'}</p></div>
          </div>
        </div>

        {/* WHO + WHERE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Status Subscription</h3></div>
            <div className="space-y-3">
              {[{label:'Aktif',val:activeCount,color:'#22c55e',pct:total>0?(activeCount/total*100).toFixed(1):0},{label:'Trial',val:trialCount,color:'#f59e0b',pct:total>0?(trialCount/total*100).toFixed(1):0},{label:'Expired',val:data.filter(m=>m.subscription_status==='expired').length,color:'#ef4444',pct:total>0?((data.filter(m=>m.subscription_status==='expired').length)/total*100).toFixed(1):0},{label:'No Plan',val:data.filter(m=>m.subscription_status==='none').length,color:'#6b7280',pct:total>0?((data.filter(m=>m.subscription_status==='none').length)/total*100).toFixed(1):0}].map(st=>(
                <div key={st.label}><div className="flex justify-between text-xs mb-1"><span className="text-white/60">{st.label}</span><span className="text-white/80 font-semibold">{st.val}</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${st.pct}%`,background:st.color}}/></div></div>))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Top Merchant</h3></div>
            <div className="overflow-x-auto"><table className="w-full text-xs">
              <thead><tr className="text-[10px] text-white/30 border-b border-white/[0.06]"><th className="text-left py-2 px-3">#</th><th className="text-left py-2 px-3">Merchant</th><th className="text-left py-2 px-3">Plan</th><th className="text-center py-2 px-3">Status</th><th className="text-right py-2 px-3">Total Order</th><th className="text-right py-2 px-3">Total Revenue</th><th className="text-right py-2 px-3">Last Payment</th></tr></thead>
              <tbody>{filtered.slice(0,10).map((m,i)=>(<tr key={m.merchant_id} className="border-b border-white/[0.03]"><td className="py-2 px-3 text-white/30">{i+1}</td><td className="py-2 px-3"><p className="text-white/80 font-medium">{m.name}</p><p className="text-[9px] text-white/30">{m.code}</p></td><td className="py-2 px-3 text-white/50">{m.plan_name||'-'}</td><td className="py-2 px-3 text-center"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${m.subscription_status==='active'?'bg-emerald-500/10 text-emerald-400':m.subscription_status==='trial'?'bg-amber-500/10 text-amber-400':'bg-red-500/10 text-red-400'}`}>{m.subscription_status}</span></td><td className="py-2 px-3 text-right text-white/70">{(m.total_orders||0).toLocaleString()}</td><td className="py-2 px-3 text-right text-white-80 font-semibold">{rp(m.total_revenue)}</td><td className="py-2 px-3 text-right text-white/40">{m.last_payment?new Date(m.last_payment).toLocaleDateString('id-ID'):'-'}</td></tr>))}
              {filtered.length===0&&<tr><td colSpan={7} className="text-center py-12 text-white/20">Tidak ada data</td></tr>}
              </tbody></table></div>
          </div>
        </div>

        {/* FILTER + FULL TABLE */}
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg flex-1 max-w-xs"><span className="material-symbols-outlined text-[16px] text-white/30">search</span><input type="text" placeholder="Cari merchant..." value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-white/20"/></div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50"><option value="" className="bg-[#0a0a0a]">Semua Status</option><option value="active" className="bg-[#0a0a0a]">Active</option><option value="trial" className="bg-[#0a0a0a]">Trial</option><option value="expired" className="bg-[#0a0a0a]">Expired</option></select>
            <span className="text-[11px] text-white/30">{filtered.length} merchant</span>
          </div>
        </div>

        {loading?<div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>:<>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="text-[11px] text-white/30 border-b border-white/[0.06]"><th className="text-left py-3 px-4">Merchant</th><th className="text-left py-3 px-4">Plan</th><th className="text-center py-3 px-4">Status</th><th className="text-right py-3 px-4">Fee/Bulan</th><th className="text-right py-3 px-4">Total Order</th><th className="text-right py-3 px-4">Total Revenue</th><th className="text-right py-3 px-4">Pembayaran Terakhir</th></tr></thead>
              <tbody>{filtered.map(m=>(<tr key={m.merchant_id} className="border-b border-white/[0.03] hover:bg-white/[0.02]"><td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400">{m.name?.charAt(0)||'?'}</div><div><p className="text-white/80 font-medium text-[12px]">{m.name}</p><p className="text-[10px] text-white/30">{m.code}{m.email?` · ${m.email}`:''}</p></div></div></td><td className="py-3 px-4 text-white/60 text-[12px]">{m.plan_name||'-'}</td><td className="py-3 px-4 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.subscription_status==='active'?'bg-emerald-500/10 text-emerald-400':m.subscription_status==='trial'?'bg-amber-500/10 text-amber-400':'bg-red-500/10 text-red-400'}`}>{m.subscription_status}</span></td><td className="py-3 px-4 text-right text-white/60 text-[12px]">{rp(m.monthly_fee)}</td><td className="py-3 px-4 text-right text-white/70">{(m.total_orders||0).toLocaleString()}</td><td className="py-3 px-4 text-right text-white/80 font-semibold">{rp(m.total_revenue)}</td><td className="py-3 px-4 text-right text-white/40 text-[11px]">{m.last_payment?new Date(m.last_payment).toLocaleDateString('id-ID'):'-'}</td></tr>))}
              {filtered.length===0&&<tr><td colSpan={7} className="text-center py-16 text-white/20">Tidak ada data</td></tr>}
              </tbody></table>
          </div>
          {totalPages>1&&<div className="flex items-center justify-between"><span className="text-[11px] text-white/30">Halaman {page} dari {totalPages}</span><div className="flex items-center gap-1"><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed">←</button><span className="text-xs text-white/40 px-2">{page}/{totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed">→</button></div></div>}
        </>}
      </div>
    </div>
  )
}
