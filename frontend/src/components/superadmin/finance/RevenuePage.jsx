import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'

const rp = (v) => { if (!v && v !== 0) return 'Rp0'; const s = Math.abs(v); if (s >= 1e9) return `Rp${(v/1e9).toFixed(2)}M`; if (s >= 1e6) return `Rp${(v/1e6).toFixed(1)}JT`; if (s >= 1e3) return `Rp${(v/1e3).toFixed(0)}RB`; return `Rp${v.toLocaleString()}` }

function StatCard({ icon, label, value, sub, trend, color, badge }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between"><div className={`w-10 h-10 rounded-xl ${color||'bg-white/5'} flex items-center justify-center shrink-0`}><span className="material-symbols-outlined text-[20px] text-white/60">{icon}</span></div>{badge&&<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/40">{badge}</span>}</div>
      <p className="text-[11px] text-white/40 mt-3">{label}</p>
      <div className="flex items-end gap-2"><p className="text-xl font-bold text-white/90">{value}</p>{trend!==undefined&&trend!==null&&<span className={`text-[11px] font-semibold mb-0.5 ${trend>=0?'text-emerald-400':'text-red-400'}`}>{trend>=0?'+':''}{trend}%</span>}</div>
      {sub&&<p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
    </div>
  )
}

function DonutChart({data, valueKey, labelKey, colors, size=140}) {
  if(!data||data.length===0) return null
  const total=data.reduce((s,d)=>s+(d[valueKey]||0),0)
  if(total===0) return null
  const cx=size/2, cy=size/2, r=size*0.38
  let acc=-Math.PI/2
  const def=['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4']
  return(<div className="flex items-center gap-4">
    <svg width={size} height={size}>{data.map((d,i)=>{const v=d[valueKey]||0;const a=(v/total)*Math.PI*2;const x1=cx+r*Math.cos(acc);const y1=cy+r*Math.sin(acc);const x2=cx+r*Math.cos(acc+a);const y2=cy+r*Math.sin(acc+a);const la=a>Math.PI?1:0;const c=(colors&&colors[i%colors.length])||def[i%def.length];const p=[`M ${cx} ${cy}`,`L ${x1} ${y1}`,`A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`,'Z'].join(' ');acc+=a;return<path key={i} d={p} fill={c} opacity="0.85"/>})}
      <circle cx={cx} cy={cy} r={r*0.6} fill="#0a0a0a"/><text x={cx} y={cy-4} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="bold">{total}</text><text x={cx} y={cy+11} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">Total</text></svg>
    <div className="space-y-1.5">{data.map((d,i)=>{const c=(colors&&colors[i%colors.length])||def[i%def.length];const pct=((d[valueKey]||0)/total*100).toFixed(1);return(<div key={i} className="flex items-center gap-2 text-[11px]"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{background:c}}/><span className="text-white/50 min-w-[60px]">{d[labelKey]}</span><span className="text-white/80 font-semibold min-w-[40px] text-right">{pct}%</span><span className="text-white/30">({d[valueKey]})</span></div>)})}</div></div>)
}

