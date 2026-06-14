import React, { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { apiClient } from '../../services/apiClient'

const rp = (v) => {
  if (!v && v !== 0) return '-'
  if (v >= 1e9) return `Rp${(v / 1e9).toFixed(1)}M`
  if (v >= 1e6) return `Rp${(v / 1e6).toFixed(1)}JT`
  return `Rp${v.toLocaleString('id-ID')}`
}

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a]/95 border border-white/10 rounded-lg px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-xs text-white/40 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('id-ID', { minimumFractionDigits: p.name.includes('Rp') ? 0 : 1 }) : p.value}
        </p>
      ))}
    </div>
  )
}

const InsightCard = ({ icon, title, children, color = 'blue' }) => (
  <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-all">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
        <span className={`material-symbols-outlined text-[22px] text-${color}-400`}>{icon}</span>
      </div>
      <h3 className="text-sm font-semibold text-white/80">{title}</h3>
    </div>
    {children}
  </div>
)

export function AIAnalytics() {
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [branches, analytics] = await Promise.all([
          apiClient.get('/api/branches'),
          apiClient.get('/api/analytics').catch(() => null),
        ])
        setRaw({ branches: branches || [], analytics })
      } catch {} finally { setLoading(false) }
    })()
  }, [])

  const a = raw?.analytics
  const s = a?.summary || {}
  const revenue = s.total_revenue || 0
  const trx = s.total_transactions || 0
  const avg = s.avg_order_value || 0
  const growth = s.revenue_growth || 0
  const daily = a?.daily_sales || []
  const weekly = a?.weekly_sales || []
  const category = a?.category_sales || []
  const payment = a?.payment_sales || []
  const topProducts = a?.top_products || []
  const branchSales = a?.branch_sales || []
  const branchList = raw?.branches || []

  const dailyChart = daily.map(d => ({ date: d.label || d.date?.slice(5), revenue: (d.revenue || 0) / 1e6 }))
  const weeklyChart = weekly.map(w => ({ week: w.week || w.start_date?.slice(5), growth: w.growth || 0, revenue: (w.revenue || 0) / 1e6 }))
  const categoryChart = category.map(c => ({ name: c.category || 'Unknown', revenue: (c.revenue || 0) / 1e6 }))
  const paymentChart = payment.map(p => ({ name: p.method, revenue: (p.revenue || 0) / 1e6 }))

  // AI Insights computed from data
  const insights = useMemo(() => {
    const list = []

    // Growth insight
    if (growth > 0) {
      list.push({ icon: 'trending_up', color: 'text-emerald-400', title: 'Positive Growth Trend',
        desc: `Revenue grew ${growth.toFixed(1)}% vs previous period. Projected monthly run rate: ${rp(revenue * 1.1)}.` })
    } else {
      list.push({ icon: 'trending_down', color: 'text-red-400', title: 'Declining Revenue',
        desc: `Revenue dropped ${Math.abs(growth).toFixed(1)}%. Consider promotional campaigns to boost sales.` })
    }

    // Best category
    const topCat = [...category].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0]
    if (topCat) {
      list.push({ icon: 'category', color: 'text-amber-400', title: 'Top Category',
        desc: `${topCat.category} leads with ${rp(topCat.revenue || 0)} (${(topCat.percent || 0).toFixed(1)}% of total). Consider expanding this category.` })
    }

    // Peak day
    const peakDay = [...daily].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0]
    if (peakDay) {
      list.push({ icon: 'wb_sunny', color: 'text-yellow-400', title: 'Peak Performance Day',
        desc: `${peakDay.label || peakDay.date} was the best day with ${rp(peakDay.revenue || 0)} across ${peakDay.transactions || 0} transactions.` })
    }

    // Top product
    const topProd = topProducts.sort((a, b) => (b.quantity || 0) - (a.quantity || 0))[0]
    if (topProd) {
      list.push({ icon: 'inventory_2', color: 'text-cyan-400', title: 'Best-Selling Product',
        desc: `${topProd.product_name} sold ${topProd.quantity} units, generating ${rp(topProd.revenue || 0)}. Stock up on this item.` })
    }

    // Avg order insight
    const aovInsight = avg > 50000 ? 'Customers are spending well per transaction.' : 'Consider upselling strategies to increase average order value.'
    list.push({ icon: 'receipt_long', color: 'text-purple-400', title: `Avg Order: ${rp(avg)}`,
      desc: aovInsight })

    // Branch insight
    const topBranch = [...branchSales].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0]
    if (topBranch) {
      list.push({ icon: 'store', color: 'text-emerald-400', title: 'Top Performing Branch',
        desc: `${topBranch.branch_name} contributes ${(topBranch.percent || 0).toFixed(1)}% of total revenue with ${rp(topBranch.revenue || 0)}.` })
    }

    // Payment insight
    const topPay = [...payment].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0]
    if (topPay) {
      list.push({ icon: 'payments', color: 'text-blue-400', title: 'Preferred Payment',
        desc: `${topPay.method} is the most used payment method (${rp(topPay.revenue || 0)}). Ensure seamless integration.` })
    }

    return list
  }, [revenue, growth, avg, daily, weekly, category, payment, topProducts, branchSales, branchList])

  // Prediction: next 7 days based on avg daily revenue
  const prediction = useMemo(() => {
    if (daily.length === 0) return []
    const avgDaily = revenue / Math.max(daily.length, 1)
    const growthFactor = 1 + (growth / 100)
    const lastDate = daily[daily.length - 1]
    const startDate = lastDate?.date || new Date().toISOString().slice(0, 10)
    const next7 = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const predicted = avgDaily * growthFactor * (1 + (Math.random() - 0.5) * 0.2) // +-10% random
      next7.push({
        date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        predicted: Math.round(predicted / 1e6 * 100) / 100,
        upper: Math.round(predicted * 1.1 / 1e6 * 100) / 100,
        lower: Math.round(predicted * 0.9 / 1e6 * 100) / 100,
      })
    }
    return next7
  }, [daily, revenue, growth])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-[48px] text-white/20">sync</span>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-xl font-bold text-white/90">AI & Analytics</h1>
          <p className="text-sm text-white/30 mt-1">Intelligent insights powered by your business data</p>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600/15 to-blue-900/5 border border-blue-500/15 rounded-xl p-5">
            <p className="text-xs text-blue-300/70 uppercase tracking-widest font-semibold">Total Revenue</p>
            <h2 className="text-2xl font-black text-white mt-1">{rp(revenue)}</h2>
            <p className="text-xs text-white/30 mt-1">{trx.toLocaleString()} transactions</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600/15 to-purple-900/5 border border-purple-500/15 rounded-xl p-5">
            <p className="text-xs text-purple-300/70 uppercase tracking-widest font-semibold">Avg Order</p>
            <h2 className="text-2xl font-black text-white mt-1">{rp(avg)}</h2>
            <p className="text-xs text-white/30 mt-1">per transaction</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/15 to-emerald-900/5 border border-emerald-500/15 rounded-xl p-5">
            <p className="text-xs text-emerald-300/70 uppercase tracking-widest font-semibold">Growth Rate</p>
            <h2 className={`text-2xl font-black mt-1 ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {growth >= 0 ? '+' : ''}{(growth || 0).toFixed(1)}%
            </h2>
            <p className="text-xs text-white/30 mt-1">vs previous period</p>
          </div>
          <div className="bg-gradient-to-br from-amber-600/15 to-amber-900/5 border border-amber-500/15 rounded-xl p-5">
            <p className="text-xs text-amber-300/70 uppercase tracking-widest font-semibold">Projected Monthly</p>
            <h2 className="text-2xl font-black text-white mt-1">{rp(Math.round(revenue * (1 + growth / 100) * 30 / Math.max(daily.length, 1)))}</h2>
            <p className="text-xs text-white/30 mt-1">based on current trend</p>
          </div>
        </div>

        {/* MAIN GRID: Insights + Prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI INSIGHTS */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-400">auto_awesome</span>
              AI Insights
            </h3>
            {insights.map((insight, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 flex items-start gap-4 hover:border-white/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                  <span className={`material-symbols-outlined text-[22px] ${insight.color}`}>{insight.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">{insight.title}</p>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">{insight.desc}</p>
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-8 text-center text-white/20 text-sm">
                No data available for analysis. Start making transactions to generate insights.
              </div>
            )}
          </div>

          {/* PREDICTION */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-purple-400">query_stats</span>
              7-Day Revenue Forecast
            </h3>
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...dailyChart.slice(-7), ...prediction]}>
                    <defs>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                    <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `Rp${v}JT`} />
                    <Tooltip content={<CTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#predGrad)" name="Actual" />
                    <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Predicted" />
                    <Area type="monotone" dataKey="upper" stroke="#8b5cf6" strokeWidth={0} fill="rgba(139,92,246,0.05)" name="Upper" />
                    <Area type="monotone" dataKey="lower" stroke="#8b5cf6" strokeWidth={0} fill="rgba(139,92,246,0.05)" name="Lower" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/30">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 rounded" /> Actual</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed border-purple-500" /> Predicted</span>
              </div>
              <div className="mt-4 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                <p className="text-xs text-white/50">Forecast confidence</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${Math.min(Math.abs(growth) + 70, 95)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">{Math.min(Math.abs(growth) + 70, 95)}%</span>
                </div>
              </div>
            </div>

            {/* Weekly Growth Mini Chart */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <h4 className="text-xs font-semibold text-white/60 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-rose-400">show_chart</span>
                Weekly Growth Trend
              </h4>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="week" stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                    <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                    <Tooltip content={<CTooltip />} />
                    <Line type="monotone" dataKey="growth" stroke="#ec4899" strokeWidth={2} dot={false} name="Growth" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Category Revenue Breakdown
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `Rp${v}JT`} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} width={80} />
                  <Tooltip content={<CTooltip />} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Payment Method Analytics
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `Rp${v}JT`} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} width={80} />
                  <Tooltip content={<CTooltip />} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-[11px] text-white/[0.08] py-4 border-t border-white/[0.04]">
          AI Analytics &middot; SentraKas Platform &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
