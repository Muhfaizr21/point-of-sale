import React, { useState, useEffect, useRef } from 'react'
import { apiClient } from '../../services/apiClient'
const rp = (v) => { if (!v && v !== 0) return 'Rp0'; if (v >= 1e9) return `Rp${(v/1e9).toFixed(2)}M`; if (v >= 1e6) return `Rp${(v/1e6).toFixed(1)}JT`; return `Rp${v.toLocaleString()}` }

export default function ExportPage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(false); const [dateFrom, setDateFrom] = useState(''); const [dateTo, setDateTo] = useState(''); const [notif, setNotif] = useState(null)
  const reportRef = useRef(null)
  const show = (msg, t = 'success') => { setNotif({ msg, type: t }); setTimeout(() => setNotif(null), 4000) }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(); if (dateFrom) params.set('date_from', dateFrom); if (dateTo) params.set('date_to', dateTo)
      const d = await apiClient.get(`/api/superadmin/export?${params}`)
      setData(d)
    } catch (e) { show(e.message, 'error') } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const printReport = () => {
    if (!reportRef.current) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) { show('Izinkan popup untuk mencetak', 'error'); return }
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Laporan Platform - SentraKas</title>
      <style>
        @page { margin: 20mm 15mm; size: A4; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; background: #fff; padding: 0; }
        .report { max-width: 210mm; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #6366f1; margin-bottom: 24px; }
        .header h1 { font-size: 22px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px; }
        .header p { font-size: 11px; color: #888; margin-top: 4px; }
        .header .badge { display: inline-block; background: #6366f1; color: #fff; font-size: 9px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-top: 8px; letter-spacing: 1px; text-transform: uppercase; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-card { background: #f8f7ff; border: 1px solid #e8e5ff; border-radius: 12px; padding: 14px; text-align: center; }
        .stat-card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .stat-card .value { font-size: 20px; font-weight: 800; color: #1a1a1a; margin-top: 4px; }
        .stat-card .sub { font-size: 10px; color: #aaa; margin-top: 2px; }
        .section-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
        th { background: #f5f3ff; text-align: left; padding: 8px 10px; font-weight: 600; color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid #e8e5ff; }
        td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; color: #444; }
        tr:nth-child(even) td { background: #fafafa; }
        .footer { text-align: center; font-size: 9px; color: #bbb; padding-top: 20px; border-top: 1px solid #eee; margin-top: 20px; }
        .footer strong { color: #888; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      <div class="report">${reportRef.current.innerHTML}</div>
      <script>window.onload = function() { window.print(); window.close(); }</script>
      </body></html>
    `)
    printWindow.document.close()
  }

  const s = data || {}

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-bold text-white/90">Export Data Platform</h1><p className="text-sm text-white/30 mt-1">Buat laporan PDF profesional dengan data platform</p></div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
            <span className="text-white/30 text-xs">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
            <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs transition-all cursor-pointer">Terapkan</button>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div> : data ? (
          <>
            {/* Hidden printable report */}
            <div ref={reportRef} style={{ display: 'none' }}>
              <div class="header">
                <h1>Laporan Platform SentraKas</h1>
                <p>Periode: {s.period || 'Semua Waktu'} · Dibuat: {s.generated_at || new Date().toLocaleString('id-ID')}</p>
                <div class="badge">Laporan Executive</div>
              </div>

              <div class="stats-grid">
                <div class="stat-card"><div class="label">Total Merchant</div><div class="value">{s.merchants?.total||0}</div><div class="sub">{s.merchants?.active||0} aktif</div></div>
                <div class="stat-card"><div class="label">Total Orders</div><div class="value">{(s.orders?.total||0).toLocaleString()}</div><div class="sub">{s.orders?.completed||0} selesai</div></div>
                <div class="stat-card"><div class="label">Total Revenue</div><div class="value">{rp(s.orders?.revenue)}</div><div class="sub">Rp{(s.revenue?.per_merchant||0).toLocaleString()}/merchant</div></div>
                <div class="stat-card"><div class="label">MRR</div><div class="value">{rp(s.revenue?.mrr)}</div><div class="sub">Bulanan</div></div>
              </div>

              <div class="section-title">📊 Rincian Merchant</div>
              <table><thead><tr><th>Total</th><th>Aktif</th><th>Trial</th><th>Baru (Periode)</th></tr></thead>
              <tbody><tr><td>{(s.merchants?.total||0).toLocaleString()}</td><td>{(s.merchants?.active||0).toLocaleString()}</td><td>{(s.merchants?.trial||0).toLocaleString()}</td><td>{(s.merchants?.new||0).toLocaleString()}</td></tr></tbody></table>

              <div class="section-title">📈 Rincian Orders</div>
              <table><thead><tr><th>Total Transaksi</th><th>Selesai</th><th>Total Pendapatan</th><th>Rata-rata/Order</th></tr></thead>
              <tbody><tr><td>{(s.orders?.total||0).toLocaleString()}</td><td>{(s.orders?.completed||0).toLocaleString()}</td><td>{rp(s.orders?.revenue)}</td><td>{s.orders?.total>0?rp(Math.round((s.orders?.revenue||0)/(s.orders?.total||1))):'Rp0'}</td></tr></tbody></table>

              <div class="section-title">🏆 Top Merchant</div>
              <table><thead><tr><th>#</th><th>Merchant</th><th>Total Orders</th><th>Total Revenue</th></tr></thead>
              <tbody>{(s.top_merchants||[]).slice(0,10).map((m,i)=>`<tr><td>${i+1}</td><td>${m.name}</td><td>${(m.orders||0).toLocaleString()}</td><td>${rp(m.total)}</td></tr>`).join('')}</tbody></table>

              <div class="section-title">📅 Revenue Bulanan (12 Bulan Terakhir)</div>
              <table><thead><tr><th>Bulan</th><th>Revenue</th><th>Merchant Baru</th><th>Churned</th></tr></thead>
              <tbody>{(s.monthly_data||[]).map(m=>`<tr><td>${m.month}</td><td>${rp(m.revenue)}</td><td>+${m.new_merchants}</td><td>${m.churned>0?`-${m.churned}`:'-'}</td></tr>`).join('')}</tbody></table>

              <div class="footer">Laporan ini digenerate otomatis oleh <strong>SentraKas Platform</strong> · {new Date().toLocaleString('id-ID')}</div>
            </div>

            {/* Live preview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Laporan Platform</h2>
                    <p className="text-sm text-white/70 mt-0.5">SentraKas POS · {data.generated_at || new Date().toLocaleString('id-ID')}</p>
                  </div>
                  <button onClick={printReport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold transition-all cursor-pointer backdrop-blur-sm border border-white/20">
                    <span className="material-symbols-outlined text-[18px]">download</span> Download PDF
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Merchant', value: s.merchants?.total||0, sub: `${s.merchants?.active||0} aktif`, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Total Transaksi', value: (s.orders?.total||0).toLocaleString(), sub: `${s.orders?.completed||0} selesai`, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Total Revenue', value: rp(s.orders?.revenue), sub: `MRR ${rp(s.revenue?.mrr)}`, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Rata-rata / Merchant', value: rp(s.revenue?.per_merchant), sub: 'Revenue per merchant', color: 'bg-violet-50 text-violet-600' },
                  ].map((c,i)=>(
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center mb-2`}>
                        <span className="material-symbols-outlined text-[16px]">{['store','receipt','payments','trending_up'][i]}</span>
                      </div>
                      <p className="text-xs text-gray-500">{c.label}</p>
                      <p className="text-lg font-bold text-gray-900">{c.value}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">🏆 Top Merchant</h3>
                    <table className="w-full text-sm"><thead><tr className="text-[10px] text-gray-500 border-b border-gray-100"><th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Merchant</th><th className="text-right py-2 px-2">Orders</th><th className="text-right py-2 px-2">Revenue</th></tr></thead>
                      <tbody>{(s.top_merchants||[]).slice(0,5).map((m,i)=>(
                        <tr key={m.id} className="border-b border-gray-50"><td className="py-2 px-2 text-gray-400">{i+1}</td><td className="py-2 px-2 text-gray-800 font-medium">{m.name}</td><td className="py-2 px-2 text-right text-gray-600">{(m.orders||0).toLocaleString()}</td><td className="py-2 px-2 text-right text-gray-800 font-semibold">{rp(m.total)}</td></tr>
                      ))}</tbody></table>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">📅 Revenue Bulanan</h3>
                    <table className="w-full text-sm"><thead><tr className="text-[10px] text-gray-500 border-b border-gray-100"><th className="text-left py-2 px-2">Bulan</th><th className="text-right py-2 px-2">Revenue</th><th className="text-right py-2 px-2">Baru</th></tr></thead>
                      <tbody>{(s.monthly_data||[]).slice(-6).map(m=>(
                        <tr key={m.month} className="border-b border-gray-50"><td className="py-2 px-2 text-gray-700">{m.month}</td><td className="py-2 px-2 text-right text-gray-800 font-semibold">{rp(m.revenue)}</td><td className="py-2 px-2 text-right text-emerald-600">+{m.new_merchants}</td></tr>
                      ))}</tbody></table>
                  </div>
                </div>

                <div className="text-center text-[10px] text-gray-300 pt-4 border-t border-gray-100">Laporan ini digenerate otomatis oleh SentraKas Platform</div>
              </div>
            </div>
          </>
        ) : <div className="text-center py-24 text-white/30">Memuat data...</div>}
      </div>
      {notif && <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-medium animate-slide-up backdrop-blur-md ${notif.type==='error'?'bg-red-50 text-red-600 border border-red-200':'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>{notif.msg}</div>}
    </div>
  )
}