function PureBar({data, valueKey, labelKey, color='#6366f1', height=180}) {
  if(!data||data.length===0) return null
  const max=Math.max(...data.map(d=>d[valueKey]||0),1)
  const colW=Math.floor(500/data.length)
  const barW=Math.min(colW*0.6,36)
  const h=height-30
  return(<div className="overflow-x-auto"><svg width={Math.max(data.length*colW,300)} height={height}>
    {data.map((d,i)=>{const v=d[valueKey]||0;const bh=(v/max)*h;const x=i*colW+(colW-barW)/2;const y=height-20-bh;return<g key={i}><rect x={x} y={y} width={barW} height={bh} fill={color} rx="3" opacity="0.8"/><text x={i*colW+colW/2} y={height-4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">{d[labelKey]?.slice(0,5)||''}</text></g>})}</svg></div>)
}

function HorizontalBar({data, valueKey, labelKey, color='#6366f1'}) {
  if(!data||data.length===0) return null
  const m=Math.max(...data.map(d=>d[valueKey]||0),1)
  return(<div className="space-y-2">{data.map((d,i)=>(<div key={i}><div className="flex justify-between text-[11px] mb-1"><span className="text-white/60 truncate">{d[labelKey]}</span><span className="text-white/80 font-semibold shrink-0 ml-2">{rp(d[valueKey])}</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${(d[valueKey]/m)*100}%`,background:color}}/></div></div>))}</div>)
}

export default function RevenuePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{apiClient.get('/api/superadmin/revenue').then(setData).catch(()=>{}).finally(()=>setLoading(false))},[])

  if(loading) return <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>
  const s=data?.stats; const m=data?.monthly||[]
  if(!s) return <div className="text-center py-24 text-white/30">Gagal memuat data</div>
  const revTrend=m.length>=2?((m[m.length-1].revenue-m[m.length-2].revenue)/(m[m.length-2].revenue||1)*100).toFixed(0):null

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-bold text-white/90">Ringkasan Keuangan</h1><p className="text-sm text-white/30 mt-1">Analisis pendapatan, pertumbuhan, dan kesehatan finansial platform secara 360°</p></div>
          <div className="flex items-center gap-2 text-[11px] text-white/30"><span className="material-symbols-outlined text-[14px]">calendar_today</span>{new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
        </div>

        {/* WHAT */}
        <div className="mb-6"><div className="flex items-center gap-2 mb-3"><h3 className="text-sm font-semibold text-white/80">Ringkasan Angka Kunci Platform</h3></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatCard icon="store" label="Total Merchant" value={s.total_merchants} color="bg-blue-500/20"/>
            <StatCard icon="check_circle" label="Aktif" value={s.active_subscriptions} sub={`${s.trial_subscriptions} trial`} color="bg-emerald-500/20"/>
            <StatCard icon="money" label="MRR" value={rp(s.mrr)} color="bg-amber-500/20"/>
            <StatCard icon="trending_down" label="Churn Rate" value={`${(s.churn_rate||0).toFixed(1)}%`} color="bg-red-500/20"/>
            <StatCard icon="receipt" label="Orders Bulan Ini" value={(s.total_orders_month||0).toLocaleString()} trend={Number(revTrend)} color="bg-violet-500/20"/>
            <StatCard icon="payments" label="Revenue Bulan Ini" value={rp(s.total_revenue_month)} color="bg-indigo-500/20"/>
            <StatCard icon="person_add" label="Merchant Baru" value={s.new_merchants_month} color="bg-cyan-500/20"/>
            <StatCard icon="cancel" label="Expired" value={s.expired_subscriptions} color="bg-gray-500/20"/>
          </div>
        </div>

        {m.length>0&&(<>
          {/* WHEN */}
          <div className="mb-6"><div className="flex items-center gap-2 mb-3"><h3 className="text-sm font-semibold text-white/80">Tren Revenue Tahunan</h3></div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <PureBar data={m} valueKey="revenue" labelKey="month" color="#6366f1" height={220}/>
              <div className="mt-4 overflow-x-auto"><table className="w-full text-xs">
                <thead><tr className="text-[10px] text-white/30 border-b border-white/[0.06]"><th className="text-left py-2 px-3">Bulan</th><th className="text-right py-2 px-3">Revenue</th><th className="text-right py-2 px-3">Baru</th><th className="text-right py-2 px-3">Churned</th><th className="text-center py-2 px-3">Growth</th><th className="text-right py-2 px-3">Avg/Order</th></tr></thead>
                <tbody>{m.map((r,i)=>{const prev=i>0?m[i-1].revenue:r.revenue;const g=prev>0?((r.revenue-prev)/prev*100).toFixed(1):'0';const avg=r.new_merchants>0?Math.round(r.revenue/(r.new_merchants||1)):0;return(<tr key={r.month} className="border-b border-white/[0.03] hover:bg-white/[0.02]"><td className="py-2 px-3 text-white/70 font-medium">{r.month}</td><td className="py-2 px-3 text-right text-white/80 font-semibold">{rp(r.revenue)}</td><td className="py-2 px-3 text-right text-emerald-400">+{r.new_merchants}</td><td className="py-2 px-3 text-right text-red-400">{r.churned>0?`-${r.churned}`:'-'}</td><td className="py-2 px-3 text-center"><span className={`text-[10px] font-semibold ${Number(g)>=0?'text-emerald-400':'text-red-400'}`}>{Number(g)>=0?'+':''}{g}%</span></td><td className="py-2 px-3 text-right text-white/50">{rp(avg)}</td></tr>)})}</tbody></table></div>
            </div>
          </div>

          {/* HOW + WHERE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Metode Pembayaran</h3></div>
              {(s.payment_methods||[]).length>0?<HorizontalBar data={s.payment_methods} valueKey="total" labelKey="method" color="#8b5cf6"/>:<p className="text-xs text-white/30">Belum ada data</p>}
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Distribusi per Hari</h3></div>
              {(s.weekday_distribution||[]).length>0?<PureBar data={s.weekday_distribution} valueKey="count" labelKey="day" color="#22c55e"/>:<p className="text-xs text-white/30">Belum ada data</p>}
            </div>
          </div>

          {/* WHO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Top Merchant</h3></div>
              {(s.top_merchants||[]).length>0?<div className="space-y-2">{(s.top_merchants||[]).map((m,i)=>(<div key={m.id} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0"><span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${i<3?'bg-amber-500/20 text-amber-400':'bg-white/5 text-white/40'}`}>{i+1}</span><div className="flex-1 min-w-0"><p className="text-xs text-white/80 font-medium truncate">{m.name}</p><p className="text-[10px] text-white/30">{m.code} · {m.orders} transaksi</p></div><span className="text-xs text-white/80 font-semibold">{rp(m.total)}</span></div>))}</div>:<p className="text-xs text-white/30">Belum ada data</p>}
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Distribusi Plan</h3></div>
              {(s.plan_distribution||[]).length>0?<DonutChart data={s.plan_distribution} valueKey="count" labelKey="plan" colors={['#6366f1','#22c55e','#f59e0b','#8b5cf6','#06b6d4']} size={160}/>:<p className="text-xs text-white/30">Belum ada data</p>}
            </div>
          </div>

          {/* WHY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Retensi & Churn</h3></div>
              <div className="flex items-center justify-center gap-8 py-4"><div className="text-center"><p className="text-3xl font-bold text-emerald-400">{(100-(s.churn_rate||0)).toFixed(1)}%</p><p className="text-[11px] text-white/40 mt-1">Retensi</p></div><div className="w-px h-12 bg-white/[0.06]"/><div className="text-center"><p className="text-3xl font-bold text-red-400">{(s.churn_rate||0).toFixed(1)}%</p><p className="text-[11px] text-white/40 mt-1">Churn Rate</p></div></div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-red-500 rounded-full" style={{width:`${100-(s.churn_rate||0)}%`}}/></div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Trial → Bayar</h3></div>
              <div className="text-center py-4"><p className="text-3xl font-bold text-amber-400">{s.trial_conversion?`${s.trial_conversion.toFixed(1)}%`:'-'}</p><p className="text-[11px] text-white/40 mt-1">Konversi Trial ke Berbayar</p></div>
              <div className="flex justify-between text-xs text-white/40 mt-3"><span>Trial: {s.trial_subscriptions}</span><span>Aktif: {s.active_subscriptions}</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden mt-1"><div className="h-full bg-amber-500 rounded-full" style={{width:`${s.total_merchants>0?(s.trial_subscriptions/s.total_merchants)*100:0}%`}}/></div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Revenue per Merchant</h3></div>
              <div className="text-center py-4"><p className="text-2xl font-bold text-white/90">{s.active_subscriptions>0?rp(Math.round(s.mrr/s.active_subscriptions)):'Rp0'}</p><p className="text-[11px] text-white/40 mt-1">Rata-rata MRR per Merchant</p></div>
              <div className="mt-4 space-y-2 text-xs text-white/40"><div className="flex justify-between"><span>Total MRR</span><span className="text-white/70 font-semibold">{rp(s.mrr)}</span></div><div className="flex justify-between"><span>Revenue Bulan Ini</span><span className="text-white/70 font-semibold">{rp(s.total_revenue_month)}</span></div><div className="flex justify-between"><span>Orders Bulan Ini</span><span className="text-white/70 font-semibold">{(s.total_orders_month||0).toLocaleString()}</span></div><div className="flex justify-between"><span>Total Merchant</span><span className="text-white/70 font-semibold">{s.total_merchants}</span></div></div>
            </div>
          </div>
        </>)}
      </div>
    </div>
  )
}
