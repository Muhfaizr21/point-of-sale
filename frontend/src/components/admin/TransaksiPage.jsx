import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { TopBar } from '../common/TopBar'

const METHOD_VALUE_MAP = {
  cash: 'CASH', transfer: 'TRANSFER', ewallet: 'E_WALLET', installment: 'INSTALLMENT',
}

const getPaymentMethods = () => {
  try {
    const raw = localStorage.getItem('paymentMethods')
    if (!raw) return fallbackMethods()
    const methods = JSON.parse(raw).filter(p => p.enabled)
    if (methods.length === 0) return fallbackMethods()
    return methods.map(p => ({
      value: METHOD_VALUE_MAP[p.id] || p.id.toUpperCase(),
      label: p.name,
      icon: p.icon || 'payments',
    }))
  } catch { return fallbackMethods() }
}

const fallbackMethods = () => [
  { value: 'CASH', label: 'Tunai', icon: 'payments' },
]
import { orderService } from '../../services/orderService'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import defaultLogo from '../../assets/pekalipan-logo.jpg'

export function TransaksiPage({ onToggleSidebar }) {
  // Filter & Pagination states
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 0,
  })

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [dateRange, setDateRange] = useState('today')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Ref untuk debounce search
  const searchTimeoutRef = useRef(null)

  // Format price helper
  const formatPrice = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('IDR', 'Rp')
  }

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Get local date string in YYYY-MM-DD format (timezone-safe)
  const getLocalDateString = useCallback((dateObj) => {
    const d = new Date(dateObj)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // Get date range for filter
  const getDateRange = useCallback(() => {
    const today = new Date()
    const todayStr = getLocalDateString(today)

    let dateFrom = ''
    let dateTo = ''

    switch (dateRange) {
      case 'today':
        dateFrom = todayStr
        dateTo = todayStr
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        dateFrom = getLocalDateString(yesterday)
        dateTo = dateFrom
        break
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFrom = getLocalDateString(weekAgo)
        dateTo = todayStr
        break
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFrom = getLocalDateString(monthAgo)
        dateTo = todayStr
        break
      case 'all':
        dateFrom = ''
        dateTo = ''
        break
      default:
        dateFrom = todayStr
        dateTo = todayStr
    }

    return { dateFrom, dateTo }
  }, [dateRange, getLocalDateString])

  // Fetch orders with filters
  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const { dateFrom, dateTo } = getDateRange()
      const result = await orderService.getOrders({
        page,
        limit: pagination.limit,
        search: searchQuery,
        paymentMethod: selectedPaymentMethod,
        status: selectedStatus,
        dateFrom,
        dateTo,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })

      setOrders(result.data || [])
      setPagination(prev => ({
        ...prev,
        page: result.pagination?.page || page,
        total_items: result.pagination?.total_items || 0,
        total_pages: result.pagination?.total_pages || 0,
      }))
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [getDateRange, searchQuery, selectedPaymentMethod, selectedStatus, pagination.limit])

  const [checkoutVersion, setCheckoutVersion] = useState(0)
  const fetchRef = useRef(fetchOrders)
  fetchRef.current = fetchOrders

  useEffect(() => {
    fetchRef.current(1)
  }, [checkoutVersion])

  useEffect(() => {
    const refresh = () => setCheckoutVersion(v => v + 1)
    window.addEventListener('checkout-success', refresh)
    const interval = setInterval(refresh, 30000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('checkout-success', refresh)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Refetch when filters change (with debounce for search)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchOrders(1)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, selectedPaymentMethod, selectedStatus, dateRange])

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchOrders(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pagination.total_pages, fetchOrders])

  // Handle limit change
  const handleLimitChange = useCallback((newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit, 10) }))
    fetchOrders(1)
  }, [fetchOrders])

  // Get payment method label
  const getPaymentMethodLabel = (method) => {
    if (method === 'SPLIT') return 'Split'
    const found = getPaymentMethods().find(p => p.value === method)
    return found?.label || method || '-'
  }

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    if (method === 'SPLIT') return 'call_split'
    const found = getPaymentMethods().find(p => p.value === method)
    return found?.icon || 'receipt'
  }

  // Get split payment breakdown text
  const getSplitSummary = (order) => {
    if (!order.split_payments || order.split_payments.length === 0) return null
    return order.split_payments
      .filter(sp => sp.amount > 0)
      .map(sp => `${getPaymentMethodLabel(sp.method)} ${formatPrice(sp.amount)}`)
      .join(' + ')
  }

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      'COMPLETED': 'Selesai',
      'PENDING': 'Menunggu',
      'REFUNDED': 'DiRefund',
      'CANCELLED': 'Dibatalkan',
    }
    return labels[status] || status || '-'
  }

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'COMPLETED': 'bg-green-100 text-green-700 border-green-200',
      'PENDING': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'REFUNDED': 'bg-orange-100 text-orange-700 border-orange-200',
      'CANCELLED': 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Handle view detail
  const handleViewDetail = useCallback((order) => {
    setLoadingDetail(true)
    setSelectedOrder(order)
    setIsModalOpen(true)
    setLoadingDetail(false)
  }, [])

  // Handle print receipt
  const handlePrintReceipt = useCallback((order) => {
    const storeName = (localStorage.getItem('storeName') || 'PEKALIPAN').toUpperCase()
    const storeAddress = localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon'
    const storePhone = localStorage.getItem('storePhone') || '081234567890'
    const receiptFooter = localStorage.getItem('receiptFooter') || 'Terima Kasih atas Kunjungan Anda'

    const centerText = (text, width = 37) => {
      if (!text) return ''
      const len = text.length
      if (len >= width) return text.substring(0, width)
      const leftPad = Math.floor((width - len) / 2)
      return ' '.repeat(leftPad) + text
    }

    const printContent = `
=====================================
${centerText(storeName)}
${centerText(storeAddress)}
${centerText('Telp: ' + storePhone)}
=====================================
Invoice  : ${order.invoice_number}
Tanggal  : ${formatDate(order.created_at)}
Kasir    : ${order.cashier || 'Admin'}
-------------------------------------
Pelanggan: ${order.customer || 'Umum'}
-------------------------------------
ITEM                QTY    HARGA
${(order.items || []).map(item =>
  `${(item.product_name || item.name || '').padEnd(18)} ${(item.quantity || 0).toString().padStart(3)} ${formatPrice(item.price || 0).padStart(10)}`
).join('\n')}
-------------------------------------
Subtotal           ${formatPrice(order.subtotal || 0)}
Pajak (10%)        ${formatPrice(order.tax || 0)}
Diskon Manual      ${formatPrice(order.discount || 0)}
Promo Diskon       ${formatPrice(order.promo_discount || 0)}
=====================================
TOTAL              ${formatPrice(order.total || 0)}
Bayar (${getPaymentMethodLabel(order.payment_method)})
=====================================
${centerText(receiptFooter)}
=====================================
    `
    console.log('Print receipt:', printContent)
    alert('Struk akan dicetak (fitur cetak dalam pengembangan)')
  }, [])

  // Handle Download PDF
  const handleDownloadPDF = async () => {
    try {
      setLoading(true)
      const doc = new jsPDF()
      const storeName = (localStorage.getItem('storeName') || 'PEKALIPAN').toUpperCase()
      const storeAddress = localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon'
      const storePhone = localStorage.getItem('storePhone') || '081234567890'
      const storeLogo = localStorage.getItem('storeLogo')

      // 1. Add Logo
      try {
        let logoData = storeLogo;
        if (!logoData) {
          const img = new Image()
          img.src = defaultLogo
          await new Promise((resolve) => {
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0)
              logoData = canvas.toDataURL('image/jpeg')
              resolve()
            }
            img.onerror = () => resolve()
          })
        }

        if (logoData) {
          // (image, format, x, y, width, height)
          doc.addImage(logoData, 'JPEG', 14, 10, 20, 20)
        }
      } catch (e) {
        console.error('Error adding logo to PDF', e)
      }

      // 2. Add Header Text
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(storeName, 40, 16)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(storeAddress, 40, 22)
      doc.text(`Telp: ${storePhone}`, 40, 28)

      // 3. Add Title & Subtitle
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('LAPORAN KEUANGAN & TRANSAKSI', 14, 45)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      // 4. Fetch all data for the current filter
      const { dateFrom, dateTo } = getDateRange()
      
      let periodText = 'Semua Waktu'
      if (dateFrom && dateTo) {
        if (dateFrom === dateTo) {
          periodText = new Date(dateFrom).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        } else {
          const fromStr = new Date(dateFrom).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          const toStr = new Date(dateTo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          periodText = `${fromStr} - ${toStr}`
        }
      }

      doc.text(`Periode: ${periodText}`, 14, 52)
      doc.text(`Status: ${selectedStatus ? getStatusLabel(selectedStatus) : 'Semua'} | Metode: ${selectedPaymentMethod ? getPaymentMethodLabel(selectedPaymentMethod) : 'Semua'}`, 14, 58)

      const allOrdersResult = await orderService.getOrders({
        page: 1,
        limit: 1000, // fetch up to 1000 for PDF
        search: searchQuery,
        paymentMethod: selectedPaymentMethod,
        status: selectedStatus,
        dateFrom,
        dateTo,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
      
      const allOrders = allOrdersResult.data || []
      doc.text(`Total Transaksi: ${allOrders.length}`, 14, 64)

      // 5. Build Table Data
      const tableColumn = ["No", "Invoice", "Tanggal", "Pelanggan", "Item", "Metode", "Status", "Total"]
      const tableRows = []
      let totalRevenue = 0

      allOrders.forEach((order, index) => {
        const rowData = [
          index + 1,
          order.invoice_number,
          formatDate(order.created_at),
          order.customer || 'Umum',
          order.items?.length || 0,
          getPaymentMethodLabel(order.payment_method),
          getStatusLabel(order.order_status || order.payment_status),
          formatPrice(order.total)
        ]
        tableRows.push(rowData)
        if (order.order_status === 'COMPLETED' || order.payment_status === 'COMPLETED') {
           totalRevenue += order.total || 0
        }
      })

      // 6. Generate AutoTable
      autoTable(doc, {
        startY: 70,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [185, 28, 28] }, // Primary Color (red-700 approx)
        styles: { fontSize: 8 },
        columnStyles: {
          7: { halign: 'right' } // Right align the Total column
        }
      })

      // 7. Add Summary Footer
      const finalY = doc.lastAutoTable?.finalY || 70
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Total Pendapatan (Selesai):', 14, finalY + 10)
      doc.text(formatPrice(totalRevenue), 65, finalY + 10)

      // 8. Save PDF
      doc.save(`Laporan_Transaksi_${storeName.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal menghasilkan PDF Laporan')
    } finally {
      // Refresh current page view to reset loading state properly
      fetchOrders(pagination.page)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = useCallback(() => {
    const pages = []
    const { page, total_pages } = pagination

    if (total_pages <= 7) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (page > 3) {
        pages.push('...')
      }

      for (let i = Math.max(2, page - 1); i <= Math.min(total_pages - 1, page + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }

      if (page < total_pages - 2) {
        pages.push('...')
      }

      if (!pages.includes(total_pages)) {
        pages.push(total_pages)
      }
    }

    return pages
  }, [pagination])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      {/* Top Header */}
      <TopBar
        title="Riwayat Transaksi"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <div className="flex items-center gap-md">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="hidden sm:flex py-2 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              <span className="hidden md:inline font-medium">Download PDF</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchOrders(pagination.page)}
              className="hidden sm:flex py-2 px-3"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              <span className="hidden md:inline">Refresh</span>
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {/* Total Transactions */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-primary filled-icon">receipt_long</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Total Transaksi</span>
            </div>
            <p className="text-headline-md text-primary font-bold">{pagination.total_items}</p>
            <p className="text-label-sm text-on-surface-variant">dari semua periode</p>
          </div>

          {/* Current Page */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-surface-tint filled-icon">format_list_numbered</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Halaman</span>
            </div>
            <p className="text-headline-md text-surface-tint font-bold">{pagination.page} / {pagination.total_pages || 1}</p>
            <p className="text-label-sm text-on-surface-variant">per halaman: {pagination.limit}</p>
          </div>

          {/* Filter Info */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-secondary filled-icon">filter_list</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Filter Aktif</span>
            </div>
            <p className="text-headline-md text-secondary font-bold">
              {[selectedPaymentMethod && getPaymentMethodLabel(selectedPaymentMethod), dateRange !== 'all' && dateRange.replace('_', ' ')].filter(Boolean).join(', ') || 'Tidak ada'}
            </p>
            <p className="text-label-sm text-on-surface-variant">search: {searchQuery || 'semua'}</p>
          </div>

          {/* Status Info */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-tertiary filled-icon">verified</span>
              <span className="text-label-sm text-on-surface-variant font-medium">Status Filter</span>
            </div>
            <p className="text-headline-md text-tertiary font-bold">{selectedStatus || 'Semua'}</p>
            <p className="text-label-sm text-on-surface-variant">{pagination.total_items} hasil</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-md bg-surface border border-outline-variant rounded-xl p-md">
          <div className="flex flex-col lg:flex-row gap-md lg:items-end">
            {/* Search */}
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice atau pelanggan..."
                icon="search"
                className="w-full"
              />
            </div>

            {/* Payment Method Filter */}
            <div className="w-full lg:w-48">
              <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Metode Bayar</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md font-medium text-on-surface cursor-pointer focus:border-primary outline-none"
              >
                <option value="">Semua Metode</option>
                {getPaymentMethods().map(pm => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-40">
              <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md font-medium text-on-surface cursor-pointer focus:border-primary outline-none"
              >
                <option value="">Semua</option>
                <option value="COMPLETED">Selesai</option>
                <option value="PENDING">Menunggu</option>
                <option value="REFUNDED">DiRefund</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="w-full lg:w-40">
              <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Periode</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md font-medium text-on-surface cursor-pointer focus:border-primary outline-none"
              >
                <option value="today">Hari Ini</option>
                <option value="yesterday">Kemarin</option>
                <option value="week">7 Hari</option>
                <option value="month">30 Hari</option>
                <option value="all">Semua</option>
              </select>
            </div>

            {/* Items per page */}
            <div className="w-full lg:w-32">
              <label className="text-label-sm text-on-surface-variant block mb-xs font-medium">Tampilkan</label>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="w-full px-md py-sm border border-outline-variant bg-surface-container-high rounded-lg text-body-md font-medium text-on-surface cursor-pointer focus:border-primary outline-none"
              >
                <option value="5">5 item</option>
                <option value="10">10 item</option>
                <option value="20">20 item</option>
                <option value="50">50 item</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedPaymentMethod || selectedStatus || dateRange !== 'today') && (
              <Button
                variant="text"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedPaymentMethod('')
                  setSelectedStatus('')
                  setDateRange('today')
                }}
                className="py-2 px-3 text-error"
              >
                <span className="material-symbols-outlined text-[20px]">clear</span>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold w-12">#</th>
                  <th className="p-md font-semibold">Invoice</th>
                  <th className="p-md font-semibold">Tanggal</th>
                  <th className="p-md font-semibold hidden sm:table-cell">Pelanggan</th>
                  <th className="p-md font-semibold hidden md:table-cell">Item</th>
                  <th className="p-md font-semibold">Total</th>
                  <th className="p-md font-semibold hidden lg:table-cell">Metode</th>
                  <th className="p-md font-semibold hidden lg:table-cell">Status</th>
                  <th className="p-md font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-xl text-center text-primary">
                      <div className="flex justify-center items-center gap-sm">
                        <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                        <span className="text-body-lg font-medium">Memuat data transaksi...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-xl text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[48px] block mb-xs">receipt_long</span>
                      <p className="text-body-lg font-medium mb-xs">Belum ada transaksi</p>
                      <p className="text-label-sm">dengan filter yang dipilih</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                      {/* Index */}
                      <td className="p-md text-on-surface-variant font-data-mono">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      {/* Invoice */}
                      <td className="p-md">
                        <span className="font-data-mono text-primary font-semibold">{order.invoice_number}</span>
                      </td>
                      {/* Date */}
                      <td className="p-md">
                        <span className="text-on-surface-variant">{formatDate(order.created_at)}</span>
                      </td>
                      {/* Customer */}
                      <td className="p-md hidden sm:table-cell">
                        <span className="px-3 py-1 bg-surface-container-high border border-outline-variant/30 rounded-full text-label-sm">
                          {order.customer || 'Umum'}
                        </span>
                      </td>
                      {/* Items Count */}
                      <td className="p-md hidden md:table-cell">
                        <span className="text-label-sm text-on-surface-variant">
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      {/* Total */}
                      <td className="p-md">
                        <span className="font-semibold">{formatPrice(order.total)}</span>
                      </td>
                      {/* Payment Method */}
                      <td className="p-md hidden lg:table-cell">
                        <div className="flex items-center gap-xs" title={getSplitSummary(order) || ''}>
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                            {getPaymentMethodIcon(order.payment_method)}
                          </span>
                          <span className="text-label-sm">{getPaymentMethodLabel(order.payment_method)}</span>
                        </div>
                        {order.payment_method === 'SPLIT' && getSplitSummary(order) && (
                          <p className="text-label-xs text-on-surface-variant mt-0.5">{getSplitSummary(order)}</p>
                        )}
                      </td>
                      {/* Status */}
                      <td className="p-md hidden lg:table-cell">
                        <span className={`px-3 py-1 rounded-full text-label-sm border ${getStatusColor(order.order_status || order.payment_status)}`}>
                          {getStatusLabel(order.order_status || order.payment_status)}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="p-md text-center">
                        <div className="flex items-center justify-center gap-xs">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(order)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer"
                            title="Lihat Detail"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(order)}
                            className="p-2 text-secondary hover:bg-secondary/10 rounded-full cursor-pointer"
                            title="Cetak Struk"
                          >
                            <span className="material-symbols-outlined text-[20px]">print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div className="px-md py-md border-t border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-md">
              <div className="text-body-sm text-on-surface-variant">
                Menampilkan <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> -
                <span className="font-semibold"> {Math.min(pagination.page * pagination.limit, pagination.total_items)}</span> dari
                <span className="font-semibold"> {pagination.total_items}</span> transaksi
              </div>

              <div className="flex items-center gap-xs">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Halaman Pertama"
                >
                  <span className="material-symbols-outlined text-[18px]">first_page</span>
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((pageNum, idx) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-on-surface-variant">...</span>
                  ) : (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[36px] h-9 px-2 rounded-lg border transition-colors cursor-pointer ${
                        pagination.page === pageNum
                          ? 'bg-primary text-on-primary border-primary'
                          : 'border-outline-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.total_pages)}
                  disabled={pagination.page === pagination.total_pages}
                  className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Halaman Terakhir"
                >
                  <span className="material-symbols-outlined text-[18px]">last_page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up border border-outline-variant/30">
            {/* Modal Header */}
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="text-headline-md font-semibold text-on-surface">Detail Transaksi</h3>
                <p className="text-label-sm text-on-surface-variant font-data-mono">{selectedOrder.invoice_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-lg bg-surface">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-md mb-lg">
                <div className="bg-surface-container-low rounded-lg p-md">
                  <span className="text-label-sm text-on-surface-variant block mb-xs">Tanggal & Waktu</span>
                  <span className="text-body-md font-medium">{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-md">
                  <span className="text-label-sm text-on-surface-variant block mb-xs">Kasir</span>
                  <span className="text-body-md font-medium">{selectedOrder.cashier || 'Admin'}</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-md">
                  <span className="text-label-sm text-on-surface-variant block mb-xs">Pelanggan</span>
                  <span className="text-body-md font-medium">{selectedOrder.customer || 'Umum'}</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-md">
                  <span className="text-label-sm text-on-surface-variant block mb-xs">Metode Bayar</span>
                  <div className="flex items-center gap-xs mt-xs">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      {getPaymentMethodIcon(selectedOrder.payment_method)}
                    </span>
                    <span className="text-body-md font-medium">{getPaymentMethodLabel(selectedOrder.payment_method)}</span>
                  </div>
                  {selectedOrder.payment_method === 'SPLIT' && selectedOrder.split_payments?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedOrder.split_payments.filter(sp => sp.amount > 0).map((sp, i) => (
                        <div key={i} className="flex justify-between text-label-sm pl-6">
                          <span className="text-on-surface-variant">{getPaymentMethodLabel(sp.method)}</span>
                          <span className="font-medium text-on-surface">{formatPrice(sp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-surface-container-low rounded-xl overflow-hidden mb-lg">
                <div className="p-md border-b border-outline-variant bg-surface-container-highest">
                  <h4 className="text-label-lg font-semibold text-on-surface">Item Pembelian</h4>
                </div>
                <div className="divide-y divide-surface-variant">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-md">
                      <div className="flex-1">
                        <p className="text-body-md font-medium text-on-surface">{item.product_name || item.name}</p>
                        {item.variation_name && (
                          <p className="text-label-sm text-on-surface-variant">{item.variation_name}</p>
                        )}
                        <p className="text-label-sm text-on-surface-variant">
                          {(item.quantity || 0)} x {formatPrice(item.price || 0)}
                        </p>
                      </div>
                      <span className="text-body-md font-semibold text-on-surface">
                        {formatPrice((item.price || 0) * (item.quantity || 0))}
                      </span>
                    </div>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <div className="p-md text-center text-on-surface-variant">
                      Tidak ada item
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-surface-container-low rounded-xl p-md space-y-sm">
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-body-md text-on-surface-variant">
                  <span>Pajak (10%)</span>
                  <span>{formatPrice(selectedOrder.tax || 0)}</span>
                </div>
                {(selectedOrder.discount || 0) > 0 && (
                  <div className="flex justify-between text-body-md text-green-600">
                    <span>Diskon Manual</span>
                    <span>-{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                {(selectedOrder.promo_discount || 0) > 0 && (
                  <div className="flex justify-between text-body-md text-amber-600">
                    <span>Promo Diskon</span>
                    <span>-{formatPrice(selectedOrder.promo_discount)}</span>
                  </div>
                )}
                <div className="border-t border-outline-variant pt-sm mt-sm flex justify-between items-end">
                  <span className="text-body-lg font-semibold text-on-surface">Total Bayar</span>
                  <span className="text-headline-md text-primary font-bold">
                    {formatPrice(selectedOrder.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-md border-t border-outline-variant flex justify-end gap-md bg-surface-container-lowest">
              <Button
                variant="outline"
                onClick={() => handlePrintReceipt(selectedOrder)}
              >
                <span className="material-symbols-outlined">print</span>
                Cetak Struk
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
