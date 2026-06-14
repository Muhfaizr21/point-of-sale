import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'

const rp = (v) => { if (!v && v !== 0) return 'Rp0'; if (v >= 1e9) return `Rp${(v/1e9).toFixed(2)}M`; if (v >= 1e6) return `Rp${(v/1e6).toFixed(1)}JT`; return `Rp${v.toLocaleString()}` }

function PureBar({data, valueKey, labelKey, color='#6366f1', height=160}) {
  if(!data||data.length===0) return null
  const max=Math.max(...data.map(d=>d[valueKey]||0),1)
  const colW=Math.floor(400/data.length)
  const barW=Math.min(colW*0.5,28)
  const h=height-30
  return(<div className="overflow-x-auto"><svg width={Math.max(data.length*colW,250)} height={height}>{data.map((d,i)=>{const v=d[valueKey]||0;const bh=(v/max)*h;const x=i*colW+(colW-barW)/2;const y=height-20-bh;return<g key={i}><rect x={x} y={y} width={barW} height={bh} fill={color} rx="3" opacity="0.8"/><text x={i*colW+colW/2} y={height-4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">{d[labelKey]?.slice(0,4)||''}</text></g>})}</svg></div>)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState(null); const [filters, setFilters] = useState({merchant_id:'',status:'',method:'',date_from:'',date_to:''}); const [loading, setLoading] = useState(true)
  const limit=20

  useEffect(()=>{
    setLoading(true)
    apiClient.get('/api/superadmin/orders/stats').then(setStats).catch(()=>{})
    const p=new URLSearchParams({page,limit}); Object.entries(filters).forEach(([k,v])=>{if(v)p.set(k,v)})
    apiClient.get(`/api/superadmin/orders?${p}`).then(d=>{setOrders(d.data||[]); setTotal(d.total||0); setTotalPages(d.total_pages||1); setPage(d.page||1)}).catch(()=>{}).finally(()=>setLoading(false))
  // eslint-disable-next-line
  }, [page])

  const goPage=(p)=>{if(p>=1&&p<=totalPages)setPage(p)}
  const applyFilter=()=>setPage(1)
  const resetFilter=()=>{setFilters({merchant_id:'',status:'',method:'',date_from:'',date_to:''});setPage(1)}

  const s=stats||{}

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-bold text-white/90">Semua Transaksi</h1><p className="text-sm text-white/30 mt-1">Pantau seluruh aktivitas transaksi dari semua merchant secara real-time</p></div>
        </div>

        {/* WHAT */}
        <div className="mb-6"><div className="flex items-center gap-2 mb-3"><h3 className="text-sm font-semibold text-white/80">Gambaran Transaksi</h3></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Total Transaksi</p><p className="text-lg font-bold text-white/90">{(s.total_orders||0).toLocaleString()}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Total Pendapatan</p><p className="text-lg font-bold text-white/90">{rp(s.total_revenue)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Rata-rata/Order</p><p className="text-lg font-bold text-white/90">{rp(s.avg_order_value)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Hari Ini (Orders)</p><p className="text-lg font-bold text-emerald-400">{(s.today_orders||0).toLocaleString()}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Hari Ini (Revenue)</p><p className="text-lg font-bold text-emerald-400">{rp(s.today_revenue)}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Completed</p><p className="text-lg font-bold text-emerald-400">{(s.completed||0).toLocaleString()}</p></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4"><p className="text-[10px] text-white/40">Pending / Gagal</p><p className="text-lg font-bold text-amber-400">{((s.pending||0)+(s.failed||0)).toLocaleString()}</p></div>
          </div>
        </div>

        {/* HOW - Payment Method Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Distribusi Metode Pembayaran</h3></div>
            <div className="grid grid-cols-2 gap-3">
              {[{label:'Tunai',val:s.cash_amount,icon:'payments',pct:s.total_revenue>0?((s.cash_amount||0)/s.total_revenue*100).toFixed(1):0},{label:'Transfer',val:s.transfer_amount,icon:'account_balance',pct:s.total_revenue>0?((s.transfer_amount||0)/s.total_revenue*100).toFixed(1):0},{label:'E-Wallet',val:s.ewallet_amount,icon:'qr_code',pct:s.total_revenue>0?((s.ewallet_amount||0)/s.total_revenue*100).toFixed(1):0},{label:'Kartu',val:s.card_amount,icon:'credit_card',pct:s.total_revenue>0?((s.card_amount||0)/s.total_revenue*100).toFixed(1):0}].map(m=>(<div key={m.label} className="bg-white/[0.03] rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-[16px] text-white/40">{m.icon}</span><span className="text-xs text-white/60">{m.label}</span></div><p className="text-sm font-bold text-white/90">{rp(m.val)}</p><div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${m.pct}%`}}/></div><p className="text-[10px] text-white/30 mt-1">{m.pct}% dari total</p></div>))}
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Status Transaksi</h3></div>
            <div className="space-y-4">
              {[{label:'Completed',val:s.completed||0,color:'#22c55e',pct:s.total_orders>0?((s.completed||0)/s.total_orders*100).toFixed(1):0},{label:'Pending',val:s.pending||0,color:'#f59e0b',pct:s.total_orders>0?((s.pending||0)/s.total_orders*100).toFixed(1):0},{label:'Failed',val:s.failed||0,color:'#ef4444',pct:s.total_orders>0?((s.failed||0)/s.total_orders*100).toFixed(1):0},{label:'Refunded',val:s.refunded||0,color:'#8b5cf6',pct:s.total_orders>0?((s.refunded||0)/s.total_orders*100).toFixed(1):0}].map(st=>(
                <div key={st.label}><div className="flex justify-between text-xs mb-1"><span className="text-white/60">{st.label}</span><span className="text-white/80 font-semibold">{st.val.toLocaleString()} ({st.pct}%)</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${st.pct}%`,background:st.color}}/></div></div>
              ))}
            </div>
          </div>
        </div>

        {/* FILTER + TABLE */}
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><label className="text-[10px] text-white/30 block mb-1">Merchant ID</label><input type="text" value={filters.merchant_id} onChange={e=>setFilters(p=>({...p,merchant_id:e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" placeholder="Semua"/></div>
            <div><label className="text-[10px] text-white/30 block mb-1">Status</label><select value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50"><option value="" className="bg-[#0a0a0a]">Semua</option><option value="COMPLETED" className="bg-[#0a0a0a]">Completed</option><option value="PENDING" className="bg-[#0a0a0a]">Pending</option><option value="FAILED" className="bg-[#0a0a0a]">Failed</option></select></div>
            <div><label className="text-[10px] text-white/30 block mb-1">Metode</label><select value={filters.method} onChange={e=>setFilters(p=>({...p,method:e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50"><option value="" className="bg-[#0a0a0a]">Semua</option><option value="CASH" className="bg-[#0a0a0a]">Tunai</option><option value="TRANSFER" className="bg-[#0a0a0a]">Transfer</option><option value="E_WALLET" className="bg-[#0a0a0a]">E-Wallet</option></select></div>
            <div><label className="text-[10px] text-white/30 block mb-1">Dari</label><input type="date" value={filters.date_from} onChange={e=>setFilters(p=>({...p,date_from:e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50"/></div>
            <div><label className="text-[10px] text-white/30 block mb-1">Sampai</label><input type="date" value={filters.date_to} onChange={e=>setFilters(p=>({...p,date_to:e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50"/></div>
          </div>
          <div className="flex items-center gap-2 mt-3"><button onClick={applyFilter} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer">Terapkan</button><button onClick={resetFilter} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs transition-all cursor-pointer">Reset</button><span className="text-[11px] text-white/30 ml-auto">{total} transaksi</span></div>
        </div>

        {loading?<div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>:<>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="text-[11px] text-white/30 border-b border-white/[0.06]"><th className="text-left py-3 px-4">Invoice</th><th className="text-left py-3 px-4">Cabang</th><th className="text-left py-3 px-4">Kasir</th><th className="text-right py-3 px-4">Total</th><th className="text-center py-3 px-4">Status</th><th className="text-left py-3 px-4">Metode</th><th className="text-right py-3 px-4">Tanggal</th></tr></thead>
              <tbody>{orders.map(o=>(<tr key={o.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]"><td className="py-3 px-4"><p className="text-white/80 font-mono text-[11px] font-semibold">{o.invoice_number}</p></td><td className="py-3 px-4 text-white/60 text-[12px]">{o.branch?.name||'-'}</td><td className="py-3 px-4 text-white/50 text-[12px]">{o.cashier||'-'}</td><td className="py-3 px-4 text-right text-white/80 font-semibold">{rp(o.total)}</td><td className="py-3 px-4 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.payment_status==='COMPLETED'?'bg-emerald-500/10 text-emerald-400':o.payment_status==='PENDING'?'bg-amber-500/10 text-amber-400':'bg-red-500/10 text-red-400'}`}>{o.payment_status}</span></td><td className="py-3 px-4 text-white/40 text-[11px]">{o.payment_method||'-'}</td><td className="py-3 px-4 text-right text-white/40 text-[11px]">{new Date(o.created_at).toLocaleDateString('id-ID')}</td></tr>))}
              {orders.length===0&&<tr><td colSpan={7} className="text-center py-16 text-white/20">Tidak ada transaksi</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/30">{(page-1)*limit+1}-{Math.min(page*limit,total)} dari {total}</span>
            <div className="flex items-center gap-1">
              <button onClick={()=>goPage(1)} disabled={page<=1} className="px-2 py-1.5 rounded-lg text-xs text-white/40 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"><span className="material-symbols-outlined text-[14px]">first_page</span></button>
              <button onClick={()=>goPage(page-1)} disabled={page<=1} className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed">←</button>
              {(()=>{const p=[];for(let i=Math.max(1,page-2);i<=Math.min(totalPages,page+2);i++)p.push(i);return p.map(i=>(<button key={i} onClick={()=>goPage(i)} className={`w-8 h-8 rounded-lg text-xs font-semibold ${i===page?'bg-blue-600 text-white':'text-white/50 hover:bg-white/10'}`}>{i}</button>))})()}
              <button onClick={()=>goPage(page+1)} disabled={page>=totalPages} className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed">→</button>
              <button onClick={()=>goPage(totalPages)} disabled={page>=totalPages} className="px-2 py-1.5 rounded-lg text-xs text-white/40 bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-[14px]">last_page</span></button>
            </div>
          </div>
        </>}
      </div>
    </div>
  )
}
