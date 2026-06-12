import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from './common/Button'
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
} from 'recharts'
import { orderService } from '../services/orderService'

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-outline-variant rounded-lg p-md shadow-lg z-50">
        <p className="text-label-sm text-on-surface-variant mb-xs">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-body-md font-semibold" style={{ color: entry.color || entry.fill }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value?.toLocaleString('id-ID')}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Format price helper
const formatPrice = (value) => {
  if (!value) return 'Rp0'
  if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1)}jt`
  if (value >= 1000) return `Rp${(value / 1000).toFixed(0)}rb`
  return `Rp${value}`
}

// Format full currency
const formatFullPrice = (value) => {
  if (!value) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp')
}

// Format date for display
const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

// Generate date range for period
const getDateRange = (period) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  let dateFrom = new Date(today)

  switch (period) {
    case 'today':
      dateFrom = today
      break
    case 'week':
      dateFrom.setDate(dateFrom.getDate() - 7)
      break
    case 'month':
      dateFrom.setDate(dateFrom.getDate() - 30)
      break
    case 'year':
      dateFrom.setFullYear(dateFrom.getFullYear() - 1)
      break
    default:
      dateFrom.setDate(dateFrom.getDate() - 7)
  }

  return {
    dateFrom: dateFrom.toISOString().split('T')[0],
    dateTo: todayStr,
  }
}

// Color palette
const COLORS = ['#af101a', '#5f5e5e', '#565858', '#ba1a20', '#8f6f6c']

export function LaporanPage({ onToggleSidebar }) {
  // State
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [dateRange, setDateRange] = useState('week')
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState(null)
  const [tablePage, setTablePage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [tableDateFrom, setTableDateFrom] = useState(() => getDateRange('week').dateFrom)
  const [tableDateTo, setTableDateTo] = useState(() => getDateRange('week').dateTo)

  // Fetch analytics data from API
  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { dateFrom, dateTo } = getDateRange(dateRange)
      const data = await orderService.getAnalytics({ dateFrom, dateTo })
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err.message)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  // Initial fetch & listen for checkout events
  useEffect(() => {
    fetchAnalytics()

    // Sync table date filter with top selector
    const { dateFrom, dateTo } = getDateRange(dateRange)
    setTableDateFrom(dateFrom)
    setTableDateTo(dateTo)
    setTablePage(1)

    // Listen for checkout success events
    const handleCheckoutSuccess = () => {
      fetchAnalytics()
    }

    window.addEventListener('checkout-success', handleCheckoutSuccess)
    return () => window.removeEventListener('checkout-success', handleCheckoutSuccess)
  }, [fetchAnalytics, dateRange])

  // Use API data directly (empty data = no data, not mock)
  const displayData = useMemo(() => {
    return analytics || {
      summary: { total_revenue: 0, total_transactions: 0, avg_order_value: 0, revenue_growth: 0, best_day: {} },
      daily_sales: [],
      category_sales: [],
      payment_sales: [],
      top_products: [],
      weekly_sales: [],
    }
  }, [analytics])

  // Process data for charts
  const chartData = useMemo(() => {
    if (!displayData) return null

    // Daily sales data
    const dailyData = (displayData.daily_sales || []).map(d => ({
      ...d,
      label: d.label || formatDateShort(d.date),
      avg_order: d.avg_order || Math.floor((d.revenue || 0) / (d.transactions || 1)),
    }))

    // Payment method data for pie chart
    const paymentData = (displayData.payment_sales || []).map((p, idx) => ({
      name: p.method === 'TUNAI' ? 'Tunai' : p.method === 'KARTU' ? 'Kartu' : p.method === 'EWALLET' ? 'E-Wallet' : p.method || p.name || '-',
      value: p.revenue || p.count || 0,
      color: COLORS[idx % COLORS.length],
    }))

    // Category data for bar chart
    const categoryData = (displayData.category_sales || []).map((c, idx) => ({
      name: c.category || '-',
      sales: c.sales || c.Percent || 0,
      revenue: c.revenue || 0,
      fill: COLORS[idx % COLORS.length],
    }))

    // Top products
    const topProducts = (displayData.top_products || []).slice(0, 5).map(p => ({
      ...p,
      name: (p.product_name || p.name || '-').length > 15
        ? (p.product_name || p.name || '-').substring(0, 15) + '...'
        : (p.product_name || p.name || '-'),
      revenue: p.revenue || 0,
      quantity: p.quantity || p.sales || 0,
    }))

    // Weekly data
    const weeklyData = (displayData.weekly_sales || []).map(w => ({
      ...w,
      week: w.week || `Week ${w.week_number || 1}`,
      revenue: w.revenue || 0,
      transactions: w.transactions || 0,
      growth: w.growth || 0,
    }))

    // Summary
    const summary = displayData.summary || {
      total_revenue: 0,
      total_transactions: 0,
      avg_order_value: 0,
      revenue_growth: 0,
      best_day: {},
    }

    return {
      dailyData,
      paymentData,
      categoryData,
      topProducts,
      weeklyData,
      summary,
    }
  }, [displayData])

  // Filtered & paginated daily data for table
  const filteredDailyData = useMemo(() => {
    const data = chartData?.dailyData || []
    if (!tableDateFrom && !tableDateTo) return data
    return data.filter(d => {
      if (tableDateFrom && d.date < tableDateFrom) return false
      if (tableDateTo && d.date > tableDateTo) return false
      return true
    })
  }, [chartData, tableDateFrom, tableDateTo])

  const totalPages = Math.max(1, Math.ceil(filteredDailyData.length / rowsPerPage))
  const paginatedDailyData = useMemo(() => {
    const start = (tablePage - 1) * rowsPerPage
    return filteredDailyData.slice(start, start + rowsPerPage)
  }, [filteredDailyData, tablePage, rowsPerPage])

  // Export report
  const handleExport = async (type) => {
    setIsExporting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert(`Laporan berhasil di-export dalam format ${type.toUpperCase()}`)
    } catch (error) {
      alert('Gagal export laporan')
    } finally {
      setIsExporting(false)
    }
  }

  // Get payment icon
  const getPaymentIcon = (method) => {
    const icons = {
      'Tunai': 'payments',
      'Kartu': 'credit_card',
      'E-Wallet': 'qr_code',
      'TUNAI': 'payments',
      'KARTU': 'credit_card',
      'EWALLET': 'qr_code',
      'CASH': 'payments',
      'CARD': 'credit_card',
      'E_WALLET': 'qr_code',
    }
    return icons[method] || 'receipt'
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
        <header className="flex justify-between items-center px-lg py-md h-[72px] w-full border-b border-outline-variant bg-surface z-20">
          <h2 className="text-headline-md text-on-surface font-semibold">Laporan & Analisis</h2>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-[64px] text-primary">sync</span>
            <p className="text-body-lg font-medium text-on-surface-variant mt-md">Memuat data laporan...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md px-lg py-md border-b border-outline-variant bg-surface z-20">
        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div>
            <h2 className="text-headline-md text-on-surface font-semibold">Laporan & Analisis</h2>
            <p className="text-label-sm text-on-surface-variant">
              {error ? 'Gagal memuat data' : 'Analisis performa penjualan'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md font-medium text-on-surface cursor-pointer"
          >
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
            <option value="year">Tahun Ini</option>
          </select>
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            className="py-2 px-3"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {/* Total Revenue */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full"></div>
            <div className="flex items-center gap-sm mb-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary filled-icon">payments</span>
              </div>
              <span className="text-label-sm text-on-surface-variant font-medium">Total Pendapatan</span>
            </div>
            <p className="text-headline-md text-primary font-bold">
              {formatPrice(chartData?.summary.total_revenue || 0)}
            </p>
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-green-600 text-[16px]">trending_up</span>
              <span className="text-label-sm text-green-600 font-medium">
                +{(chartData?.summary.revenue_growth || 0).toFixed(1)}%
              </span>
              <span className="text-label-sm text-on-surface-variant">vs periode lalu</span>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-surface-tint/5 rounded-bl-full"></div>
            <div className="flex items-center gap-sm mb-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-tint/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-surface-tint filled-icon">receipt_long</span>
              </div>
              <span className="text-label-sm text-on-surface-variant font-medium">Total Transaksi</span>
            </div>
            <p className="text-headline-md text-surface-tint font-bold">
              {(chartData?.summary.total_transactions || 0).toLocaleString('id-ID')}
            </p>
            <div className="flex items-center gap-xs">
              <span className="text-label-sm text-on-surface-variant">transaksi dalam periode</span>
            </div>
          </div>

          {/* Average Order */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
            <div className="flex items-center gap-sm mb-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary filled-icon">shopping_bag</span>
              </div>
              <span className="text-label-sm text-on-surface-variant font-medium">Rata-rata Order</span>
            </div>
            <p className="text-headline-md text-secondary font-bold">
              {formatPrice(chartData?.summary.avg_order_value || 0)}
            </p>
            <div className="flex items-center gap-xs">
              <span className="text-label-sm text-on-surface-variant">per transaksi</span>
            </div>
          </div>

          {/* Best Day */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
            <div className="flex items-center gap-sm mb-sm">
              <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary filled-icon">star</span>
              </div>
              <span className="text-label-sm text-on-surface-variant font-medium">Hari Terbaik</span>
            </div>
            <p className="text-headline-md text-tertiary font-bold">
              {formatPrice(chartData?.summary.best_day?.revenue || chartData?.summary.best_day?.avg_order || 0)}
            </p>
            <div className="flex items-center gap-xs">
              <span className="text-label-sm text-on-surface-variant">
                {chartData?.summary.best_day?.label || chartData?.summary.best_day?.date ? formatDateShort(chartData?.summary.best_day?.date || chartData?.summary.best_day?.label) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-lg">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Tren Pendapatan</h3>
              <p className="text-label-sm text-on-surface-variant">
                Pendapatan harian {dateRange === 'week' ? '7 hari' : dateRange === 'month' ? '30 hari' : 'terbaru'}
              </p>
            </div>
            <div className="p-md" style={{ height: '320px' }}>
              {chartData?.dailyData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.dailyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#af101a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#af101a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis
                      tickFormatter={(value) => formatPrice(value)}
                      tick={{ fontSize: 12, fill: '#5b403d' }}
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#af101a"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      name="Pendapatan"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant">
                  Tidak ada data tren
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Metode Pembayaran</h3>
              <p className="text-label-sm text-on-surface-variant">Distribusi metode bayar</p>
            </div>
            <div className="p-md" style={{ height: '280px' }}>
              {chartData?.paymentData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-body-sm text-on-surface">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant">
                  Tidak ada data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-lg">
          {/* Sales by Category */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Penjualan per Kategori</h3>
              <p className="text-label-sm text-on-surface-variant">Distribusi penjualan berdasarkan kategori</p>
            </div>
            <div className="p-md" style={{ height: '280px' }}>
              {chartData?.categoryData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#5b403d' }}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
                    <Bar dataKey="sales" radius={[0, 4, 4, 0]} name="Penjualan (%)">
                      {chartData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant">
                  Tidak ada data
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Produk Terlaris</h3>
              <p className="text-label-sm text-on-surface-variant">Top 5 produk berdasarkan penjualan</p>
            </div>
            <div className="p-md" style={{ height: '280px' }}>
              {chartData?.topProducts?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#5b403d' }}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="quantity" fill="#af101a" radius={[0, 4, 4, 0]} name="Terjual" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant">
                  Tidak ada data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Comparison & Transaction Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-lg">
          {/* Weekly Comparison */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Perbandingan Mingguan</h3>
              <p className="text-label-sm text-on-surface-variant">Pendapatan per minggu dalam sebulan</p>
            </div>
            <div className="p-md" style={{ height: '280px' }}>
              {chartData?.weeklyData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis
                      tickFormatter={(value) => formatPrice(value)}
                      tick={{ fontSize: 12, fill: '#5b403d' }}
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#af101a" radius={[4, 4, 0, 0]} name="Pendapatan" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant">
                  Tidak ada data mingguan
                </div>
              )}
            </div>
          </div>

          {/* Transaction Trend */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Tren Transaksi</h3>
              <p className="text-label-sm text-on-surface-variant">Jumlah transaksi harian</p>
            </div>
            <div className="p-md" style={{ height: '280px' }}>
              {chartData?.dailyData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#5b403d' }} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="transactions"
                      stroke="#5f5e5e"
                      strokeWidth={2}
                      dot={{ fill: '#5f5e5e', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      name="Transaksi"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant">
                  Tidak ada data transaksi
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
            <div>
              <h3 className="text-body-lg font-semibold text-on-surface">Detail Penjualan Harian</h3>
              <p className="text-label-sm text-on-surface-variant">Rincian penjualan per hari</p>
            </div>
            <Button
              variant="text"
              onClick={() => handleExport('excel')}
              className="py-2 px-3"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Download
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low flex flex-wrap items-center gap-sm">
            <label className="text-label-sm text-on-surface-variant">Filter Tanggal:</label>
            <input
              type="date"
              value={tableDateFrom}
              onChange={(e) => { setTableDateFrom(e.target.value); setTablePage(1) }}
              className="px-sm py-xs border border-outline-variant rounded-md text-body-sm text-on-surface bg-surface"
            />
            <span className="text-on-surface-variant">s.d.</span>
            <input
              type="date"
              value={tableDateTo}
              onChange={(e) => { setTableDateTo(e.target.value); setTablePage(1) }}
              className="px-sm py-xs border border-outline-variant rounded-md text-body-sm text-on-surface bg-surface"
            />
            {(tableDateFrom !== getDateRange(dateRange).dateFrom || tableDateTo !== getDateRange(dateRange).dateTo) && (
              <button
                onClick={() => {
                  const { dateFrom, dateTo } = getDateRange(dateRange)
                  setTableDateFrom(dateFrom)
                  setTableDateTo(dateTo)
                  setTablePage(1)
                }}
                className="text-label-sm text-primary hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
            <span className="ml-auto text-label-sm text-on-surface-variant">
              {filteredDailyData.length} data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold">Tanggal</th>
                  <th className="p-md font-semibold text-right">Pendapatan</th>
                  <th className="p-md font-semibold text-right">Transaksi</th>
                  <th className="p-md font-semibold text-right">Rata-rata</th>
                  <th className="p-md font-semibold text-right">Tren</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {paginatedDailyData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-md text-center text-on-surface-variant">Tidak ada data</td>
                  </tr>
                ) : (paginatedDailyData.map((day, index) => {
                  const globalIndex = filteredDailyData.indexOf(day)
                  const prevDay = globalIndex > 0 ? filteredDailyData[globalIndex - 1] : null
                  const trend = prevDay && prevDay.revenue > 0
                    ? ((day.revenue - prevDay.revenue) / prevDay.revenue * 100).toFixed(1)
                    : 0
                  const isPositive = parseFloat(trend) >= 0

                  return (
                    <tr key={day.date || index} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                      <td className="p-md font-medium">{day.label || formatDateShort(day.date)}</td>
                      <td className="p-md text-right font-semibold">{formatFullPrice(day.revenue)}</td>
                      <td className="p-md text-right">{day.transactions}</td>
                      <td className="p-md text-right text-on-surface-variant">{formatFullPrice(day.avg_order)}</td>
                      <td className="p-md text-right">
                        <span className={`flex items-center justify-end gap-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="material-symbols-outlined text-[16px]">
                            {isPositive ? 'trending_up' : 'trending_down'}
                          </span>
                          {isPositive ? '+' : ''}{trend}%
                        </span>
                      </td>
                    </tr>
                  )
                }))}
              </tbody>
              <tfoot className="bg-surface-container-high border-t-2 border-outline-variant">
                <tr className="text-body-md font-semibold text-on-surface">
                  <td className="p-md">Total</td>
                  <td className="p-md text-right text-primary">{formatFullPrice(chartData?.summary.total_revenue)}</td>
                  <td className="p-md text-right">{chartData?.summary.total_transactions}</td>
                  <td className="p-md text-right text-on-surface-variant">{formatFullPrice(chartData?.summary.avg_order_value)}</td>
                  <td className="p-md text-right">
                    <span className="flex items-center justify-end gap-xs text-green-600">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>
                      +{(chartData?.summary.revenue_growth || 0).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {filteredDailyData.length > rowsPerPage && (
            <div className="px-md py-sm border-t border-outline-variant bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <span className="text-label-sm text-on-surface-variant">Baris per halaman:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setTablePage(1) }}
                  className="px-sm py-xs border border-outline-variant rounded-md text-body-sm text-on-surface bg-surface cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-label-sm text-on-surface-variant">
                  {(tablePage - 1) * rowsPerPage + 1}–{Math.min(tablePage * rowsPerPage, filteredDailyData.length)} dari {filteredDailyData.length}
                </span>
              </div>
              <div className="flex items-center gap-xs">
                <button
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage(tablePage - 1)}
                  className="px-sm py-xs border border-outline-variant rounded-md text-body-sm text-on-surface hover:bg-surface-container-highest disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (tablePage <= 3) {
                    pageNum = i + 1
                  } else if (tablePage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = tablePage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setTablePage(pageNum)}
                      className={`px-sm py-xs border border-outline-variant rounded-md text-body-sm cursor-pointer ${
                        tablePage === pageNum
                          ? 'bg-primary text-on-primary font-semibold'
                          : 'text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  disabled={tablePage >= totalPages}
                  onClick={() => setTablePage(tablePage + 1)}
                  className="px-sm py-xs border border-outline-variant rounded-md text-body-sm text-on-surface hover:bg-surface-container-highest disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
