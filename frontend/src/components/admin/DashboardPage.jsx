import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '../common/Button'
import { TopBar } from '../common/TopBar'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { orderService } from '../../services/orderService'
import { targetService } from '../../services/targetService'

// ============================================
// CUSTOM COMPONENTS
// ============================================

// Custom tooltip
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-outline-variant rounded-lg p-md shadow-xl z-50">
        <p className="text-label-sm text-on-surface-variant mb-xs font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-body-sm font-medium" style={{ color: entry.color || entry.fill }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value?.toLocaleString('id-ID')}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Format helpers
const formatPrice = (value) => {
  if (!value) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp')
}

const formatFullPrice = (value) => {
  if (!value) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp')
}

const formatNumberWithDots = (num) => {
  if (num === undefined || num === null || isNaN(num)) return ''
  return new Intl.NumberFormat('id-ID').format(num)
}

const formatNumber = (value) => {
  if (!value) return '0'
  return value.toLocaleString('id-ID')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

// Color palette
const COLORS = {
  primary: '#af101a',
  secondary: '#5f5e5e',
  tertiary: '#565858',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#ba1a1a',
  chart: ['#af101a', '#5f5e5e', '#565858', '#ba1a20', '#8f6f6c', '#d32f2f'],
}

// Get local date string in YYYY-MM-DD format (timezone-safe)
const getLocalDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get date range
const getDateRange = (period) => {
  const today = new Date()
  const todayStr = getLocalDateString(today)
  let dateFrom = new Date()

  switch (period) {
    case 'today': dateFrom = today; break
    case 'week': dateFrom.setDate(dateFrom.getDate() - 7); break
    case 'month': dateFrom.setDate(dateFrom.getDate() - 30); break
    case 'year': dateFrom.setFullYear(dateFrom.getFullYear() - 1); break
    default: dateFrom.setDate(dateFrom.getDate() - 7)
  }
  return { dateFrom: getLocalDateString(dateFrom), dateTo: todayStr }
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export function DashboardPage({ onToggleSidebar, activeBranch = null }) {
  // State
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('week')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [undeliveredOrders, setUndeliveredOrders] = useState([])
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const [currentTarget, setCurrentTarget] = useState({ revenue_target: 1000000, transaction_target: 10 })
  const [allTargets, setAllTargets] = useState([])
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [targetForm, setTargetForm] = useState({ date: getLocalDateString(), revenue_target: 1000000, transaction_target: 10 })

  const fetchTargets = useCallback(async () => {
    try {
      const todayStr = getLocalDateString()
      const current = await targetService.getByDate(todayStr, activeBranch)
      if (current) {
        setCurrentTarget(current)
      }
      const all = await targetService.getAll(activeBranch)
      if (all) {
        setAllTargets(all)
      }
    } catch (error) {
      console.error('Error fetching targets:', error)
    }
  }, [])

  // Fetch live data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { dateFrom, dateTo } = getDateRange(dateRange)
      const data = await orderService.getAnalytics({ dateFrom, dateTo, branchId: activeBranch })
      if (data) {
        setAnalyticsData(data)
      }
      const ordersData = await orderService.getOrders({ limit: 5, sortBy: 'created_at', sortOrder: 'desc', branchId: activeBranch })
      if (ordersData && ordersData.data) {
        setRecentOrders(ordersData.data)
      }
      
      // Fetch undelivered orders
      const allOrders = await orderService.getOrders({ limit: 100, sortBy: 'created_at', sortOrder: 'desc', branchId: activeBranch })
      if (allOrders && allOrders.data) {
        const undelivered = allOrders.data.filter(
          order => order.order_status === 'COMPLETED' || order.order_status === 'DIKEMAS'
        )
        setUndeliveredOrders(undelivered)
      }

      await fetchTargets()
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange, fetchTargets, activeBranch])

  useEffect(() => {
    fetchData()
    window.addEventListener('checkout-success', fetchData)
    const interval = setInterval(fetchData, 30000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('checkout-success', fetchData)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchData])

  const handleMarkAsShipped = useCallback(async (orderId) => {
    try {
      await orderService.updateOrder(orderId, { order_status: 'DIKIRIM' })
      await fetchData()
    } catch (error) {
      alert(`Gagal mengirim pesanan: ${error.message}`)
    }
  }, [fetchData])

  // Generate comprehensive dashboard data from API
  const dashboardData = useMemo(() => {
    if (!analyticsData) return null;

    const summary = analyticsData.summary || {};

    const whatMetrics = {
      totalRevenue: summary.total_revenue || 0,
      totalTransactions: summary.total_transactions || 0,
      avgOrderValue: summary.avg_order_value || 0,
      growthRate: (summary.revenue_growth || 0).toFixed(1),
    }

    // Where (Channels) -> using Category Sales for BarChart
    const whereChannels = (analyticsData.category_sales || []).map((cat, index) => ({
      channel: cat.category,
      revenue: cat.revenue,
      percent: cat.percent
    }))

    // When (Daily)
    const whenDaily = (analyticsData.daily_sales || []).map(day => {
      const specificTarget = allTargets.find(t => t.date === day.date)
      return {
        date: day.date,
        label: day.label,
        revenue: day.revenue,
        transactions: day.transactions,
        target: specificTarget ? specificTarget.revenue_target : (currentTarget?.revenue_target || 1000000)
      }
    })

    // Why Products
    const whyProducts = (analyticsData.top_products || []).map(p => ({
      name: p.product_name,
      category: p.category,
      sold: p.quantity,
      revenue: p.revenue,
      growth: 0
    }))

    // Why Categories — kontribusi per kategori thd total revenue
    const whyCategories = (analyticsData.category_sales || []).map((cat, index) => ({
      name: cat.category,
      revenue: cat.revenue,
      percent: Math.round(cat.percent),
      color: COLORS.chart[index % COLORS.chart.length]
    }))

    // Payment Methods
    const paymentMethods = (analyticsData.payment_sales || []).map((p, index) => ({
      name: p.method,
      value: Math.round(p.percent),
      revenue: p.revenue,
      color: COLORS.chart[index % COLORS.chart.length]
    }))

    // How Cashiers (Cashier Performance)
    const howCashiers = (analyticsData.cashier_sales || []).map((c, index) => ({
      name: c.cashier_name,
      value: Math.round(c.percent),
      revenue: c.revenue,
      transactions: c.transactions,
      color: COLORS.chart[index % COLORS.chart.length]
    }))

    // Recent Transactions
    const recentTransactions = recentOrders.map(order => {
      let itemsCount = 0;
      if (order.items) {
         itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
      }
      return {
         id: order.id,
         time: formatTime(order.created_at),
         items: itemsCount,
         total: order.total,
         method: order.payment_method,
         status: order.payment_status,
         branch: order.branch
      }
    })

    const peakHours = {
      busiest: { time: '-', revenue: 0, transactions: 0 },
      average: { revenue: 0, transactions: 0 }
    }
    
    if (summary.best_day && summary.best_day.label) {
      peakHours.busiest = {
        time: summary.best_day.label,
        revenue: summary.best_day.revenue,
        transactions: summary.best_day.transactions
      }
    }
    
    // Average daily based on daily_sales
    if (analyticsData.daily_sales && analyticsData.daily_sales.length > 0) {
        peakHours.average = {
            revenue: Math.round(summary.total_revenue / analyticsData.daily_sales.length),
            transactions: Math.round(summary.total_transactions / analyticsData.daily_sales.length)
        }
    }

    const targets = {
      daily: { 
        revenue: currentTarget?.revenue_target || 1000000, 
        transactions: currentTarget?.transaction_target || 10 
      },
    }

    return {
      whatMetrics,
      whereChannels,
      whenDaily,
      whyProducts,
      whyCategories,
      peakHours,
      recentTransactions,
      targets,
      paymentMethods,
      howCashiers,
    }
  }, [analyticsData, recentOrders, currentTarget, allTargets])

// Calculate achievement percentages
  const getAchievementPercent = (current, target) => {
    if (!target) return 0
    return Math.min(Math.round((current / target) * 100), 150)
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-container-low">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined animate-spin text-primary text-display-sm">refresh</span>
          <p className="text-body-lg text-on-surface-variant">Memuat data analitik...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-container-low">
        <p className="text-body-lg text-on-surface-variant">Tidak ada data untuk periode ini.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      {/* Top Header */}
      <TopBar
        title="Dashboard Kasir"
        subtitle={`Update terakhir: ${formatTime(lastUpdate.toISOString())}`}
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md font-medium text-on-surface cursor-pointer"
            >
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari</option>
              <option value="month">30 Hari</option>
              <option value="year">Tahun Ini</option>
            </select>
            <Button
              variant="outline"
              onClick={fetchData}
              className="py-2 px-3"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Refresh
            </Button>
          </>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">

        {/* ============================================ */}
        {/* WHAT - Key Metrics (What is happening?) */}
        {/* ============================================ */}
        <div className="mb-lg">
          <h3 className="text-body-lg font-semibold text-on-surface mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">insights</span>
            Metrik Utama Penjualan
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
            {/* Total Revenue */}
            <div className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full"></div>
              <div className="flex items-center gap-sm mb-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px] filled-icon">payments</span>
                </div>
                <span className="text-label-xs text-on-surface-variant">Total Pendapatan</span>
              </div>
              <p className="text-title-lg text-primary font-bold">
                {formatPrice(dashboardData.whatMetrics.totalRevenue)}
              </p>
              <div className="flex items-center gap-xs mt-xs">
                <span className="material-symbols-outlined text-green-600 text-[14px]">trending_up</span>
                <span className="text-label-xs text-green-600 font-medium">+{dashboardData.whatMetrics.growthRate}%</span>
              </div>
            </div>

            {/* Total Transactions */}
            <div className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-surface-tint/5 rounded-bl-full"></div>
              <div className="flex items-center gap-sm mb-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-tint/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-surface-tint text-[18px] filled-icon">point_of_sale</span>
                </div>
                <span className="text-label-xs text-on-surface-variant">Transaksi</span>
              </div>
              <p className="text-title-lg text-surface-tint font-bold">
                {formatNumber(dashboardData.whatMetrics.totalTransactions)}
              </p>
              <div className="flex items-center gap-xs mt-xs">
                <span className="text-label-xs text-on-surface-variant">total transaksi</span>
              </div>
            </div>

            {/* Average Order */}
            <div className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
              <div className="flex items-center gap-sm mb-sm">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-[18px] filled-icon">shopping_bag</span>
                </div>
                <span className="text-label-xs text-on-surface-variant">Rata-rata Order</span>
              </div>
              <p className="text-title-lg text-secondary font-bold">
                {formatPrice(dashboardData.whatMetrics.avgOrderValue)}
              </p>
              <div className="flex items-center gap-xs mt-xs">
                <span className="text-label-xs text-on-surface-variant">per transaksi</span>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
              <div className="flex items-center gap-sm mb-sm">
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-[18px] filled-icon">trending_up</span>
                </div>
                <span className="text-label-xs text-on-surface-variant">Growth</span>
              </div>
              <p className="text-title-lg text-tertiary font-bold">
                {dashboardData.whatMetrics.growthRate >= 0 ? "+" : ""}{dashboardData.whatMetrics.growthRate}%
              </p>
              <div className="flex items-center gap-xs mt-xs">
                <span className="text-label-xs text-on-surface-variant">vs periode lalu</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* WHO & WHERE - Customer & Channel Analysis */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 gap-md mb-lg">
          {/* WHERE - Sales Channels */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">store</span>
                Saluran Penjualan
              </h3>
              <p className="text-label-sm text-on-surface-variant">Dimana penjualan terjadi?</p>
            </div>
            <div className="p-md" style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.whereChannels} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatPrice(v)}
                    tick={{ fontSize: 11, fill: '#5b403d' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="channel"
                    tick={{ fontSize: 12, fill: '#5b403d' }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                  <Bar dataKey="revenue" fill={COLORS.primary} radius={[0, 4, 4, 0]}>
                    {dashboardData.whereChannels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* WHEN - Time Analysis */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-lg">
          {/* Peak Hours Analysis */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">local_fire_department</span>
                Analisis Jam Sibuk
              </h3>
              <p className="text-label-sm text-on-surface-variant">Waktu puncak & rendah</p>
            </div>
            <div className="p-md space-y-md">
              {/* Busiest */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-error filled-icon">whatshot</span>
                    <div>
                      <p className="text-label-xs text-error font-medium">Jam Tersibuk</p>
                      <p className="text-body-lg font-bold text-error">{dashboardData.peakHours.busiest.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-label-xs text-on-surface-variant">Pendapatan</p>
                    <p className="text-body-md font-bold text-error">{formatPrice(dashboardData.peakHours.busiest.revenue)}</p>
                  </div>
                </div>
              </div>
              {/* Average */}
              <div className="bg-surface-container-high border border-outline-variant rounded-lg p-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-on-surface-variant">analytics</span>
                    <div>
                      <p className="text-label-xs text-on-surface-variant font-medium">Rata-rata</p>
                      <p className="text-body-lg font-bold text-on-surface">Rata-rata Per Hari</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-label-xs text-on-surface-variant">Pendapatan</p>
                    <p className="text-body-md font-bold text-on-surface">{formatPrice(dashboardData.peakHours.average.revenue)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">payment</span>
                Metode Pembayaran
              </h3>
              <p className="text-label-sm text-on-surface-variant">Cara pelanggan membayar</p>
            </div>
            <div className="p-md space-y-sm">
              {dashboardData.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center gap-md">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${method.color}20` }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: method.color }}>
                      {method.name.includes('Tunai') ? 'payments' : method.name.includes('Kartu') ? 'credit_card' : 'qr_code'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-xs">
                      <span className="text-body-sm font-medium text-on-surface">{method.name}</span>
                      <span className="text-body-sm font-bold text-on-surface">{method.value}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${method.value}%`, backgroundColor: method.color }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* HOW - Performa Kasir */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-lg">
          {/* Performa Kasir */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                Performa Kasir
              </h3>
              <p className="text-label-sm text-on-surface-variant">Bagaimana kinerja tim memproses order?</p>
            </div>
            <div className="p-md space-y-sm">
              {dashboardData.howCashiers.map((cashier, index) => (
                <div key={index} className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-xs">
                      <div>
                        <span className="text-body-sm font-semibold text-on-surface">{cashier.name}</span>
                        <span className="text-label-xs text-on-surface-variant ml-sm">{formatNumber(cashier.transactions)} trx</span>
                      </div>
                      <div className="text-right">
                        <span className="text-body-sm font-bold text-on-surface">{formatPrice(cashier.revenue)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${cashier.value}%`, backgroundColor: cashier.color }}
                        ></div>
                      </div>
                      <span className="text-label-xs font-bold text-on-surface-variant w-8 text-right">{cashier.value}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {dashboardData.howCashiers.length === 0 && (
                <p className="text-body-sm text-center text-on-surface-variant py-sm">Belum ada data kasir</p>
              )}
            </div>
          </div>
          
          {/* Pesanan Belum Diantar */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
                Pesanan Belum Diantar
                {undeliveredOrders.length > 0 && (
                  <span className="ml-xs bg-error text-on-error text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                    {undeliveredOrders.length}
                  </span>
                )}
              </h3>
              <p className="text-label-sm text-on-surface-variant">Daftar pesanan baru atau dikemas yang belum dikirim</p>
            </div>
            <div className="p-md space-y-sm max-h-[320px] overflow-y-auto hide-scrollbar flex-1">
              {undeliveredOrders.map((order) => {
                let itemsCount = 0;
                if (order.items) {
                   itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
                }
                return (
                  <div key={order.id} className="flex items-center justify-between gap-md p-2 hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-sm">
                        <span className="text-body-sm font-bold text-primary truncate">{order.invoice_number}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                          order.order_status === 'DIKEMAS' 
                            ? 'bg-secondary-container text-on-secondary-container' 
                            : 'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {order.order_status === 'COMPLETED' ? 'POS' : order.order_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-label-xs text-on-surface-variant mt-1 flex-wrap">
                        <span className="truncate max-w-[120px]" title={order.customer || 'Umum'}>{order.customer || 'Umum'} ({itemsCount} item)</span>
                        {!activeBranch && order.branch && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 text-primary rounded text-[9px] font-semibold whitespace-nowrap">
                            <span className="material-symbols-outlined text-[9px]">store</span>
                            {order.branch.name}
                          </span>
                        )}
                        <span>{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm shrink-0">
                      <span className="text-body-sm font-semibold text-on-surface font-data-mono">
                        {formatPrice(order.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMarkAsShipped(order.id)}
                        className="p-1 text-primary hover:bg-primary/10 rounded-full cursor-pointer flex items-center justify-center transition-colors outline-none"
                        title="Kirim Pesanan"
                      >
                        <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                      </button>
                    </div>
                  </div>
                )
              })}
              {undeliveredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-lg text-center h-full min-h-[180px]">
                  <span className="material-symbols-outlined text-[36px] text-green-500 mb-xs filled-icon">check_circle</span>
                  <p className="text-body-sm font-semibold text-on-surface">Semua Terkirim</p>
                  <p className="text-label-xs text-on-surface-variant">Tidak ada pesanan yang tertunda</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* WHY - Product Performance */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-lg">
          {/* Top Products */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                Produk Terlaris
              </h3>
              <p className="text-label-sm text-on-surface-variant">Mengapa penjualan terjadi?</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant text-label-xs text-on-surface-variant">
                    <th className="p-sm font-semibold">Produk</th>
                    <th className="p-sm font-semibold text-right">Terjual</th>
                    <th className="p-sm font-semibold text-right">Pendapatan</th>
                    <th className="p-sm font-semibold text-right">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {dashboardData.whyProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-sm">
                        <div className="flex items-center gap-sm">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-label-xs text-primary font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-body-sm font-medium text-on-surface">{product.name}</p>
                            <p className="text-label-xs text-on-surface-variant">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-sm text-right text-body-sm font-medium">{product.sold}</td>
                      <td className="p-sm text-right text-body-sm font-medium">{formatPrice(product.revenue)}</td>
                      <td className="p-sm text-right">
                        <span className={`flex items-center justify-end gap-xs ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {product.growth >= 0 ? 'trending_up' : 'trending_down'}
                          </span>
                          {product.growth >= 0 ? '+' : ''}{product.growth}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Performance — kontribusi per kategori */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">category</span>
                Performa Kategori
              </h3>
              <p className="text-label-sm text-on-surface-variant">Distribusi pendapatan per kategori</p>
            </div>
            <div className="p-md space-y-md">
              {dashboardData.whyCategories.map((cat, index) => (
                <div key={index} className="space-y-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-body-sm font-medium text-on-surface">{cat.name}</span>
                    <span className="text-label-xs text-on-surface-variant">{formatPrice(cat.revenue)}</span>
                  </div>
                  <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-label-xs text-on-surface-variant">
                    <span>{cat.percent}% dari total pendapatan</span>
                    <span>{formatPrice(cat.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* HOW - Performance Indicators */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 gap-md mb-lg">
          {/* Live Transaction Feed */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
              <div>
                <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">live_tv</span>
                  Transaksi Live
                </h3>
                <p className="text-label-sm text-on-surface-variant">Aktivitas terbaru</p>
              </div>
              <div className="flex items-center gap-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-label-xs text-green-600 font-medium">LIVE</span>
              </div>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {dashboardData.recentTransactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-md border-b border-surface-variant hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">receipt</span>
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-on-surface">
                        {tx.items} item{tx.items > 1 ? 's' : ''}
                      </p>
                      <p className="text-label-xs text-on-surface-variant">{tx.time}</p>
                      {!activeBranch && tx.branch && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-primary/5 text-primary rounded text-[10px] font-semibold">
                          <span className="material-symbols-outlined text-[10px]">store</span>
                          {tx.branch.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm font-bold text-on-surface">{formatFullPrice(tx.total)}</p>
                    <p className="text-label-xs text-on-surface-variant">{tx.method}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* TARGETS & DAILY TREND */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Daily Target Progress */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">track_changes</span>
                Target Harian
              </h3>
              <button
                type="button"
                onClick={() => {
                  const todayStr = getLocalDateString()
                  const todayTarget = allTargets.find(t => t.date === todayStr) || currentTarget
                  setTargetForm({
                    date: todayStr,
                    revenue_target: todayTarget?.revenue_target || 1000000,
                    transaction_target: todayTarget?.transaction_target || 10
                  })
                  setIsTargetModalOpen(true)
                }}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                title="Kelola Target Harian"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            </div>
            <div className="p-md">
              <div className="text-center mb-md">
                <p className="text-label-sm text-on-surface-variant mb-xs">Progress</p>
                <p className="text-display-total text-primary font-bold">
                  {getAchievementPercent(dashboardData.whatMetrics.totalRevenue, dashboardData.targets.daily.revenue)}%
                </p>
              </div>
              <div className="space-y-sm">
                <div>
                  <div className="flex justify-between text-label-sm mb-xs">
                    <span className="text-on-surface-variant">Pendapatan</span>
                    <span className="font-medium">{formatPrice(dashboardData.whatMetrics.totalRevenue)}</span>
                  </div>
                  <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(getAchievementPercent(dashboardData.whatMetrics.totalRevenue, dashboardData.targets.daily.revenue), 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-label-xs text-on-surface-variant mt-xs text-right">
                    Target: {formatPrice(dashboardData.targets.daily.revenue)}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-label-sm mb-xs">
                    <span className="text-on-surface-variant">Transaksi</span>
                    <span className="font-medium">{dashboardData.whatMetrics.totalTransactions} / {dashboardData.targets.daily.transactions}</span>
                  </div>
                  <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-surface-tint rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(getAchievementPercent(dashboardData.whatMetrics.totalTransactions, dashboardData.targets.daily.transactions), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
                Tren Penjualan Mingguan
              </h3>
              <p className="text-label-sm text-on-surface-variant">Perbandingan dengan target</p>
            </div>
            <div className="p-md" style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.whenDaily}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5b403d' }} />
                  <YAxis
                    tickFormatter={(v) => formatPrice(v)}
                    tick={{ fontSize: 10, fill: '#5b403d' }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                    name="Pendapatan"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke={COLORS.secondary}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Target Management Modal */}
      {isTargetModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg bg-black/50 backdrop-blur-md animate-fade-in"
          onClick={() => setIsTargetModalOpen(false)}
        >
          <div 
            className="bg-surface w-full max-w-[32rem] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up border border-outline-variant/30 text-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface">Kelola Target Harian</h3>
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content & Form */}
            <div className="p-lg flex flex-col gap-md overflow-y-auto bg-surface flex-1">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    await targetService.upsert({
                      date: targetForm.date,
                      revenue_target: Number(targetForm.revenue_target),
                      transaction_target: Number(targetForm.transaction_target),
                    }, activeBranch)
                    // Refetch targets
                    await fetchTargets()
                    // Update today's target if needed
                    const todayStr = getLocalDateString()
                    if (targetForm.date === todayStr) {
                      setCurrentTarget({
                        date: todayStr,
                        revenue_target: Number(targetForm.revenue_target),
                        transaction_target: Number(targetForm.transaction_target)
                      })
                    }
                    alert('Target berhasil disimpan!')
                  } catch (err) {
                    alert('Gagal menyimpan target: ' + err.message)
                  }
                }}
                className="space-y-sm border-b border-outline-variant pb-md"
              >
                <h4 className="text-body-md font-semibold text-primary">Set / Perbarui Target</h4>
                <div className="grid grid-cols-1 gap-sm">
                  <div>
                    <label className="block text-label-xs font-semibold text-on-surface-variant mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={targetForm.date}
                      onChange={(e) => setTargetForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                      className="w-full px-sm py-1.5 border border-outline-variant bg-surface-container rounded-lg text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <div>
                      <label className="block text-label-xs font-semibold text-on-surface-variant mb-1">Target Pendapatan (Rp)</label>
                      <input
                        type="text"
                        value={targetForm.revenue_target === 0 ? '' : formatNumberWithDots(targetForm.revenue_target)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          const numericValue = parseInt(val, 10) || 0
                          setTargetForm(prev => ({ ...prev, revenue_target: numericValue }))
                        }}
                        required
                        className="w-full px-sm py-1.5 border border-outline-variant bg-surface-container rounded-lg text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-label-xs font-semibold text-on-surface-variant mb-1">Target Transaksi</label>
                      <input
                        type="number"
                        value={targetForm.transaction_target}
                        onChange={(e) => setTargetForm(prev => ({ ...prev, transaction_target: Number(e.target.value) }))}
                        required
                        min="0"
                        className="w-full px-sm py-1.5 border border-outline-variant bg-surface-container rounded-lg text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-xs">
                  <Button type="submit" variant="primary" className="py-1.5 px-md text-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Simpan Target
                  </Button>
                </div>
              </form>

              {/* History / List */}
              <div className="space-y-xs">
                <h4 className="text-body-md font-semibold text-on-surface">Daftar Target Terdaftar</h4>
                <div className="max-h-48 overflow-y-auto border border-outline-variant rounded-lg divide-y divide-outline-variant bg-surface-container-lowest">
                  {allTargets.length === 0 ? (
                    <p className="text-body-sm text-center text-on-surface-variant py-md">Belum ada target khusus terdaftar. Menggunakan default.</p>
                  ) : (
                    allTargets.map((target, idx) => (
                      <div key={idx} className="flex justify-between items-center p-sm hover:bg-surface-container-low transition-colors">
                        <div>
                          <p className="text-body-sm font-semibold text-on-surface">{formatDate(target.date)}</p>
                          <p className="text-label-xs text-on-surface-variant">
                            Revenue: {formatFullPrice(target.revenue_target)} | Transaksi: {target.transaction_target}
                          </p>
                        </div>
                        <div className="flex gap-sm">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetForm({
                                date: target.date,
                                revenue_target: target.revenue_target,
                                transaction_target: target.transaction_target
                              })
                            }}
                            className="p-1 text-primary hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Apakah Anda yakin ingin menghapus target untuk tanggal ${formatDate(target.date)}?`)) {
                                try {
                                  await targetService.delete(target.date, activeBranch)
                                  await fetchTargets()
                                  // Reset current target if it was deleted
                                  const todayStr = getLocalDateString()
                                  if (target.date === todayStr) {
                                    setCurrentTarget({
                                      date: todayStr,
                                      revenue_target: 1000000,
                                      transaction_target: 10
                                    })
                                  }
                                } catch (err) {
                                  alert('Gagal menghapus target: ' + err.message)
                                }
                              }
                            }}
                            className="p-1 text-error hover:bg-error/10 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-lg py-md border-t border-outline-variant bg-surface-container-lowest flex justify-end">
              <Button variant="outline" onClick={() => setIsTargetModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
