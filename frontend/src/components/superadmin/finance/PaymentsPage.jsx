import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'
const rp = (v) => { if (!v && v !== 0) return 'Rp0'; if (v >= 1e9) return `Rp${(v/1e9).toFixed(2)}M`; if (v >= 1e6) return `Rp${(v/1e6).toFixed(1)}JT`; return `Rp${v.toLocaleString()}` }

export default function PaymentsPage() {
  const [data, setData] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [stats, setStats] = useState(null); const [filters, setFilters] = useState({status:'',date_from:'',date_to:''}); const [loading, setLoading] = useState(true)
  const limit=20

  useEffect(()=>{setLoading(true);apiClient.get('/api/superadmin/subscriptions/payments/stats').then(setStats).catch(()=>{})
    const p=new URLSearchParams({page,limit});Object.entries(filters).forEach(([k,v])=>{if(v)p.set(k,v)})
    apiClient.get(`/api/superadmin/subscriptions/payments?${p}`).then(d=>{setData(d.data||[]);setTotal(d.total||0)}).catch(()=>{}).finally(()=>setLoading(false))// eslint-disable-next-line
  },[page,filters])

  const totalPages=Math.ceil(total/limit)
  const s=stats||{}

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-bold text-white/90">Riwayat Pembayaran</h1><p className="text-sm text-white/30 mt-1">Pantau seluruh transaksi pembayaran subscription dari semua merchant</p></div></div>

        {/* WHAT */}
        <div className="mb-6"><div className="flex items-center gap-2 mb-3"><h3 className="text-sm font-semibold text-white/80">Ringkasan Pembayaran</h3></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Terkumpul</p><p className="text-lg font-bold text-emerald-400">{rp(s.total_collected)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Pending</p><p className="text-lg font-bold text-amber-400">{rp(s.total_pending)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Gagal</p><p className="text-lg font-bold text-red-400">{rp(s.total_failed)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Bulan Ini</p><p className="text-lg font-bold text-white/90">{rp(s.this_month)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Bulan Lalu</p><p className="text-lg font-bold text-white/90">{rp(s.last_month)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Transaksi Lunas</p><p className="text-lg font-bold text-emerald-400">{(s.paid_count||0).toLocaleString()}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Transaksi Pending</p><p className="text-lg font-bold text-amber-400">{(s.pending_count||0).toLocaleString()}</p></div>
          </div>
        </div>

        {/* HOW + WHY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Distribusi Status Pembayaran</h3></div>
            <div className="space-y-4">
              {[{label:'Lunas',val:s.total_collected||0,color:'#22c55e',pct:(s.total_collected||0)+(s.total_pending||0)+(s.total_failed||0)>0?((s.total_collected||0)/((s.total_collected||0)+(s.total_pending||0)+(s.total_failed||0))*100).toFixed(1):0},{label:'Pending',val:s.total_pending||0,color:'#f59e0b',pct:(s.total_collected||0)+(s.total_pending||0)+(s.total_failed||0)>0?((s.total_pending||0)/((s.total_collected||0)+(s.total_pending||0)+(s.total_failed||0))*100).toFixed(1):0},{label:'Gagal',val:s.total_failed||0,color:'#ef4444',pct:(s.total_collected||0)+(s.total_pending||0)+(s.total_failed||0)>0?((s.total_failed||0)/((s.total_collected||0)+(s.total_pending||0)+(s.total_failed||0))*100).toFixed(1):0}].map(st=>(
                <div key={st.label}><div className="flex justify-between text-xs mb-1"><span className="text-white/60">{st.label}</span><span className="text-white/80 font-semibold">{rp(st.val)} ({st.pct}%)</span></div><div className="h-2.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${st.pct}%`,background:st.color}}/></div></div>))}
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Tren Bulanan</h3></div>
            <div className="flex items-center justify-center gap-8 py-6">
              <div className="text-center"><p className="text-2xl font-bold text-white/90">{rp(s.this_month)}</p><p className="text-[11px] text-white/40 mt-1">Bulan Ini</p></div>
              <div className="w-px h-12 bg-white/[0.06]"/>
              <div className="text-center"><p className="text-2xl font-bold text-white/90">{rp(s.last_month)}</p><p className="text-[11px] text-white/40 mt-1">Bulan Lalu</p></div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" style={{width:`${Math.max(s.last_month||1)>0?((s.this_month||0)/Math.max(s.last_month||1)*100):0}%`}}/></div>
            <p className="text-[10px] text-white/30 text-center mt-2">{s.last_month>0?`${((((s.this_month||0)-(s.last_month||0))/(s.last_month||1))*100).toFixed(1)}% vs bulan lalu`:'Belum ada data bulan lalu'}</p>
          </div>
        </div>

        {/* FILTER */}
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50"><option value="" className="bg-[#0a0a0a]">Semua Status</option><option value="paid" className="bg-[#0a0a0a]">Lunas</option><option value="pending" className="bg-[#0a0a0a]">Pending</option><option value="failed" className="bg-[#0a0a0a]">Gagal</option></select>
            <input type="date" value={filters.date_from} onChange={e=>setFilters(p=>({...p,date_from:e.target.value}))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50"/>
            <input type="date" value={filters.date_to} onChange={e=>setFilters(p=>({...p,date_to:e.target.value}))} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50"/>
            <button onClick={()=>{setPage(1);setFilters({status:'',date_from:'',date_to:''})}} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs transition-all cursor-pointer">Reset</button>
            <span className="text-[11px] text-white/30 ml-auto">{total} transaksi</span>
          </div>
        </div>

        {loading?<div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>:<>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="text-[11px] text-white/30 border-b border-white/[0.06]"><th className="text-left py-3 px-4">Merchant</th><th className="text-left py-3 px-4">Plan</th><th className="text-right py-3 px-4">Jumlah</th><th className="text-center py-3 px-4">Status</th><th className="text-left py-3 px-4">Metode</th><th className="text-right py-3 px-4">Tanggal Bayar</th><th className="text-left py-3 px-4">Invoice</th></tr></thead>
              <tbody>{data.map(p=>(<tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]"><td className="py-3 px-4"><p className="text-white/80 text-[12px] font-medium">{p.merchant?.name||'-'}</p><p className="text-[10px] text-white/30">{p.merchant?.code||''}</p></td><td className="py-3 px-4 text-white/50 text-[12px]">{p.subscription?.plan?.name||'-'}</td><td className="py-3 px-4 text-right text-white/80 font-semibold">{rp(p.amount)}</td><td className="py-3 px-4 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status==='paid'?'bg-emerald-500/10 text-emerald-400':p.status==='pending'?'bg-amber-500/10 text-amber-400':'bg-red-500/10 text-red-400'}`}>{p.status}</span></td><td className="py-3 px-4 text-white/40 text-[11px]">{p.payment_method||'-'}</td><td className="py-3 px-4 text-right text-white/40 text-[11px]">{p.paid_at?new Date(p.paid_at).toLocaleDateString('id-ID'):'-'}</td><td className="py-3 px-4">{p.invoice_url?<a href={p.invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-[11px] underline">Lihat</a>:<span className="text-white/20 text-[11px]">-</span>}</td></tr>))}
              {data.length===0&&<tr><td colSpan={7} className="text-center py-16 text-white/20">Belum ada pembayaran</td></tr>}
              </tbody></table>
          </div>
          {totalPages>1&&<div className="flex items-center justify-center gap-2"><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed">←</button><span className="text-xs text-white/40">Hal {page}/{totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed">→</button></div>}
        </>}
      </div>
    </div>
  )
}
