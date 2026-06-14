import React, { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { apiClient } from '../../services/apiClient'
import { SuperadminSidebar } from './SuperadminSidebar'
import { AIAnalytics } from './AIAnalytics'
import { MerchantsPage } from './MerchantsPage'
import { BillingPage } from './BillingPage'
import { BroadcastsPage } from './BroadcastsPage'
import { IntegrationsPage } from './IntegrationsPage'
import RevenuePage from './finance/RevenuePage'
import OrdersPage from './finance/OrdersPage'
import MerchantsPageFinance from './finance/MerchantsPage'
import PaymentsPage from './finance/PaymentsPage'
import HealthPage from './finance/HealthPage'
import AuditLogPage from './settings/AuditLogPage'
import PlatformSettingsPage from './settings/PlatformSettingsPage'
import MaintenancePage from './settings/MaintenancePage'
import SupportInboxPage from './settings/SupportInboxPage'
import TicketsPage from './settings/TicketsPage'
import DemographicsPage from './DemographicsPage'
import ExportPage from './ExportPage'

const rp = (v) => {
  if (!v && v !== 0) return '-'
  if (v >= 1e9) return `Rp${(v / 1e9).toFixed(1)}M`
  if (v >= 1e6) return `Rp${(v / 1e6).toFixed(1)}JT`
  if (v >= 1e3) return `Rp${(v / 1e3).toFixed(0)}RB`
  return `Rp${v}`
}
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']
const PIE_PROPS = { cx: '50%', cy: '50%', innerRadius: 55, outerRadius: 90, paddingAngle: 3 }
const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a]/95 border border-white/10 rounded-lg px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-xs text-white/40 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {
            p.name?.toLowerCase().includes('venue') || p.name?.toLowerCase().includes('amount')
              ? rp(Math.abs(p.value)) : p.name?.toLowerCase().includes('growth') || p.name?.toLowerCase().includes('%')
              ? `${Math.abs(p.value).toFixed(1)}%` : typeof p.value === 'number' ? p.value.toLocaleString() : p.value
          }
        </p>
      ))}
    </div>
  )
}
const MiniStat = ({ icon, label, value, sub }) => (
  <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-all group">
    <span className="material-symbols-outlined text-[20px] text-white/25 group-hover:text-white/50 transition-colors mb-2 block">{icon}</span>
    <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
    <p className="text-lg font-black text-white tracking-tight">{value}</p>
    {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
  </div>
)
const Badge = ({ children }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{children}</span>
)
export function SuperadminDashboard({ section = 'overview' }) {
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useEffect(() => {
    (async () => {
      try {
        const [branches, analytics, storeSetting, merchants] = await Promise.all([
          apiClient.get('/api/branches'),
          apiClient.get('/api/analytics').catch(() => null),
          apiClient.get('/api/settings/store_name').catch(() => null),
          apiClient.get('/api/merchants').catch(() => []),
        ])
        const storeName = storeSetting?.value || ''
        setRaw({ branches: branches || [], analytics, storeName, merchants: merchants || [] })
      } catch {} finally { setLoading(false) }
    })()
  }, [])
  const a = raw?.analytics
  const s = a?.summary || {}
  const revenue = s.total_revenue || 0
  const trx = s.total_transactions || 0
  const avg = s.avg_order_value || 0
  const growth = s.revenue_growth || 0
  const best = a?.summary?.best_day || {}
  const dailySales = a?.daily_sales || []
  const categorySales = a?.category_sales || []
  const paymentSales = a?.payment_sales || []
  const topProducts = a?.top_products || []
  const weeklySales = a?.weekly_sales || []
  const branchSales = a?.branch_sales || []
  const branchList = raw?.branches || []
  const merchantList = raw?.merchants || []
  const merchantName = raw?.storeName || 'SentraKas Platform'
  // Merge branch sales with branch list to get city + details
  const branchDetails = useMemo(() => {
    const map = {}
    branchList.forEach(b => { map[b.id] = b })
    return branchSales.map(bs => {
      const detail = branchList.find(b => b.name === bs.branch_name)
      return { ...bs, city: detail?.city || '', code: detail?.code || '' }
    })
  }, [branchSales, branchList])
  const sortedBranches = useMemo(() => [...branchDetails].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)), [branchDetails])
  const topBranch = sortedBranches[0]
  const topRevenue = topBranch?.revenue || 0
  const topTrx = topBranch?.transactions || 0
  const topPct = topBranch?.percent || 0
  const dailyChart = dailySales.map(d => ({ date: d.label || d.date?.slice(5), revenue: (d.revenue || 0) / 1e6 }))
  const categoryChart = categorySales.map(c => ({ name: c.category, value: c.revenue || 0 }))
  const paymentChart = paymentSales.map(p => ({ name: p.method, value: p.revenue || 0 }))
  const productChart = topProducts.slice(0, 8).map(p => ({ name: (p.product_name || '').length > 16 ? p.product_name.slice(0, 14) + '..' : p.product_name, qty: p.quantity || 0 }))
  const weeklyChart = weeklySales.map(w => ({ week: w.week || w.start_date?.slice(5), growth: w.growth || 0 }))
  const branchRevChart = sortedBranches.slice(0, 8).map(b => ({ name: (b.branch_name || '').length > 18 ? b.branch_name.slice(0, 16) + '..' : b.branch_name, revenue: (b.revenue || 0) / 1e6 }))
  const cities = [...new Set(branchList.map(b => b.city).filter(Boolean))]
  const cityData = cities.map(c => ({ name: c, value: branchList.filter(b => b.city === c).length }))
  const maxCity = Math.max(...cityData.map(x => x.value), 1)
  const totalItems = topProducts.reduce((a, p) => a + (p.quantity || 0), 0)
  const formatFull = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
  if (loading) return (
    <div className="flex h-screen w-full bg-[#030303]">
      <SuperadminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-[48px] text-white/20">sync</span></main>
    </div>
  )
  return (
    <div className="flex h-screen w-full bg-[#030303] text-white font-sans antialiased">
      <SuperadminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* HEADER */}
        <header className="h-[64px] flex items-center justify-between px-4 lg:px-8 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">Platform Overview</h1>
            <span className="hidden sm:inline-block h-4 w-px bg-white/10" />
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-white/30">
              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400/80 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" /> Online
          </span>
        </header>
        {/* BODY */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar">
          {section === 'analytics' ? (
            <AIAnalytics />
          ) : section === 'tenants' ? (
            <MerchantsPage />
          ) : section === 'billing' ? (
            <BillingPage />
          ) : section === 'broadcasts' ? (
            <BroadcastsPage />
          ) : section === 'integrations' ? (
            <IntegrationsPage />
          ) : section === 'finance-revenue' ? (
            <RevenuePage />
          ) : section === 'finance-orders' ? (
            <OrdersPage />
          ) : section === 'finance-merchants' ? (
            <MerchantsPageFinance />
          ) : section === 'finance-payments' ? (
            <PaymentsPage />
          ) : section === 'finance-health' ? (
            <HealthPage />
          ) : section === 'audit-log' ? (
            <AuditLogPage />
          ) : section === 'platform-settings' ? (
            <PlatformSettingsPage />
          ) : section === 'maintenance' ? (
            <MaintenancePage />
          ) : section === 'support-inbox' ? (
            <SupportInboxPage />
          ) : section === 'tickets' ? (
            <TicketsPage />
          ) : section === 'demographics' ? (
            <DemographicsPage />
          ) : (
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* R1: 6 KPI (WHAT) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <MiniStat icon="payments" label="Total Revenue" value={rp(revenue)} sub={`${trx.toLocaleString()} transaksi`} />
              <MiniStat icon="receipt_long" label="Avg Order" value={rp(avg)} sub="per transaksi" />
              <MiniStat icon="storefront" label="Merchants" value={merchantList.length} sub={`${branchList.length} total toko`} />
              <MiniStat icon="trending_up" label="Growth" value={`${(growth || 0).toFixed(1)}%`} sub={growth >= 0 ? 'naik' : 'turun'} />
              <MiniStat icon="star" label="Best Day" value={rp(best.revenue)} sub={best.label || '-'} />
              <MiniStat icon="inventory_2" label="Items Sold" value={totalItems.toLocaleString()} sub="total semua cabang" />
            </div>
            {/* R3: REVENUE TREND + BRANCH RANKING (WHEN + WHO) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Revenue Trend
                  </h3>
                  <span className="text-xs text-white/25">7 days</span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChart}>
                      <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                      <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `Rp${v}JT`} />
                      <Tooltip content={<CTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white/70 mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Store Revenue Ranking
                </h3>
                <div className="space-y-1">
                  {sortedBranches.slice(0, 6).map((b, i) => (
                    <div key={b.branch_name + b.code} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-emerald-500/20 text-emerald-400' : i === 1 ? 'bg-white/5 text-white/50' : i === 2 ? 'bg-amber-500/10 text-amber-400/70' : 'bg-white/[0.03] text-white/30'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{b.branch_name}</p>
                        <p className="text-[10px] text-white/30 truncate">{merchantName} · {b.code || b.city || 'store'}</p>
                      </div>
                      <span className="text-sm font-semibold text-white/90 shrink-0">{rp(b.revenue)}</span>
                    </div>
                  ))}
                  {sortedBranches.length === 0 && <p className="text-xs text-white/20 text-center py-6">No store data</p>}
                </div>
              </div>
            </div>
            {/* R4: CATEGORY + PAYMENTS + WEEKLY (WHY + HOW) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white/70 mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Category Revenue</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => rp(v)} />
                      <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} width={80} />
                      <Tooltip content={<CTooltip />} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white/70 mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500" /> Payment Methods</h3>
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentChart} {...PIE_PROPS} dataKey="value">
                        {paymentChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {paymentChart.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-white/40 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white/70 mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" /> Weekly Growth %</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="week" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                      <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                      <Tooltip content={<CTooltip />} />
                      <Bar dataKey="growth" fill="#ec4899" radius={[4, 4, 0, 0]} name="Growth %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {/* R5: TOP PRODUCTS + CITY MAP (WHO) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white/70 mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Top Products by Volume</h3>
                <div className="space-y-2">
                  {productChart.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-white/30 shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm text-white/60 truncate">{p.name}</span>
                      <span className="text-sm font-semibold text-white/80">{p.qty.toLocaleString()}</span>
                      <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${Math.min((p.qty / Math.max(...productChart.map(x => x.qty), 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  {productChart.length === 0 && <p className="text-xs text-white/20 text-center py-8">No data</p>}
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white/70 mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Store Distribution by City</h3>
                {cityData.length > 0 ? (
                  <div className="space-y-4">
                    {cityData.map((c, i) => (
                      <div key={c.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/60">{c.name}</span>
                          <span className="text-white/80 font-semibold">{c.value} toko{c.value > 1 ? '' : ''}</span>
                        </div>
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(c.value / maxCity) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-white/20 text-center py-8">No store data</p>}
              </div>
            </div>
            {/* R6: ALL STORES TABLE */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/20" /> All Stores / Tenants</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/25 text-[11px] uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left py-3 font-semibold w-10">#</th>
                      <th className="text-left py-3 font-semibold">Store</th>
                      <th className="text-left py-3 font-semibold hidden md:table-cell">City</th>
                      <th className="text-right py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchList.map((b, i) => (
                      <tr key={b.id} className={`border-b border-white/[0.04] text-white/60 hover:bg-white/[0.02] transition-colors ${i === branchList.length - 1 ? 'border-0' : ''}`}>
                        <td className="py-3 text-xs text-white/25 font-mono">{i + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {b.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white/80">{b.name}</p>
                              <p className="text-[10px] text-white/30 font-mono">{b.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-white/40 hidden md:table-cell">{b.city || '-'}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            <span className={`w-1 h-1 rounded-full ${b.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {b.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {branchList.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-white/20 text-xs">No stores registered</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            {/* FOOTER */}
            <div className="text-center text-[11px] text-white/[0.08] py-6 border-t border-white/[0.04]">
              SentraKas Platform &copy; {new Date().getFullYear()} &middot; Multi-Store Omnichannel POS &middot; All metrics in IDR
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
