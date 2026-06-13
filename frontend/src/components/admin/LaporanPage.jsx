import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '../common/Button'
import { TopBar } from '../common/TopBar'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'
import { orderService } from '../../services/orderService'
import { reportService } from '../../services/reportService'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import defaultLogo from '../../assets/pekalipan-logo.jpg'

const COLORS = ['#af101a', '#5f5e5e', '#565858', '#ba1a20', '#8f6f6c', '#c94a4a', '#3d3d3d']

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

const formatPrice = (value) => {
  if (!value) return 'Rp0'
  if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1)}jt`
  if (value >= 1000) return `Rp${(value / 1000).toFixed(0)}rb`
  return `Rp${value}`
}

const formatFullPrice = (value) => {
  if (!value) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp')
}

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: '2-digit', month: 'short' }).format(date)
}

const getLocalDateString = (dateObj) => {
  const d = new Date(dateObj)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDateRange = (period) => {
  const today = new Date()
  const todayStr = getLocalDateString(today)
  let dateFrom = new Date(today)
  switch (period) {
    case 'today': dateFrom = today; break
    case 'week': dateFrom.setDate(dateFrom.getDate() - 7); break
    case 'month': dateFrom.setDate(dateFrom.getDate() - 30); break
    case 'quarter': dateFrom.setMonth(dateFrom.getMonth() - 3); break
    case 'year': dateFrom.setFullYear(dateFrom.getFullYear() - 1); break
    default: dateFrom.setDate(dateFrom.getDate() - 7)
  }
  return { dateFrom: getLocalDateString(dateFrom), dateTo: todayStr }
}

const tabs = [
  { id: 'penjualan', label: 'Penjualan', icon: 'trending_up' },
  { id: 'stok', label: 'Stok', icon: 'inventory' },

  { id: 'kasir', label: 'Kasir', icon: 'badge' },
  { id: 'pembayaran', label: 'Pembayaran', icon: 'payments' },
  { id: 'labarugi', label: 'Laba-Rugi', icon: 'account_balance' },
]

export function LaporanPage({ onToggleSidebar }) {
  const [activeTab, setActiveTab] = useState('penjualan')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [stockReport, setStockReport] = useState(null)
  const [customerReport, setCustomerReport] = useState(null)
  const [profitLoss, setProfitLoss] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [stockFilter, setStockFilter] = useState('all')
  const [stockPage, setStockPage] = useState(1)
  const [stockSearch, setStockSearch] = useState('')
  const ITEMS_PER_PAGE = 5

  useEffect(() => {
    setStockPage(1)
  }, [stockFilter, stockSearch])

  const useCustomRange = activeTab !== 'penjualan'

  const dateFrom = useCustomRange ? customFrom : getDateRange(dateRange).dateFrom
  const dateTo = useCustomRange ? customTo : getDateRange(dateRange).dateTo

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { dateFrom: df, dateTo: dt } = getDateRange(dateRange)
      const [analyticsData, stockData, customerData, plData] = await Promise.all([
        orderService.getAnalytics({ dateFrom: df, dateTo: dt }),
        reportService.getStockReport(),
        reportService.getCustomerReport({ dateFrom: df, dateTo: dt }),
        reportService.getProfitLoss({ dateFrom: df, dateTo: dt }),
      ])
      setAnalytics(analyticsData)
      setStockReport(stockData)
      setCustomerReport(customerData)
      setProfitLoss(plData)
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  const fetchCustom = useCallback(async () => {
    if (!customFrom || !customTo) return
    setLoading(true); setError(null)
    try {
      if (activeTab === 'penjualan' || activeTab === 'kasir' || activeTab === 'pembayaran') {
        const data = await orderService.getAnalytics({ dateFrom: customFrom, dateTo: customTo })
        setAnalytics(data)
      } else if (activeTab === 'stok') {
        const data = await reportService.getStockReport()
        setStockReport(data)
      } else if (activeTab === 'labarugi') {
        const data = await reportService.getProfitLoss({ dateFrom: customFrom, dateTo: customTo })
        setProfitLoss(data)
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [customFrom, customTo, activeTab])

  useEffect(() => {
    fetchAll()
    window.addEventListener('checkout-success', fetchAll)
    const interval = setInterval(fetchAll, 30000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchAll()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('checkout-success', fetchAll)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchAll])

  useEffect(() => {
    if (activeTab !== 'penjualan' && customFrom && customTo) {
      fetchCustom()
    }
  }, [fetchCustom, activeTab])

  const emptyAnalytics = useMemo(() => ({
    summary: { total_revenue: 0, total_transactions: 0, avg_order_value: 0, revenue_growth: 0, best_day: {} },
    daily_sales: [], category_sales: [], payment_sales: [], top_products: [], weekly_sales: [], cashier_sales: [],
  }), [])

  const displayAnalytics = analytics || emptyAnalytics

  const chartData = useMemo(() => {
    const daily = (displayAnalytics.daily_sales || []).map(d => ({
      ...d, label: d.label || formatDateShort(d.date),
      avg_order: d.avg_order || Math.floor((d.revenue || 0) / (d.transactions || 1)),
    }))
    const pmMethods = (() => { try { return JSON.parse(localStorage.getItem('paymentMethods') || '[]') } catch { return [] } })()
    const METHOD_VALUE_MAP = { cash: 'CASH', transfer: 'TRANSFER', ewallet: 'E_WALLET', installment: 'INSTALLMENT' }
    const reverseMap = Object.fromEntries(Object.entries(METHOD_VALUE_MAP).map(([k, v]) => [v, k]))
    const pmLabel = (method) => {
      if (method === 'SPLIT') return 'Split'
      const id = reverseMap[method] || method?.toLowerCase()
      const found = pmMethods.find(p => p.id === id)
      return found?.name || method
    }
    const pmIcon = (method) => {
      if (method === 'SPLIT') return 'call_split'
      const id = reverseMap[method] || method?.toLowerCase()
      const found = pmMethods.find(p => p.id === id)
      return found?.icon || 'receipt'
    }
    const payment = (displayAnalytics.payment_sales || []).map((p, i) => ({
      name: pmLabel(p.method),
      value: p.revenue || p.count || 0,
      count: p.count || 0,
      color: COLORS[i % COLORS.length],
      icon: pmIcon(p.method),
    }))
    const category = (displayAnalytics.category_sales || []).map((c, i) => ({
      name: c.category || '-', sales: c.sales || c.Percent || 0, revenue: c.revenue || 0, fill: COLORS[i % COLORS.length],
    }))
    const topProducts = (displayAnalytics.top_products || []).slice(0, 5).map(p => ({
      ...p,
      name: (p.product_name || p.name || '-').length > 15 ? (p.product_name || p.name || '-').substring(0, 15) + '...' : (p.product_name || p.name || '-'),
      revenue: p.revenue || 0, quantity: p.quantity || p.sales || 0,
    }))
    const weekly = (displayAnalytics.weekly_sales || []).map(w => ({
      ...w, week: w.week || `Week ${w.week_number || 1}`, revenue: w.revenue || 0, transactions: w.transactions || 0, growth: w.growth || 0,
    }))
    const cashier = (displayAnalytics.cashier_sales || []).map((c, i) => ({
      name: c.cashier_name || 'Kasir', transactions: c.transactions || 0, revenue: c.revenue || 0,
      percent: c.percent || 0, fill: COLORS[i % COLORS.length],
    }))
    const summary = displayAnalytics.summary || { total_revenue: 0, total_transactions: 0, avg_order_value: 0, revenue_growth: 0, best_day: {} }
    return { daily, payment, category, topProducts, weekly, cashier, summary }
  }, [displayAnalytics])

  const handleCustomDate = () => {
    if (customFrom && customTo) fetchCustom()
  }

  // --- PDF Export (Penjualan) ---
  const handleDownloadPDF = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      const storeName = (localStorage.getItem('storeName') || 'PEKALIPAN').toUpperCase()
      const storeAddress = localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon'
      const storePhone = localStorage.getItem('storePhone') || '081234567890'
      const storeLogo = localStorage.getItem('storeLogo')

      let logoData = storeLogo
      if (!logoData) {
        const img = new Image(); img.src = defaultLogo
        await new Promise((resolve) => {
          img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height
            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0)
            logoData = canvas.toDataURL('image/jpeg'); resolve()
          }; img.onerror = () => resolve()
        })
      }
      if (logoData) doc.addImage(logoData, 'JPEG', 14, 10, 20, 20)

      doc.setFontSize(16); doc.setFont('helvetica', 'bold')
      doc.text(storeName, 40, 16)
      doc.setFontSize(10); doc.setFont('helvetica', 'normal')
      doc.text(storeAddress, 40, 22); doc.text(`Telp: ${storePhone}`, 40, 28)

      doc.setFontSize(14); doc.setFont('helvetica', 'bold')
      doc.text('LAPORAN PENJUALAN', 14, 45)
      doc.setFontSize(10); doc.setFont('helvetica', 'normal')
      doc.text(`Periode: ${dateFrom} s.d. ${dateTo}`, 14, 52)

      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('1. Ringkasan Performa', 14, 62)
      const s = chartData.summary
      autoTable(doc, {
        startY: 66,
        head: [['Metrik', 'Nilai', 'Keterangan']],
        body: [
          ['Total Pendapatan', formatFullPrice(s.total_revenue), `Tumbuh ${(s.revenue_growth || 0).toFixed(1)}%`],
          ['Total Transaksi', (s.total_transactions || 0).toLocaleString('id-ID'), 'Semua transaksi dalam periode'],
          ['Rata-rata Order', formatFullPrice(s.avg_order_value), 'Per transaksi'],
          ['Hari Terbaik', formatFullPrice(s.best_day?.revenue || 0), s.best_day?.label || (s.best_day?.date ? formatDateShort(s.best_day?.date) : '-')],
        ],
        theme: 'grid', headStyles: { fillColor: [185, 28, 28] },
      })

      let y = doc.lastAutoTable?.finalY + 10 || 120
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('2. Penjualan per Kategori', 14, y)
      autoTable(doc, {
        startY: y + 4, head: [['Kategori', 'Persentase', 'Pendapatan']],
        body: (chartData.category || []).map(c => [c.name, `${(c.sales || 0).toFixed(1)}%`, formatFullPrice(c.revenue || 0)]),
        theme: 'striped', headStyles: { fillColor: [185, 28, 28] },
      })

      y = doc.lastAutoTable?.finalY + 10
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('3. Top 5 Produk Terlaris', 14, y)
      autoTable(doc, {
        startY: y + 4, head: [['No', 'Nama Produk', 'Terjual', 'Pendapatan']],
        body: (chartData.topProducts || []).map((p, i) => [i + 1, p.name, p.quantity, formatFullPrice(p.revenue)]),
        theme: 'striped', headStyles: { fillColor: [185, 28, 28] },
      })

      y = doc.lastAutoTable?.finalY + 10
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('4. Metode Pembayaran', 14, y)
      autoTable(doc, {
        startY: y + 4, head: [['Metode', 'Total']],
        body: (chartData.payment || []).map(p => [p.name, formatFullPrice(p.value)]),
        theme: 'striped', headStyles: { fillColor: [185, 28, 28] },
      })

      y = doc.lastAutoTable?.finalY + 10
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('5. Rincian Harian', 14, y)
      autoTable(doc, {
        startY: y + 4, head: [['Tanggal', 'Pendapatan', 'Transaksi', 'Rata-rata', 'Tren']],
        body: (chartData.daily || []).map((day, idx, arr) => {
          const prev = idx > 0 ? arr[idx - 1] : null
          const trend = prev && prev.revenue > 0 ? ((day.revenue - prev.revenue) / prev.revenue * 100).toFixed(1) : 0
          return [day.label || formatDateShort(day.date), formatFullPrice(day.revenue), day.transactions, formatFullPrice(day.avg_order), `${trend >= 0 ? '+' : ''}${trend}%`]
        }),
        theme: 'striped', headStyles: { fillColor: [185, 28, 28] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      })

      doc.save(`Laporan_Penjualan_${storeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err); alert('Gagal menghasilkan PDF')
    } finally { setIsExporting(false) }
  }

  const renderDateFilter = () => {
    if (activeTab === 'penjualan') {
      return (
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
          className="px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md font-medium text-on-surface cursor-pointer">
          <option value="today">Hari Ini</option>
          <option value="week">7 Hari</option>
          <option value="month">30 Hari</option>
          <option value="quarter">3 Bulan</option>
          <option value="year">Tahun Ini</option>
        </select>
      )
    }
    return (
      <div className="flex items-center gap-sm flex-wrap">
        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
          className="px-sm py-xs border border-outline-variant rounded-md text-body-sm text-on-surface bg-surface" />
        <span className="text-on-surface-variant">s.d.</span>
        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
          className="px-sm py-xs border border-outline-variant rounded-md text-body-sm text-on-surface bg-surface" />
        <Button variant="primary" onClick={handleCustomDate} disabled={!customFrom || !customTo}
          className="py-1 px-3 text-sm">Terapkan</Button>
      </div>
    )
  }

  // --- Tab: Penjualan ---
  const renderPenjualan = () => {
    const s = chartData.summary
    return (
      <div className="space-y-md">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {[
            { label: 'Total Pendapatan', value: formatPrice(s.total_revenue), icon: 'payments', color: 'primary', sub: `+${(s.revenue_growth || 0).toFixed(1)}% vs periode lalu` },
            { label: 'Total Transaksi', value: (s.total_transactions || 0).toLocaleString('id-ID'), icon: 'receipt_long', color: 'surface-tint', sub: 'transaksi dalam periode' },
            { label: 'Rata-rata Order', value: formatPrice(s.avg_order_value), icon: 'shopping_bag', color: 'secondary', sub: 'per transaksi' },
            { label: 'Hari Terbaik', value: formatPrice(s.best_day?.revenue || 0), icon: 'star', color: 'tertiary', sub: s.best_day?.label || (s.best_day?.date ? formatDateShort(s.best_day?.date) : '-') },
          ].map((card, i) => (
            <div key={i} className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-${card.color}/5 rounded-bl-full`}></div>
              <div className="flex items-center gap-sm mb-sm">
                <div className={`w-10 h-10 rounded-lg bg-${card.color}/10 flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-${card.color} filled-icon`}>{card.icon}</span>
                </div>
                <span className="text-label-sm text-on-surface-variant font-medium">{card.label}</span>
              </div>
              <p className={`text-headline-md text-${card.color} font-bold`}>{card.value}</p>
              <p className="text-label-sm text-on-surface-variant mt-xs">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Tren Pendapatan</h3>
            </div>
            <div className="p-md" style={{ height: 300 }}>
              {chartData.daily?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.daily}>
                    <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#af101a" stopOpacity={0.3} /><stop offset="95%" stopColor="#af101a" stopOpacity={0} />
                    </linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis tickFormatter={formatPrice} tick={{ fontSize: 12, fill: '#5b403d' }} width={70} />
                    <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                    <Area type="monotone" dataKey="revenue" stroke="#af101a" strokeWidth={2} fill="url(#revGrad)" name="Pendapatan" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Metode Pembayaran</h3>
            </div>
            <div className="p-md" style={{ height: 260 }}>
              {chartData.payment?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.payment} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                      {chartData.payment.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                    <Legend verticalAlign="bottom" height={36}
                      formatter={(v) => <span className="text-body-sm text-on-surface">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Penjualan per Kategori</h3>
            </div>
            <div className="p-md" style={{ height: 280 }}>
              {chartData.category?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.category} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#5b403d' }} width={80} />
                    <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
                    <Bar dataKey="sales" radius={[0, 4, 4, 0]} name="Penjualan (%)">
                      {chartData.category.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Produk Terlaris</h3>
            </div>
            <div className="p-md" style={{ height: 280 }}>
              {chartData.topProducts?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#5b403d' }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="quantity" fill="#af101a" radius={[0, 4, 4, 0]} name="Terjual" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
            <h3 className="text-body-lg font-semibold text-on-surface">Rincian Penjualan Harian</h3>
            <Button variant="text" onClick={handleDownloadPDF} disabled={isExporting}
              className="py-2 px-3 text-red-600 hover:bg-red-50">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>Export PDF
            </Button>
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
                {chartData.daily?.length === 0 ? (
                  <tr><td colSpan={5} className="p-md text-center text-on-surface-variant">Tidak ada data</td></tr>
                ) : (chartData.daily?.map((day, idx, arr) => {
                  const prev = idx > 0 ? arr[idx - 1] : null
                  const trend = prev && prev.revenue > 0 ? ((day.revenue - prev.revenue) / prev.revenue * 100).toFixed(1) : 0
                  const pos = parseFloat(trend) >= 0
                  return (
                    <tr key={day.date || idx} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                      <td className="p-md font-medium">{day.label || formatDateShort(day.date)}</td>
                      <td className="p-md text-right font-semibold">{formatFullPrice(day.revenue)}</td>
                      <td className="p-md text-right">{day.transactions}</td>
                      <td className="p-md text-right text-on-surface-variant">{formatFullPrice(day.avg_order)}</td>
                      <td className="p-md text-right">
                        <span className={`flex items-center justify-end gap-xs ${pos ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="material-symbols-outlined text-[16px]">{pos ? 'trending_up' : 'trending_down'}</span>
                          {pos ? '+' : ''}{trend}%
                        </span>
                      </td>
                    </tr>
                  )
                }))}
              </tbody>
              <tfoot className="bg-surface-container-high border-t-2 border-outline-variant">
                <tr className="text-body-md font-semibold text-on-surface">
                  <td className="p-md">Total</td>
                  <td className="p-md text-right text-primary">{formatFullPrice(s.total_revenue)}</td>
                  <td className="p-md text-right">{s.total_transactions}</td>
                  <td className="p-md text-right text-on-surface-variant">{formatFullPrice(s.avg_order_value)}</td>
                  <td className="p-md text-right">
                    <span className="flex items-center justify-end gap-xs text-green-600">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>+{(s.revenue_growth || 0).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // --- Tab: Stok ---
  const renderStok = () => {
    const items = stockReport?.items || []
    const searchedItems = items.filter(i => 
      (i.name || '').toLowerCase().includes(stockSearch.toLowerCase()) || 
      (i.sku || '').toLowerCase().includes(stockSearch.toLowerCase())
    )
    const filtered = stockFilter === 'all' ? searchedItems : stockFilter === 'low' ? searchedItems.filter(i => i.is_low_stock) : searchedItems.filter(i => !i.track_stock || i.stock === 0)
    
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const paginatedItems = filtered.slice((stockPage - 1) * ITEMS_PER_PAGE, stockPage * ITEMS_PER_PAGE)

    return (
      <div className="space-y-md">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {[
            { label: 'Total Produk', value: stockReport?.total_products || 0, icon: 'inventory_2', color: 'primary' },
            { label: 'Total Stok', value: (stockReport?.total_stock || 0).toLocaleString('id-ID'), icon: 'inventory', color: 'surface-tint' },
            { label: 'Nilai Stok', value: formatPrice(stockReport?.total_stock_value || 0), icon: 'payments', color: 'secondary' },
            { label: 'Stok Menipis', value: (stockReport?.low_stock_count || 0) + (stockReport?.out_of_stock_count || 0), icon: 'warning', color: 'tertiary' },
          ].map((card, i) => (
            <div key={i} className="bg-surface border border-outline-variant rounded-xl p-md">
              <div className="flex items-center gap-sm mb-sm">
                <div className={`w-10 h-10 rounded-lg bg-${card.color}/10 flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-${card.color} filled-icon`}>{card.icon}</span>
                </div>
                <span className="text-label-sm text-on-surface-variant font-medium">{card.label}</span>
              </div>
              <p className={`text-headline-md text-${card.color} font-bold`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-sm items-start sm:items-center justify-between">
          <div className="flex gap-sm items-center">
            {['all', 'low', 'out'].map(f => (
              <button key={f} onClick={() => setStockFilter(f)}
                className={`px-md py-sm rounded-lg text-body-sm font-medium cursor-pointer transition-colors ${stockFilter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-higher'}`}>
                {f === 'all' ? 'Semua' : f === 'low' ? 'Stok Menipis' : 'Stok Habis'}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              type="text"
              placeholder="Cari produk atau SKU..."
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="text-body-lg font-semibold text-on-surface">Daftar Stok Produk</h3>
            <p className="text-label-sm text-on-surface-variant">{filtered.length} produk</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold">Produk</th>
                  <th className="p-md font-semibold">Kategori</th>
                  <th className="p-md font-semibold text-right">SKU</th>
                  <th className="p-md font-semibold text-right">Harga Jual</th>
                  <th className="p-md font-semibold text-right">Harga Pokok (HPP)</th>
                  <th className="p-md font-semibold text-right">Stok</th>
                  <th className="p-md font-semibold text-right">Nilai Stok</th>
                  <th className="p-md font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-md text-center text-on-surface-variant">Tidak ada data</td></tr>
                ) : (paginatedItems.map((item, idx) => (
                  <tr key={item.product_id || idx} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                    <td className="p-md font-medium">{item.name}</td>
                    <td className="p-md text-on-surface-variant">{item.category}</td>
                    <td className="p-md text-right text-on-surface-variant text-label-sm">{item.sku}</td>
                    <td className="p-md text-right">{formatFullPrice(item.price)}</td>
                    <td className="p-md text-right">{formatFullPrice(item.cost_price)}</td>
                    <td className="p-md text-right">
                      {!item.track_stock ? (
                        <span className="text-on-surface-variant font-medium">∞</span>
                      ) : (
                        <span className={`font-semibold ${item.stock <= 0 ? 'text-error' : item.stock <= 10 ? 'text-warning' : ''}`}>
                          {item.stock}
                        </span>
                      )}
                    </td>
                    <td className="p-md text-right text-on-surface-variant">
                      {!item.track_stock ? '-' : formatFullPrice(item.stock_value)}
                    </td>
                    <td className="p-md">
                      {!item.track_stock ? <span className="text-label-sm font-semibold text-on-surface-variant bg-surface-container-high border border-outline-variant/30 px-sm py-xs rounded-full">Unlimited</span>
                        : item.stock <= 0 ? <span className="text-label-sm font-semibold text-error bg-error/10 px-sm py-xs rounded-full">Habis</span>
                        : item.stock <= 10 ? <span className="text-label-sm font-semibold text-warning bg-warning/10 px-sm py-xs rounded-full">Menipis</span>
                        : <span className="text-label-sm font-semibold text-primary bg-primary/10 px-sm py-xs rounded-full">Aman</span>}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="mt-md flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant font-medium">
              Menampilkan {((stockPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(stockPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} produk
            </span>
            <div className="flex items-center gap-xs">
              <button
                type="button"
                onClick={() => setStockPage(prev => Math.max(prev - 1, 1))}
                disabled={stockPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-low disabled:opacity-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStockPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-label-sm font-semibold transition-colors cursor-pointer
                    ${stockPage === i + 1 ? 'bg-primary text-on-primary' : 'border border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setStockPage(prev => Math.min(prev + 1, totalPages))}
                disabled={stockPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-low disabled:opacity-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }



  // --- Tab: Kasir ---
  const renderKasir = () => {
    const items = chartData.cashier || []
    return (
      <div className="space-y-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Performa per Kasir</h3>
            </div>
            <div className="p-md" style={{ height: 300 }}>
              {items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={items} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis type="number" tickFormatter={formatPrice} tick={{ fontSize: 12, fill: '#5b403d' }} width={70} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#5b403d' }} width={80} />
                    <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                    <Bar dataKey="revenue" fill="#af101a" radius={[0, 4, 4, 0]} name="Pendapatan" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Distribusi Transaksi</h3>
            </div>
            <div className="p-md" style={{ height: 300 }}>
              {items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={items} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="transactions" nameKey="name">
                      {items.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}
                      formatter={(v) => <span className="text-body-sm text-on-surface">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="text-body-lg font-semibold text-on-surface">Detail per Kasir</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold">Kasir</th>
                  <th className="p-md font-semibold text-right">Transaksi</th>
                  <th className="p-md font-semibold text-right">Pendapatan</th>
                  <th className="p-md font-semibold text-right">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {items.length === 0 ? (
                  <tr><td colSpan={4} className="p-md text-center text-on-surface-variant">Tidak ada data</td></tr>
                ) : (items.map((c, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                    <td className="p-md font-medium">{c.name}</td>
                    <td className="p-md text-right">{c.transactions}</td>
                    <td className="p-md text-right font-semibold">{formatFullPrice(c.revenue)}</td>
                    <td className="p-md text-right">{c.percent.toFixed(1)}%</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // --- Tab: Pembayaran ---
  const renderPembayaran = () => {
    const items = chartData.payment || []
    return (
      <div className="space-y-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Distribusi Metode Pembayaran</h3>
            </div>
            <div className="p-md" style={{ height: 300 }}>
              {items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={items} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                      {items.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                    <Legend verticalAlign="bottom" height={36}
                      formatter={(v) => <span className="text-body-sm text-on-surface">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-body-lg font-semibold text-on-surface">Tren Pendapatan per Metode</h3>
            </div>
            <div className="p-md" style={{ height: 300 }}>
              {items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={items}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5b403d' }} />
                    <YAxis tickFormatter={formatPrice} tick={{ fontSize: 12, fill: '#5b403d' }} width={70} />
                    <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Pendapatan">
                      {items.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="text-body-lg font-semibold text-on-surface">Detail per Metode Pembayaran</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold">Metode</th>
                  <th className="p-md font-semibold text-right">Frekuensi</th>
                  <th className="p-md font-semibold text-right">Total</th>
                  <th className="p-md font-semibold text-right">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {items.length === 0 ? (
                  <tr><td colSpan={4} className="p-md text-center text-on-surface-variant">Tidak ada data</td></tr>
                ) : (items.map((p, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                    <td className="p-md font-medium">{p.name}</td>
                    <td className="p-md text-right">{p.count || 0}</td>
                    <td className="p-md text-right font-semibold">{formatFullPrice(p.value)}</td>
                    <td className="p-md text-right">{((p.value / (chartData.summary.total_revenue || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // --- Tab: Laba-Rugi ---
  const renderLabaRugi = () => {
    const pl = profitLoss
    const summary = pl?.summary || { total_revenue: 0, total_cost: 0, total_modal: 0, total_expense: 0, total_profit: 0, net_profit: 0, avg_margin: 0, total_transactions: 0 }
    const daily = pl?.daily || []
    return (
      <div className="space-y-md">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
          {[
            { label: 'Total Pendapatan', value: formatPrice(summary.total_revenue), icon: 'trending_up', color: 'primary' },
            { label: 'Total HPP (Harga Pokok)', value: formatPrice(summary.total_cost), icon: 'money_off', color: 'secondary' },
            { label: 'Modal Harian (Setor)', value: formatPrice(summary.total_modal), icon: 'savings', color: 'tertiary' },
            { label: 'Total Pengeluaran', value: formatPrice(summary.total_expense), icon: 'receipt', color: 'warning' },
            { label: 'Laba Kotor', value: formatPrice(summary.total_profit), icon: 'account_balance', color: summary.total_profit >= 0 ? 'tertiary' : 'error' },
            { label: 'Laba Bersih', value: formatPrice(summary.net_profit), icon: 'savings', color: summary.net_profit >= 0 ? 'tertiary' : 'error' },
            { label: 'Margin Rata-rata', value: `${summary.avg_margin.toFixed(1)}%`, icon: 'percent', color: summary.avg_margin >= 0 ? 'tertiary' : 'error' },
          ].map((card, i) => (
            <div key={i} className="bg-surface border border-outline-variant rounded-xl p-md relative overflow-hidden">
              <div className="flex items-center gap-sm mb-sm">
                <div className={`w-10 h-10 rounded-lg bg-${card.color}/10 flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-${card.color} filled-icon`}>{card.icon}</span>
                </div>
                <span className="text-label-sm text-on-surface-variant font-medium">{card.label}</span>
              </div>
              <p className={`text-headline-md text-${card.color} font-bold`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="text-body-lg font-semibold text-on-surface">Tren Laba-Rugi Harian</h3>
          </div>
          <div className="p-md" style={{ height: 300 }}>
            {daily.length > 0 && daily.some(d => d.revenue > 0 || d.expense > 0 || d.modal > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4beba" opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5b403d' }} />
                  <YAxis tickFormatter={formatPrice} tick={{ fontSize: 12, fill: '#5b403d' }} width={70} />
                  <Tooltip content={<CustomTooltip formatter={formatFullPrice} />} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#af101a" radius={[4, 4, 0, 0]} name="Pendapatan" />
                  <Bar dataKey="cost" fill="#5f5e5e" radius={[4, 4, 0, 0]} name="HPP" />
                  <Bar dataKey="modal" fill="#8f6f6c" radius={[4, 4, 0, 0]} name="Modal Setor" />
                  <Bar dataKey="profit" fill="#2d8a4e" radius={[4, 4, 0, 0]} name="Laba" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-on-surface-variant">Tidak ada data</div>}
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="text-body-lg font-semibold text-on-surface">Rincian Laba-Rugi Harian</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold">Tanggal</th>
                  <th className="p-md font-semibold text-right">Pendapatan</th>
                  <th className="p-md font-semibold text-right">HPP</th>
                  <th className="p-md font-semibold text-right">Modal Setor</th>
                  <th className="p-md font-semibold text-right">Pengeluaran</th>
                  <th className="p-md font-semibold text-right">Laba Kotor</th>
                  <th className="p-md font-semibold text-right">Laba Bersih</th>
                  <th className="p-md font-semibold text-right">Margin</th>
                  <th className="p-md font-semibold text-right">Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {daily.length === 0 || !daily.some(d => d.revenue > 0 || d.expense > 0 || d.modal > 0) ? (
                  <tr><td colSpan={9} className="p-md text-center text-on-surface-variant">Tidak ada data</td></tr>
                ) : (daily.filter(d => d.revenue > 0 || d.expense > 0 || d.modal > 0).map((d, idx) => (
                  <tr key={d.date || idx} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                    <td className="p-md font-medium">{d.label || formatDateShort(d.date)}</td>
                    <td className="p-md text-right font-semibold">{formatFullPrice(d.revenue)}</td>
                    <td className="p-md text-right">{formatFullPrice(d.cost)}</td>
                    <td className="p-md text-right text-tertiary">{formatFullPrice(d.modal)}</td>
                    <td className="p-md text-right text-amber-600">{formatFullPrice(d.expense)}</td>
                    <td className={`p-md text-right font-semibold ${d.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatFullPrice(d.profit)}</td>
                    <td className={`p-md text-right font-semibold ${d.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatFullPrice(d.net_profit)}</td>
                    <td className={`p-md text-right ${d.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{d.margin.toFixed(1)}%</td>
                    <td className="p-md text-right">{d.transactions}</td>
                  </tr>
                )))}
              </tbody>
              <tfoot className="bg-surface-container-high border-t-2 border-outline-variant">
                <tr className="text-body-md font-semibold text-on-surface">
                  <td className="p-md">Total</td>
                  <td className="p-md text-right text-primary">{formatFullPrice(summary.total_revenue)}</td>
                  <td className="p-md text-right">{formatFullPrice(summary.total_cost)}</td>
                  <td className="p-md text-right text-tertiary">{formatFullPrice(summary.total_modal)}</td>
                  <td className="p-md text-right text-amber-600">{formatFullPrice(summary.total_expense)}</td>
                  <td className={`p-md text-right ${summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatFullPrice(summary.total_profit)}</td>
                  <td className={`p-md text-right font-bold ${summary.net_profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatFullPrice(summary.net_profit)}</td>
                  <td className={`p-md text-right ${summary.avg_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{summary.avg_margin.toFixed(1)}%</td>
                  <td className="p-md text-right">{summary.total_transactions}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // --- Loading ---
  if (loading && !analytics && !stockReport) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
        <header className="flex justify-between items-center px-lg py-md h-[72px] w-full border-b border-outline-variant bg-surface z-20">
          <h2 className="text-headline-md text-on-surface font-semibold">Laporan</h2>
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
      {/* Header */}
      <TopBar
        title="Laporan"
        subtitle={error ? 'Gagal memuat data' : `Laporan ${tabs.find(t => t.id === activeTab)?.label || ''}`}
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <div className="flex items-center gap-md">
            {renderDateFilter()}
            <button onClick={() => activeTab === 'penjualan' ? fetchAll() : fetchCustom()}
              className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer"
              title="Refresh">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-outline-variant bg-surface gap-xs px-lg hide-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-sm px-md py-sm text-body-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {activeTab === 'penjualan' && renderPenjualan()}
        {activeTab === 'stok' && renderStok()}
        {activeTab === 'kasir' && renderKasir()}
        {activeTab === 'pembayaran' && renderPembayaran()}
        {activeTab === 'labarugi' && renderLabaRugi()}
      </div>
    </div>
  )
}
