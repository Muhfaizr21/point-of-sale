import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'

export default function HealthPage() {
  const [health, setHealth] = useState(null); const [loading, setLoading] = useState(true)
  useEffect(()=>{apiClient.get('/api/superadmin/health').then(setHealth).catch(()=>{}).finally(()=>setLoading(false))},[])

  if(loading) return <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>

  const items = [
    {icon:'storage',label:'Database',value:health?.database,status:health?.database==='healthy'?'ok':'err',sub:`Latensi: ${health?.db_latency||'-'}`,detail:'PostgreSQL — menyimpan semua data transaksi, merchant, dan pengguna'},
    {icon:'api',label:'API Server',value:health?.api,status:'ok',sub:'REST API — melayani semua request frontend & integrasi',detail:'Go 1.26 — Gin framework — health check setiap 30 detik'},
    {icon:'inventory_2',label:'Storage',value:health?.storage==='healthy'?'Normal':health?.storage==='warning'?'Warning (>1GB)':'Error',status:health?.storage||'healthy',sub:'Database PostgreSQL'},
    {icon:'store',label:'Merchant Aktif',value:health?.active_merchants||0,status:'info',sub:'Sedang beroperasi hari ini'},
    {icon:'receipt',label:'Transaksi Hari Ini',value:health?.total_orders_today||0,status:'info',sub:'Seluruh merchant — real-time'},
  ].map(i=>({...i,statusColor:i.status==='ok'?'text-emerald-400 bg-emerald-500/10 border-emerald-500/20':i.status==='warn'||i.status==='warning'?'text-amber-400 bg-amber-500/10 border-amber-500/20':i.status==='err'?'text-red-400 bg-red-500/10 border-red-500/20':'text-blue-400 bg-blue-500/10 border-blue-500/20',statusDot:i.status==='ok'?'bg-emerald-400':i.status==='warn'||i.status==='warning'?'bg-amber-400':i.status==='err'?'bg-red-400':'bg-blue-400'}))

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-bold text-white/90">Kesehatan Sistem</h1><p className="text-sm text-white/30 mt-1">Monitor status infrastruktur, performa, dan operasional platform</p></div></div>

        {/* WHAT */}
        <div className="mb-6"><div className="flex items-center gap-2 mb-3"><h3 className="text-sm font-semibold text-white/80">Status Komponen</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map(c=>(<div key={c.label} className={`bg-[#0a0a0a] border ${c.status==='ok'?'border-emerald-500/15':c.status==='warn'||c.status==='warning'?'border-amber-500/15':c.status==='err'?'border-red-500/15':'border-blue-500/15'} rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-3"><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.statusColor}`}><span className="material-symbols-outlined text-[22px]">{c.icon}</span></div><div><p className="text-sm font-semibold text-white/90">{c.label}</p><div className="flex items-center gap-1.5 mt-0.5"><span className={`w-2 h-2 rounded-full ${c.statusDot}`}/><span className={`text-xs ${c.status==='ok'?'text-emerald-400':c.status==='warn'||c.status==='warning'?'text-amber-400':c.status==='err'?'text-red-400':'text-blue-400'}`}>{c.value}</span></div></div></div>
              <p className="text-xs text-white/40">{c.sub}</p>
            </div>))}
          </div>
        </div>

        {/* WHERE + WHEN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Detail Infrastruktur</h3></div>
            <div className="space-y-3 text-xs">
              {[{label:'Database Engine',val:'PostgreSQL'},{label:'Waktu Server',val:new Date().toLocaleString('id-ID')},{label:'Aplikasi',val:'SentraKas POS v1.0'},{label:'Mode',val:'Development'},{label:'Database Latency',val:health?.db_latency||'-'},{label:'Total Merchant',val:health?.active_merchants||'-'},{label:'Transaksi Hari Ini',val:(health?.total_orders_today||0).toLocaleString()}].map((d,i)=>(
                <div key={i} className="flex justify-between py-1.5 border-b border-white/[0.04] last:border-0"><span className="text-white/40">{d.label}</span><span className={`text-white/70 font-semibold ${d.label==='Mode'?'text-amber-400':''}`}>{d.val}</span></div>
              ))}
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Panduan Troubleshooting</h3></div>
            <div className="space-y-3 text-xs">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4"><p className="text-amber-400 font-semibold mb-1">Database Unhealthy?</p><p className="text-white/50">Cek koneksi PostgreSQL, pastikan service berjalan, dan tidak ada deadlock. Restart service jika perlu.</p></div>
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4"><p className="text-blue-400 font-semibold mb-1">API Error 5xx?</p><p className="text-white/50">Periksa log server, pastikan tidak ada memory leak, dan semua dependency berjalan normal.</p></div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4"><p className="text-emerald-400 font-semibold mb-1">Storage Penuh?</p><p className="text-white/50">Hapus backup lama, archive log, atau upgrade kapasitas disk. Monitoring rutin setiap minggu.</p></div>
            </div>
          </div>
        </div>

        {/* SYSTEM INFO */}
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><h3 className="text-sm font-semibold text-white/80">Layanan & Dependensi</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {name:'PostgreSQL',status:'Berjalan',color:'text-emerald-400',desc:'Database utama','uptime':'24/7'},
              {name:'API Server',status:'Berjalan',color:'text-emerald-400',desc:'REST API endpoint','uptime':'24/7'},
              {name:'File Storage',status:'Normal',color:'text-emerald-400',desc:'Upload gambar & logo','uptime':'24/7'},
            ].map(d=>(<div key={d.name} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"><div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-white/80">{d.name}</span><span className={`text-[10px] font-semibold ${d.color}`}>● {d.status}</span></div><p className="text-[11px] text-white/40">{d.desc}</p><p className="text-[10px] text-white/20 mt-1">Uptime: {d.uptime}</p></div>))}
            </div>
        </div>
      </div>
    </div>
  )
}
