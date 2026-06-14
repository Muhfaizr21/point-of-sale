import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { apiClient } from '../../services/apiClient'

const TABS = [
  { id: 'revenue', label: 'Ringkasan Keuangan', icon: 'trending_up' },
  { id: 'orders', label: 'Semua Transaksi', icon: 'receipt_long' },
  { id: 'merchants', label: 'Pendapatan Merchant', icon: 'storefront' },
  { id: 'payments', label: 'Riwayat Pembayaran', icon: 'credit_card' },
  { id: 'health', label: 'Kesehatan Sistem', icon: 'monitor_heart' },
]

const rp = (v) => {
  if (!v && v !== 0) return 'Rp0'
  const s = Math.abs(v)
  if (s >= 1e9) return `Rp${(v / 1e9).toFixed(2)}M`
  if (s >= 1e6) return `Rp${(v / 1e6).toFixed(1)}JT`
  if (s >= 1e3) return `Rp${(v / 1e3).toFixed(0)}RB`
  return `Rp${v.toLocaleString()}`
}

function MiniSparkline({ data, color = '#22c55e' }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ')
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCard({ icon, label, value, sub, trend, color, badge, onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-all text-left w-full disabled:cursor-default">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${color || 'bg-white/5'} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-[20px] text-white/60">{icon}</span>
        </div>
        {badge && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/40">{badge}</span>}
      </div>
      <p className="text-[11px] text-white/40 mt-3">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-xl font-bold text-white/90">{value}</p>
        {trend !== undefined && trend !== null && (
          <span className={`text-[11px] font-semibold mb-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
    </button>
  )
}

function PureBarChart({ data, bars, xKey, height = 200 }) {
  if (!data || data.length === 0) return null
  const maxVal = Math.max(...data.map(d => bars.reduce((s, b) => s + (d[b.key] || 0), 0)), 1)
  const w = 100
  const h = height
  const padL = 0
  const padR = 0
  const padT = 8
  const padB = 20
  const chartW = data.length * 60
  const barW = Math.min(48, (chartW / data.length) * 0.6)
  const colW = chartW / data.length

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(chartW + padL + padR, 300)} height={h} className="w-full">
        {bars.length > 1 && (
          data.map((d, i) => {
            let yOff = 0
            return bars.map((b, bi) => {
              const v = d[b.key] || 0
              const barH = (v / maxVal) * (h - padT - padB)
              const x = padL + i * colW + (colW - barW) / 2
              const y = h - padB - barH - yOff
              const thisYOff = yOff
              yOff += barH
              return (
                <rect key={bi} x={x} y={y} width={barW / bars.length - 2} height={barH} fill={b.color || '#6366f1'} rx="3"
                  transform={`translate(${bi * (barW / bars.length)},0)`} />
              )
            })
          })
        )}
        {bars.length === 1 && data.map((d, i) => {
          const v = d[bars[0].key] || 0
          const barH = (v / maxVal) * (h - padT - padB)
          const x = padL + i * colW + (colW - barW) / 2
          const y = h - padB - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={bars[0].color || '#6366f1'} rx="3" opacity="0.85" />
              <rect x={x} y={y} width={barW} height={Math.min(barH, 4)} fill={bars[0].color || '#6366f1'} rx="3" />
            </g>
          )
        })}
        {data.map((d, i) => (
          <text key={i} x={padL + i * colW + colW / 2} y={h - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">
            {d[xKey]?.slice(5) || d[xKey] || ''}
          </text>
        ))}
      </svg>
    </div>
  )
}

function useDebounce(v, d = 400) {
  const [dv, setDv] = useState(v)
  useEffect(() => { const t = setTimeout(() => setDv(v), d); return () => clearTimeout(t) }, [v, d])
  return dv
}

function useFetch(fn, deps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fn().then(d => { if (active) setData(d) }).catch(e => { if (active) setError(e) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, deps)
  return { data, loading, error }
}

// ======================================================================
// TAB 1: REVENUE DASHBOARD
// ======================================================================
function DonutChart({ data, valueKey, labelKey, colors, size = 140 }) {
  if (!data || data.length === 0) return null
  const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0)
  if (total === 0) return null
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  let acc = -Math.PI / 2
  const defaultColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size}>
        {data.map((d, i) => {
          const val = d[valueKey] || 0
          const angle = (val / total) * Math.PI * 2
          const x1 = cx + r * Math.cos(acc)
          const y1 = cy + r * Math.sin(acc)
          const x2 = cx + r * Math.cos(acc + angle)
          const y2 = cy + r * Math.sin(acc + angle)
          const large = angle > Math.PI ? 1 : 0
          const color = (colors && colors[i % colors.length]) || defaultColors[i % defaultColors.length]
          const dStr = [`M ${cx} ${cy}`, `L ${x1} ${y1}`, `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, 'Z'].join(' ')
          acc += angle
          return <path key={i} d={dStr} fill={color} opacity="0.85" />
        })}
        <circle cx={cx} cy={cy} r={r * 0.6} fill="#0a0a0a" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 11} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">Total</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => {
          const color = (colors && colors[i % colors.length]) || defaultColors[i % defaultColors.length]
          const pct = ((d[valueKey] || 0) / total * 100).toFixed(1)
          return (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
              <span className="text-white/50 min-w-[60px]">{d[labelKey]}</span>
              <span className="text-white/80 font-semibold min-w-[40px] text-right">{pct}%</span>
              <span className="text-white/30">({d[valueKey]})</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HorizontalBar({ data, valueKey, labelKey, color = '#6366f1', max }) {
  if (!data || data.length === 0) return null
  const m = max || Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-white/60 truncate">{d[labelKey]}</span>
            <span className="text-white/80 font-semibold shrink-0 ml-2">{d[valueKey].toLocaleString()}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(d[valueKey] / m) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function RevenueDashboard() {
  const { data, loading } = useFetch(
    () => apiClient.get('/api/superadmin/revenue'),
    []
  )
  if (loading) return <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>
  const s = data?.stats
  const m = data?.monthly || []
  if (!s) return <div className="text-center py-24 text-white/30">Gagal memuat data</div>

  const revTrend = m.length >= 2 ? ((m[m.length - 1].revenue - m[m.length - 2].revenue) / (m[m.length - 2].revenue || 1) * 100).toFixed(0) : null

  return (
    <div className="space-y-5">

      {/* ---- WHAT: Ringkasan angka kunci ---- */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">What</span>
          <h3 className="text-sm font-semibold text-white/80">Apa yang terjadi?</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard icon="store" label="Total Merchant" value={s.total_merchants} color="bg-blue-500/20" />
          <StatCard icon="check_circle" label="Aktif" value={s.active_subscriptions} sub={`${s.trial_subscriptions} trial`} color="bg-emerald-500/20" />
          <StatCard icon="money" label="MRR" value={rp(s.mrr)} color="bg-amber-500/20" />
          <StatCard icon="trending_down" label="Churn Rate" value={`${(s.churn_rate || 0).toFixed(1)}%`} color="bg-red-500/20" />
          <StatCard icon="receipt" label="Orders Bulan Ini" value={(s.total_orders_month || 0).toLocaleString()} trend={Number(revTrend)} color="bg-violet-500/20" />
          <StatCard icon="payments" label="Revenue Bulan Ini" value={rp(s.total_revenue_month)} color="bg-indigo-500/20" />
          <StatCard icon="person_add" label="Merchant Baru" value={s.new_merchants_month} color="bg-cyan-500/20" />
          <StatCard icon="cancel" label="Expired" value={s.expired_subscriptions} color="bg-gray-500/20" />
        </div>
      </div>

      {m.length > 0 && (
        <>
          {/* ---- WHEN: Tren waktu ---- */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">When</span>
              <h3 className="text-sm font-semibold text-white/80">Kapan? — Tren Revenue 12 Bulan</h3>
              <span className="text-xs text-white/30 ml-auto">Total: {rp(m.reduce((a, b) => a + (b.revenue || 0), 0))}</span>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <PureBarChart data={m} bars={[{ key: 'revenue', color: '#6366f1' }]} xKey="month" height={200} />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] text-white/30 border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3">Bulan</th>
                      <th className="text-right py-2 px-3">Revenue</th>
                      <th className="text-right py-2 px-3">Baru</th>
                      <th className="text-right py-2 px-3">Churned</th>
                      <th className="text-center py-2 px-3">Growth</th>
                      <th className="text-right py-2 px-3">Avg/Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.map((row, i) => {
                      const prev = i > 0 ? m[i - 1].revenue : row.revenue
                      const growth = prev > 0 ? ((row.revenue - prev) / prev * 100).toFixed(1) : '0'
                      const avg = row.new_merchants > 0 ? Math.round(row.revenue / (row.new_merchants || 1)) : 0
                      return (
                        <tr key={row.month} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-white/70 font-medium">{row.month}</td>
                          <td className="py-2 px-3 text-right text-white/80 font-semibold">{rp(row.revenue)}</td>
                          <td className="py-2 px-3 text-right text-emerald-400">+{row.new_merchants}</td>
                          <td className="py-2 px-3 text-right text-red-400">{row.churned > 0 ? `-${row.churned}` : '-'}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[10px] font-semibold ${Number(growth) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {Number(growth) >= 0 ? '+' : ''}{growth}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-white/50">{rp(avg)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ---- HOW & WHERE: Metode pembayaran + Hari dalam seminggu ---- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">How</span>
                <h3 className="text-sm font-semibold text-white/80">Metode Pembayaran</h3>
              </div>
              {(s.payment_methods || []).length > 0 ? (
                <HorizontalBar data={s.payment_methods} valueKey="total" labelKey="method" color="#8b5cf6" />
              ) : <p className="text-xs text-white/30">Belum ada data transaksi</p>}
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Where</span>
                <h3 className="text-sm font-semibold text-white/80">Distribusi per Hari</h3>
              </div>
              {(s.weekday_distribution || []).length > 0 ? (
                <PureBarChart data={s.weekday_distribution} bars={[{ key: 'count', color: '#22c55e' }]} xKey="day" height={160} />
              ) : <p className="text-xs text-white/30">Belum ada data</p>}
            </div>
          </div>

          {/* ---- WHO: Top Merchant & Plan Distribution ---- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Who</span>
                <h3 className="text-sm font-semibold text-white/80">Top Merchant (Revenue)</h3>
              </div>
              {(s.top_merchants || []).length > 0 ? (
                <div className="space-y-2">
                  {(s.top_merchants || []).map((merchant, i) => (
                    <div key={merchant.id} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 font-medium truncate">{merchant.name}</p>
                        <p className="text-[10px] text-white/30">{merchant.code} · {merchant.orders} transaksi</p>
                      </div>
                      <span className="text-xs text-white/80 font-semibold">{rp(merchant.total)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-white/30">Belum ada data</p>}
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">What</span>
                <h3 className="text-sm font-semibold text-white/80">Distribusi Plan</h3>
              </div>
              {(s.plan_distribution || []).length > 0 ? (
                <DonutChart data={s.plan_distribution} valueKey="count" labelKey="plan"
                  colors={['#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']} size={160} />
              ) : <p className="text-xs text-white/30">Belum ada data</p>}
            </div>
          </div>

          {/* ---- WHY: Churn & Trial Conversion ---- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Why</span>
                <h3 className="text-sm font-semibold text-white/80">Retensi & Churn</h3>
              </div>
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">{(100 - (s.churn_rate || 0)).toFixed(1)}%</p>
                  <p className="text-[11px] text-white/40 mt-1">Retensi</p>
                </div>
                <div className="w-px h-12 bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-400">{(s.churn_rate || 0).toFixed(1)}%</p>
                  <p className="text-[11px] text-white/40 mt-1">Churn Rate</p>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-red-500 rounded-full transition-all"
                  style={{ width: `${100 - (s.churn_rate || 0)}%` }} />
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Why</span>
                <h3 className="text-sm font-semibold text-white/80">Trial → Bayar</h3>
              </div>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-amber-400">{s.trial_conversion ? `${s.trial_conversion.toFixed(1)}%` : '-'}</p>
                <p className="text-[11px] text-white/40 mt-1">Konversi Trial ke Berbayar</p>
              </div>
              <div className="flex justify-between text-xs text-white/40 mt-3">
                <span>Trial: {s.trial_subscriptions}</span>
                <span>Aktif: {s.active_subscriptions}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${s.total_merchants > 0 ? (s.trial_subscriptions / s.total_merchants) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Why</span>
                <h3 className="text-sm font-semibold text-white/80">Revenue per Merchant</h3>
              </div>
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-white/90">{s.active_subscriptions > 0 ? rp(Math.round(s.mrr / s.active_subscriptions)) : 'Rp0'}</p>
                <p className="text-[11px] text-white/40 mt-1">Rata-rata MRR per Merchant Aktif</p>
              </div>
              <div className="mt-4 space-y-2 text-xs text-white/40">
                <div className="flex justify-between"><span>Total MRR</span><span className="text-white/70 font-semibold">{rp(s.mrr)}</span></div>
                <div className="flex justify-between"><span>Revenue Bulan Ini</span><span className="text-white/70 font-semibold">{rp(s.total_revenue_month)}</span></div>
                <div className="flex justify-between"><span>Orders Bulan Ini</span><span className="text-white/70 font-semibold">{(s.total_orders_month || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Total Merchant</span><span className="text-white/70 font-semibold">{s.total_merchants}</span></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ======================================================================
// TAB 2: ALL ORDERS
// ======================================================================
function AllOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ merchant_id: '', status: '', method: '', date_from: '', date_to: '' })
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetchOrders = useCallback((p, f) => {
    setLoading(true)
    const params = new URLSearchParams({ page: p || page, limit })
    const ft = f || filters
    if (ft.merchant_id) params.set('merchant_id', ft.merchant_id)
    if (ft.status) params.set('status', ft.status)
    if (ft.method) params.set('method', ft.method)
    if (ft.date_from) params.set('date_from', ft.date_from)
    if (ft.date_to) params.set('date_to', ft.date_to)
    apiClient.get(`/api/superadmin/orders?${params}`)
      .then(d => { setOrders(d.data || []); setTotal(d.total || 0); setTotalPages(d.total_pages || 1); setPage(d.page || 1) })
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchOrders(1, filters) }, [])

  const goPage = (p) => { if (p >= 1 && p <= totalPages) fetchOrders(p, filters) }

  const applyFilter = () => fetchOrders(1, filters)
  const resetFilter = () => {
    const empty = { merchant_id: '', status: '', method: '', date_from: '', date_to: '' }
    setFilters(empty); fetchOrders(1, empty)
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] text-white/30 block mb-1">Merchant ID</label>
            <input type="text" value={filters.merchant_id} onChange={e => setFilters(p => ({ ...p, merchant_id: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" placeholder="Kosong = semua" />
          </div>
          <div>
            <label className="text-[10px] text-white/30 block mb-1">Status Pembayaran</label>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50">
              <option value="" className="bg-[#0a0a0a]">Semua</option>
              <option value="COMPLETED" className="bg-[#0a0a0a]">Completed</option>
              <option value="PENDING" className="bg-[#0a0a0a]">Pending</option>
              <option value="FAILED" className="bg-[#0a0a0a]">Failed</option>
              <option value="REFUNDED" className="bg-[#0a0a0a]">Refunded</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/30 block mb-1">Metode Pembayaran</label>
            <select value={filters.method} onChange={e => setFilters(p => ({ ...p, method: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50">
              <option value="" className="bg-[#0a0a0a]">Semua</option>
              <option value="CASH" className="bg-[#0a0a0a]">Tunai</option>
              <option value="TRANSFER" className="bg-[#0a0a0a]">Transfer</option>
              <option value="E_WALLET" className="bg-[#0a0a0a]">E-Wallet</option>
              <option value="CARD" className="bg-[#0a0a0a]">Kartu</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/30 block mb-1">Dari Tanggal</label>
            <input type="date" value={filters.date_from} onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="text-[10px] text-white/30 block mb-1">Sampai Tanggal</label>
            <input type="date" value={filters.date_to} onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={applyFilter}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">search</span> Terapkan Filter
          </button>
          <button onClick={resetFilter}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs transition-all cursor-pointer">Reset</button>
          <span className="text-[11px] text-white/30 ml-auto">{total} transaksi ditemukan</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>
      ) : (
        <>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4">Invoice</th>
                  <th className="text-left py-3 px-4">Cabang</th>
                  <th className="text-left py-3 px-4">Kasir</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Metode</th>
                  <th className="text-right py-3 px-4">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-white/80 font-mono text-[11px] font-semibold">{o.invoice_number}</p>
                      {o.notes && <p className="text-[10px] text-white/20 truncate max-w-[120px]">{o.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-white/60 text-[12px]">{o.branch?.name || '-'}</td>
                    <td className="py-3 px-4 text-white/50 text-[12px]">{o.cashier || '-'}</td>
                    <td className="py-3 px-4 text-right text-white/80 font-semibold">{rp(o.total)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        o.payment_status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        o.payment_status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/40 text-[11px]">{o.payment_method || '-'}</td>
                    <td className="py-3 px-4 text-right text-white/40 text-[11px]">{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-white/20">
                    <span className="material-symbols-outlined text-[40px] block mx-auto mb-2">receipt_long</span>
                    Tidak ada transaksi
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/30">Menampilkan {(page - 1) * limit + 1}-{Math.min(page * limit, total)} dari {total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => goPage(1)} disabled={page <= 1}
                className="px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/80 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[14px]">first_page</span>
              </button>
              <button onClick={() => goPage(page - 1)} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">← Prev</button>
              {(() => {
                const p = []
                const start = Math.max(1, page - 2)
                const end = Math.min(totalPages, page + 2)
                for (let i = start; i <= end; i++) p.push(i)
                return p.map(i => (
                  <button key={i} onClick={() => goPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${i === page ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/10'}`}>{i}</button>
                ))
              })()}
              <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">Next →</button>
              <button onClick={() => goPage(totalPages)} disabled={page >= totalPages}
                className="px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/80 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[14px]">last_page</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ======================================================================
// TAB 3: MERCHANT REVENUE
// ======================================================================
function MerchantRevenueList() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20
  const debouncedSearch = useDebounce(search)

  useEffect(() => {
    setLoading(true)
    apiClient.get(`/api/superadmin/revenue/merchants?page=${page}&limit=${limit}`)
      .then(d => { setData(d.data || []); setTotal(d.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.ceil(total / limit)

  const filtered = useMemo(() => {
    let r = data
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      r = r.filter(m => m.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
    }
    if (statusFilter) r = r.filter(m => m.subscription_status === statusFilter)
    return r
  }, [data, debouncedSearch, statusFilter])

  if (loading) return <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>

  return (
    <div className="space-y-4">
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg flex-1 max-w-xs">
            <span className="material-symbols-outlined text-[16px] text-white/30">search</span>
            <input type="text" placeholder="Cari merchant..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-white/20" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50">
            <option value="" className="bg-[#0a0a0a]">Semua Status</option>
            <option value="active" className="bg-[#0a0a0a]">Active</option>
            <option value="trial" className="bg-[#0a0a0a]">Trial</option>
            <option value="expired" className="bg-[#0a0a0a]">Expired</option>
            <option value="none" className="bg-[#0a0a0a]">No Plan</option>
          </select>
          <span className="text-[11px] text-white/30">{total} merchant</span>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
              <th className="text-left py-3 px-4">Merchant</th>
              <th className="text-left py-3 px-4">Plan</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Fee/Bulan</th>
              <th className="text-right py-3 px-4">Total Order</th>
              <th className="text-right py-3 px-4">Total Revenue</th>
              <th className="text-right py-3 px-4">Pembayaran Terakhir</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.merchant_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400">
                      {m.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-white/80 font-medium text-[12px]">{m.name}</p>
                      <p className="text-[10px] text-white/30">{m.code}{m.email ? ` · ${m.email}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-white/60 text-[12px]">{m.plan_name || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    m.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                    m.subscription_status === 'trial' ? 'bg-amber-500/10 text-amber-400' :
                    m.subscription_status === 'none' ? 'bg-gray-500/10 text-gray-400' : 'bg-red-500/10 text-red-400'}`}>
                    {m.subscription_status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-white/60 text-[12px]">{rp(m.monthly_fee)}</td>
                <td className="py-3 px-4 text-right text-white/70">{(m.total_orders || 0).toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-white/80 font-semibold">{rp(m.total_revenue)}</td>
                <td className="py-3 px-4 text-right text-white/40 text-[11px]">
                  {m.last_payment ? new Date(m.last_payment).toLocaleDateString('id-ID') : '-'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-white/20">
                <span className="material-symbols-outlined text-[40px] block mx-auto mb-2">search_off</span>
                Tidak ada data
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">←</button>
          <span className="text-xs text-white/40">Halaman {page} dari {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">→</button>
        </div>
      )}
    </div>
  )
}

// ======================================================================
// TAB 4: SUBSCRIPTION PAYMENTS
// ======================================================================
function SubscriptionPayments() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '' })
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit })
    if (filters.status) params.set('status', filters.status)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    apiClient.get(`/api/superadmin/subscriptions/payments?${params}`)
      .then(d => { setData(d.data || []); setTotal(d.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, filters])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] text-white/30 block mb-1">Status</label>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50">
              <option value="" className="bg-[#0a0a0a]">Semua</option>
              <option value="paid" className="bg-[#0a0a0a]">Lunas</option>
              <option value="pending" className="bg-[#0a0a0a]">Pending</option>
              <option value="failed" className="bg-[#0a0a0a]">Gagal</option>
              <option value="refunded" className="bg-[#0a0a0a]">Refund</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/30 block mb-1">Dari</label>
            <input type="date" value={filters.date_from} onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="text-[10px] text-white/30 block mb-1">Sampai</label>
            <input type="date" value={filters.date_to} onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setPage(1); setFilters({ status: '', date_from: '', date_to: '' }) }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs transition-all cursor-pointer">Reset</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>
      ) : (
        <>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4">Merchant</th>
                  <th className="text-left py-3 px-4">Plan</th>
                  <th className="text-right py-3 px-4">Jumlah</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Metode</th>
                  <th className="text-right py-3 px-4">Tanggal Bayar</th>
                  <th className="text-left py-3 px-4">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {data.map(p => (
                  <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-white/80 text-[12px] font-medium">{p.merchant?.name || '-'}</p>
                      <p className="text-[10px] text-white/30">{p.merchant?.code || ''}</p>
                    </td>
                    <td className="py-3 px-4 text-white/50 text-[12px]">{p.subscription?.plan?.name || '-'}</td>
                    <td className="py-3 px-4 text-right text-white/80 font-semibold">{rp(p.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/40 text-[11px]">{p.payment_method || '-'}</td>
                    <td className="py-3 px-4 text-right text-white/40 text-[11px]">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {p.invoice_url ? (
                        <a href={p.invoice_url} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-[11px] underline">Lihat</a>
                      ) : <span className="text-white/20 text-[11px]">-</span>}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-white/20">
                    <span className="material-symbols-outlined text-[40px] block mx-auto mb-2">credit_card_off</span>
                    Belum ada pembayaran
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">←</button>
              <span className="text-xs text-white/40">Halaman {page} dari {totalPages} ({total} transaksi)</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer">→</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ======================================================================
// TAB 5: SYSTEM HEALTH
// ======================================================================
function SystemHealth() {
  const { data: health, loading } = useFetch(
    () => apiClient.get('/api/superadmin/health'),
    []
  )
  if (loading) return <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>
  if (!health) return <div className="text-center py-24 text-white/30">Gagal memuat status</div>

  const cards = [
    { icon: 'storage', label: 'Database', value: health.database, status: health.database === 'healthy' ? 'ok' : 'err', sub: `Latensi: ${health.db_latency || '-'}` },
    { icon: 'api', label: 'API Server', value: health.api, status: health.api === 'healthy' ? 'ok' : 'err', sub: 'REST API' },
    { icon: 'inventory_2', label: 'Storage', value: health.storage === 'healthy' ? 'Normal' : health.storage === 'warning' ? 'Perhatian (>1GB)' : 'Error', status: health.storage === 'healthy' ? 'ok' : health.storage === 'warning' ? 'warn' : 'err' },
    { icon: 'store', label: 'Merchant Aktif', value: health.active_merchants, status: 'info', sub: 'toko beroperasi' },
    { icon: 'receipt', label: 'Transaksi Hari Ini', value: health.total_orders_today, status: 'info', sub: 'seluruh merchant' },
  ]

  const statusColor = (st) => st === 'ok' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : st === 'warn' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : st === 'err' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  const statusDot = (st) => st === 'ok' ? 'bg-emerald-400' : st === 'warn' ? 'bg-amber-400' : st === 'err' ? 'bg-red-400' : 'bg-blue-400'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`bg-[#0a0a0a] border ${c.status === 'ok' ? 'border-emerald-500/15' : c.status === 'warn' ? 'border-amber-500/15' : c.status === 'err' ? 'border-red-500/15' : 'border-blue-500/15'} rounded-xl p-5`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${statusColor(c.status)}`}>
                <span className="material-symbols-outlined text-[22px]">{c.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">{c.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${statusDot(c.status)}`} />
                  <span className={`text-xs ${c.status === 'ok' ? 'text-emerald-400' : c.status === 'warn' ? 'text-amber-400' : c.status === 'err' ? 'text-red-400' : 'text-blue-400'}`}>{c.value}</span>
                </div>
              </div>
            </div>
            {c.sub && <p className="text-[11px] text-white/30">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-3">Informasi Sistem</h3>
        <div className="space-y-2 text-xs text-white/40">
          <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
            <span>Database</span>
            <span className="text-white/60">PostgreSQL</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
            <span>Waktu Server</span>
            <span className="text-white/60">{new Date().toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
            <span>Aplikasi</span>
            <span className="text-white/60">SentraKas POS v1.0</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
            <span>Mode</span>
            <span className="text-amber-400 font-semibold">Development</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span>Total Merchant Terdaftar</span>
            <span className="text-white/60">{health.active_merchants || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ======================================================================
// MAIN
// ======================================================================
export function FinancePage() {
  const [tab, setTab] = useState('revenue')

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white/90">Keuangan & Sistem</h1>
            <p className="text-sm text-white/30 mt-1">Pantau metrik platform, transaksi, pendapatan, dan kesehatan</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/30">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 scrollbar-thin">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                tab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'revenue' && <RevenueDashboard />}
        {tab === 'orders' && <AllOrders />}
        {tab === 'merchants' && <MerchantRevenueList />}
        {tab === 'payments' && <SubscriptionPayments />}
        {tab === 'health' && <SystemHealth />}
      </div>
    </div>
  )
}
