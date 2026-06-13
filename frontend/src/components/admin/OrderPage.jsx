import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { TopBar } from '../common/TopBar'
import { orderService } from '../../services/orderService'

const STATUS_COLORS = {
  'COMPLETED': 'bg-primary-container text-on-primary-container',
  'DIKEMAS': 'bg-secondary-container text-on-secondary-container',
  'DIKIRIM': 'bg-tertiary-container text-on-tertiary-container',
  'SELESAI': 'bg-primary-container text-on-primary-container',
}

export function OrderPage({ onToggleSidebar }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [limit, setLimit] = useState(10)

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [notesForm, setNotesForm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await orderService.getOrders({
        page,
        limit,
        search: searchQuery,
        status: statusFilter,
        dateFrom,
        dateTo
      })
      if (response && response.data) {
        setOrders(response.data)
        setTotalPages(response.pagination?.total_pages || 1)
        setTotalItems(response.pagination?.total_items || 0)
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchQuery, statusFilter, dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])
  
  // Reset page when filters change
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter, dateFrom, dateTo, limit])

  const openNotesModal = (order) => {
    setSelectedOrder(order)
    setNotesForm(order.notes || '')
    setIsNotesModalOpen(true)
  }

  const handleSaveNotes = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return
    setIsSubmitting(true)
    try {
      await orderService.updateOrder(selectedOrder.id, { notes: notesForm })
      await fetchData()
      setIsNotesModalOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (orderId, currentStatus, targetStatus) => {
    try {
      await orderService.updateOrder(orderId, { order_status: targetStatus })
      await fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number);
  }

  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup diblokir oleh browser. Izinkan popup untuk mencetak surat jalan.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Surat Jalan - ${order.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .details div { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background-color: #f9f9f9; }
            .footer { margin-top: 40px; text-align: right; }
            .notes { margin-top: 20px; padding: 10px; border: 1px dashed #ccc; background-color: #fcfcfc; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature div { text-align: center; width: 200px; }
            .line { border-bottom: 1px solid #333; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SURAT JALAN</h2>
            <p>No: ${order.invoice_number}</p>
          </div>
          
          <div class="details">
            <div>
              <strong>Tujuan:</strong><br/>
              Nama: ${order.customer || 'Umum'}<br/>
            </div>
            <div style="text-align: right;">
              <strong>Tanggal:</strong> ${new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}<br/>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Barang</th>
                <th>Jumlah</th>
                <th>Catatan Item</th>
              </tr>
            </thead>
            <tbody>
              ${order.items ? order.items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.product_name} ${item.variation_name ? `(${item.variation_name})` : ''}</td>
                  <td>${item.quantity}</td>
                  <td>-</td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align:center;">Tidak ada item</td></tr>'}
            </tbody>
          </table>

          ${order.notes ? `
            <div class="notes">
              <strong>Catatan Pesanan:</strong><br/>
              ${order.notes}
            </div>
          ` : ''}

          <div class="signature">
            <div>
              <p>Penerima,</p>
              <div class="line"></div>
              <p>( .................... )</p>
            </div>
            <div>
              <p>Pengirim,</p>
              <div class="line"></div>
              <p>( .................... )</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Slight delay to ensure content loads before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      <TopBar
        title="Pesanan"
        onToggleSidebar={onToggleSidebar}
      />

      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        <div className="mb-md flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
            <div className="w-full sm:w-64 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari invoice/customer..." className="w-full pl-10 pr-4 py-2 border border-outline-variant bg-surface rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
            </div>
            
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-outline-variant bg-surface rounded-lg text-body-md text-on-surface outline-none cursor-pointer">
              <option value="">Semua Status</option>
              <option value="COMPLETED">Selesai (POS)</option>
              <option value="DIKEMAS">Dikemas</option>
              <option value="DIKIRIM">Dikirim</option>
              <option value="SELESAI">Selesai</option>
            </select>

            <div className="flex gap-2 items-center">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-outline-variant bg-surface rounded-lg text-body-md text-on-surface outline-none" />
              <span className="text-on-surface-variant">-</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-outline-variant bg-surface rounded-lg text-body-md text-on-surface outline-none" />
            </div>

            <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="px-4 py-2 border border-outline-variant bg-surface rounded-lg text-body-md text-on-surface outline-none cursor-pointer">
              <option value="5">Tampilkan 5</option>
              <option value="10">Tampilkan 10</option>
              <option value="20">Tampilkan 20</option>
              <option value="50">Tampilkan 50</option>
              <option value="100">Tampilkan 100</option>
            </select>
          </div>
          
          <span className="text-label-sm text-on-surface-variant shrink-0">{totalItems} pesanan</span>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold">No. Invoice & Tanggal</th>
                  <th className="p-md font-semibold">Customer</th>
                  <th className="p-md font-semibold">Detail</th>
                  <th className="p-md font-semibold">Total</th>
                  <th className="p-md font-semibold">Status & Aksi</th>
                  <th className="p-md font-semibold text-right w-24">Lainnya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr><td colSpan="6" className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="6" className="p-xl text-center text-on-surface-variant">Tidak ada data pesanan.</td></tr>
                ) : orders.map(order => (
                  <tr key={order.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                    <td className="p-md align-top">
                      <div className="font-semibold text-primary">{order.invoice_number}</div>
                      <div className="text-label-sm text-on-surface-variant mt-1">
                        {new Date(order.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-md font-medium align-top">{order.customer || 'Umum'}</td>
                    <td className="p-md text-label-sm align-top">
                      <ul className="list-disc pl-4 space-y-1 text-on-surface-variant">
                        {order.items?.map((item, idx) => (
                          <li key={idx}>{item.product_name} {item.variation_name ? `(${item.variation_name})` : ''} x{item.quantity}</li>
                        ))}
                      </ul>
                      {order.notes && (
                        <div className="mt-2 p-2 bg-surface-variant rounded-md text-xs italic text-on-surface">
                          " {order.notes} "
                        </div>
                      )}
                    </td>
                    <td className="p-md align-top">
                      <div className="font-bold">{formatRupiah(order.total)}</div>
                      <div className="text-[10px] text-on-surface-variant uppercase mt-1">{order.payment_method}</div>
                    </td>
                    <td className="p-md align-top">
                      <div className="flex flex-col gap-2">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full w-max uppercase ${STATUS_COLORS[order.order_status?.toUpperCase()] || 'bg-surface-variant text-on-surface-variant'}`}>
                          {order.order_status || 'COMPLETED'}
                        </span>
                        
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-body-sm hover:text-primary">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded text-primary border-outline accent-primary cursor-pointer"
                              checked={order.order_status === 'DIKIRIM' || order.order_status === 'SELESAI'}
                              onChange={(e) => handleStatusChange(order.id, order.order_status, e.target.checked ? 'DIKIRIM' : 'COMPLETED')}
                            />
                            <span>Tandai Dikirim</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-body-sm hover:text-primary">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded text-primary border-outline accent-primary cursor-pointer"
                              checked={order.order_status === 'SELESAI'}
                              onChange={(e) => handleStatusChange(order.id, order.order_status, e.target.checked ? 'SELESAI' : 'DIKIRIM')}
                            />
                            <span>Tandai Selesai</span>
                          </label>
                        </div>
                      </div>
                    </td>
                    <td className="p-md text-right align-top whitespace-nowrap">
                      <button type="button" onClick={() => openNotesModal(order)} className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer mr-1" title="Catatan">
                        <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
                      </button>
                      <button type="button" onClick={() => handlePrint(order)} className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer" title="Print Surat Jalan">
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalItems > 0 && (
          <div className="mt-md flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">Menampilkan {((page-1)*limit)+1}-{Math.min(page*limit, totalItems)} dari {totalItems}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest disabled:opacity-50 cursor-pointer"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
              {Array.from({length: totalPages}).map((_, i) => { 
                const p = i+1; 
                if (p===1||p===totalPages||(p>=page-1&&p<=page+1)) return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-body-sm font-bold cursor-pointer ${page===p?'bg-primary text-on-primary':'text-on-surface hover:bg-surface-container-highest'}`}>{p}</button>; 
                if (p===page-2||p===page+2) return <span key={p} className="text-on-surface-variant px-1">...</span>; 
                return null 
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest disabled:opacity-50 cursor-pointer"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
            </div>
          </div>
        )}
      </div>

      {isNotesModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 backdrop-blur-md animate-fade-in" onClick={() => setIsNotesModalOpen(false)}>
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-outline-variant/30" onClick={e => e.stopPropagation()}>
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface">Catatan Pesanan</h3>
              <button type="button" onClick={() => setIsNotesModalOpen(false)} className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-lg bg-surface">
              <div className="text-body-sm text-on-surface-variant mb-4">
                Invoice: <strong className="text-on-surface">{selectedOrder.invoice_number}</strong><br/>
                Customer: <strong className="text-on-surface">{selectedOrder.customer}</strong>
              </div>
              <form id="notesForm" onSubmit={handleSaveNotes}>
                <textarea 
                  value={notesForm} 
                  onChange={e => setNotesForm(e.target.value)} 
                  placeholder="Tambahkan catatan khusus untuk pesanan ini..." 
                  rows={4} 
                  className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high rounded-lg text-body-md outline-none resize-none focus:border-primary focus:ring-1 focus:ring-primary" 
                />
              </form>
            </div>
            <div className="p-md border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
              <button type="button" onClick={() => setIsNotesModalOpen(false)} className="py-2 px-4 rounded-xl font-semibold text-primary hover:bg-primary/10 cursor-pointer transition-colors">Batal</button>
              <button type="submit" form="notesForm" disabled={isSubmitting} className="py-2 px-4 rounded-xl bg-primary text-on-primary hover:bg-surface-tint font-semibold cursor-pointer disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
