import React, { useMemo, useState } from 'react'
import { Button } from '../common/Button'

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
  { value: 'CARD', label: 'Kartu', icon: 'credit_card' },
  { value: 'E_WALLET', label: 'E-Wallet', icon: 'wallet' },
]

export function CartSidebar({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  subtotal,
  discountAmount,
  isOpen,
  onClose,
  onCheckout,
  isCheckingOut,
  customerName,
  onCustomerNameChange,
  notes,
  onNotesChange,
  discount,
  onDiscountChange,
  paymentMethod,
  onPaymentMethodChange,
  splitMode,
  onSplitModeChange,
  splitPayments,
  onSplitPaymentsChange,
  activePromos,
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutSuccessData, setCheckoutSuccessData] = useState(null)
  const paymentMethods = useMemo(() => getPaymentMethods(), [])
  const splitMethods = useMemo(() => getPaymentMethods(), [])

  // #8: Promo dihitung server-side — frontend tidak estimasi
  const taxSettings = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem('taxSettings') || '{}')
      return {
        ppn: t.ppn_enabled ? (t.ppn_rate || 11) : 0,
        svc: t.service_charge_enabled ? (t.service_charge_rate || 5) : 0,
        rounding: t.rounding || false,
      }
    } catch { return { ppn: 0, svc: 0, rounding: false } }
  }, [])
  const estimatedTax = Math.floor((subtotal - discountAmount) * taxSettings.ppn / 100)
  const estimatedSvc = Math.floor((subtotal - discountAmount) * taxSettings.svc / 100)
  const beforeRound = subtotal - discountAmount + estimatedTax + estimatedSvc
  const roundingAmount = taxSettings.rounding && beforeRound > 0 ? (beforeRound % 100 >= 50 ? 100 - beforeRound % 100 : -(beforeRound % 100)) : 0
  const displayTotal = Math.max(0, beforeRound + roundingAmount)

  const formatPrice = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('IDR', 'Rp')
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed right-0 top-0 h-full w-cart-width bg-surface border-l-4 border-primary z-50 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out lg:z-40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest h-[72px]">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest cursor-pointer"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <h2 className="text-headline-md text-on-surface font-semibold">Pesanan Saat Ini</h2>
          </div>
          {cart.length > 0 && (
            <button
              aria-label="Kosongkan Keranjang"
              onClick={onClearCart}
              className="text-on-surface-variant hover:text-error transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">delete_sweep</span>
            </button>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-md space-y-sm hide-scrollbar bg-surface-container-lowest">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-sm">
              <span className="material-symbols-outlined text-[48px]">shopping_cart</span>
              <p className="text-body-md font-medium">Keranjang masih kosong</p>
            </div>
          ) : (
            <>
              {/* Customer & Discount */}
              {cart.length > 0 && (
                <div className="space-y-sm mb-md p-sm bg-surface-container-high rounded-lg">
                  <input
                    type="text"
                    placeholder="Nama pelanggan (opsional)"
                    value={customerName}
                    onChange={(e) => onCustomerNameChange(e.target.value)}
                    className="w-full px-sm py-2 border border-outline-variant rounded-md text-body-sm text-on-surface bg-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0 outline-none"
                  />
                  <textarea
                    placeholder="Catatan pesanan (opsional)"
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    rows="2"
                    className="w-full px-sm py-2 border border-outline-variant rounded-md text-body-sm text-on-surface bg-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0 outline-none resize-none"
                  ></textarea>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-label-sm font-semibold text-on-surface-variant px-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">percent</span> Diskon Manual
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-0 inset-y-0 flex items-center justify-center w-10 bg-surface-container border border-r-0 border-outline-variant rounded-l-lg pointer-events-none">
                        <span className="text-body-sm font-bold text-on-surface-variant">Rp</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={discount || ''}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0)
                          onDiscountChange(Math.min(val, Math.floor(subtotal / 2)))
                        }}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-2 border border-outline-variant rounded-lg text-body-md font-semibold text-on-surface bg-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {cart.map((item) => (
                <div key={`${item.id}-${item.variation_name || ''}`} className="flex justify-between items-center py-sm border-b border-surface-variant">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-body-md text-on-surface font-medium truncate">{item.name}</h4>
                    {item._bundle && (
                      <span className="text-label-sm text-surface-tint bg-surface-tint/10 px-2 py-0.5 rounded-sm mr-2 font-semibold">Paket</span>
                    )}
                    {item.variation_name && !item._bundle && (
                      <span className="text-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded-sm mr-2">{item.variation_name}</span>
                    )}
                    <span className="text-label-sm text-on-surface-variant">{formatPrice(item.price)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onRemoveFromCart(item._bundle ? item._bundleId : item.id, item.variation_name)}
                      className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="text-body-lg font-medium w-6 text-center font-data-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddToCart(item._bundle ? { _bundle: true, _bundleId: item._bundleId, bundleName: item.bundleName, name: item.name, price: item.price } : item, item.variation_name)}
                      className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-body-lg text-on-surface font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Summary & Actions */}
        <div className="p-md bg-surface border-t border-outline-variant">
          {/* Payment Method */}
          {cart.length > 0 && (
            <div className="mb-md">
              <div className="flex items-center justify-between mb-sm">
                <p className="text-label-sm text-on-surface-variant">Metode Pembayaran</p>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="text-label-xs text-on-surface-variant">Split</span>
                  <input
                    type="checkbox"
                    checked={splitMode}
                    onChange={(e) => {
                      onSplitModeChange(e.target.checked)
                      if (!e.target.checked) onSplitPaymentsChange([])
                    }}
                    className="w-3.5 h-3.5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                  />
                </label>
              </div>

              {splitMode ? (
                <div className="space-y-2">
                  {splitPayments.map((sp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={sp.method}
                        onChange={(e) => {
                          const next = [...splitPayments]
                          next[i].method = e.target.value
                          onSplitPaymentsChange(next)
                        }}
                        className="flex-1 px-2 py-1.5 border border-outline-variant rounded-lg text-body-sm bg-surface cursor-pointer outline-none"
                      >
                        {splitMethods.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={sp.amount ? sp.amount.toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          const next = [...splitPayments]
                          const newAmount = Math.max(0, parseInt(raw) || 0)
                          const othersSum = next.reduce((sum, p, idx) => idx === i ? sum : sum + (p.amount || 0), 0)
                          next[i].amount = Math.max(0, Math.min(newAmount, displayTotal - othersSum))
                          onSplitPaymentsChange(next)
                        }}
                        placeholder="0"
                        className="w-24 px-2 py-1.5 border border-outline-variant rounded-lg text-body-sm bg-surface text-right outline-none"
                      />
                      {splitPayments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onSplitPaymentsChange(splitPayments.filter((_, idx) => idx !== i))}
                          className="p-1 text-error hover:bg-error/10 rounded cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                      {i === splitPayments.length - 1 && (
                        <button
                          type="button"
                          onClick={() => onSplitPaymentsChange([...splitPayments, { method: 'CASH', amount: 0 }])}
                          className="p-1 text-primary hover:bg-primary/10 rounded cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {splitPayments.length === 0 && (
                    <button
                      type="button"
                      onClick={() => onSplitPaymentsChange([{ method: 'CASH', amount: 0 }, { method: 'E_WALLET', amount: 0 }])}
                      className="w-full py-1.5 border border-dashed border-outline-variant rounded-lg text-label-sm text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      + Tambah Split Pembayaran
                    </button>
                  )}
                  {splitPayments.length > 0 && (
                    <div className="flex justify-between text-label-xs text-on-surface-variant pt-1">
                      <span>Sisa: {formatPrice(displayTotal - splitPayments.reduce((s, p) => s + (p.amount || 0), 0))}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-sm">
                  {paymentMethods.map((pm) => {
                    const active = paymentMethod === pm.value
                    return (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => onPaymentMethodChange(pm.value)}
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 transition-all cursor-pointer ${
                          active
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-outline hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{pm.icon}</span>
                        <span className="text-label-sm font-medium">{pm.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* #8: Promo info — tanpa estimasi harga */}
          {activePromos?.length > 0 && (
            <div className="mb-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
              <p className="text-label-xs font-semibold text-amber-800 flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-[14px]">local_offer</span>
                Promo Aktif (otomatis saat checkout)
              </p>
              {activePromos.map(p => {
                const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
                const dayList = p.day_of_week ? p.day_of_week.split(',').map(d => days[parseInt(d)]).filter(Boolean) : []
                return (
                  <div key={p.id} className="text-label-xs text-amber-700 ml-3 py-0.5 border-b border-amber-100 last:border-0">
                    <span className="font-semibold">{p.name}</span>
                    <div className="flex flex-wrap gap-x-2">
                      <span>{p.type === 'PERCENT' ? `${p.value}%` : p.type === 'NOMINAL' ? `Rp${(p.value||0).toLocaleString('id-ID')}` : `Beli ${p.buy_qty} Gratis ${p.free_qty}`}</span>
                      {dayList.length > 0 && <span>{dayList.join(',')}</span>}
                      {p.time_start && p.time_end && <span>{p.time_start}-{p.time_end}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Receipt Summary */}
          <div className="space-y-1 mb-md bg-surface-container-lowest rounded-lg p-sm border border-outline-variant/30">
            <div className="flex justify-between text-body-sm text-on-surface-variant">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-body-sm text-green-600">
                <span>Diskon Manual</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            {estimatedTax > 0 && (
              <div className="flex justify-between text-body-sm text-on-surface-variant">
                <span>PPN {taxSettings.ppn}%</span>
                <span>{formatPrice(estimatedTax)}</span>
              </div>
            )}
            {estimatedSvc > 0 && (
              <div className="flex justify-between text-body-sm text-on-surface-variant">
                <span>Service Charge {taxSettings.svc}%</span>
                <span>{formatPrice(estimatedSvc)}</span>
              </div>
            )}
            {roundingAmount !== 0 && (
              <div className="flex justify-between text-body-sm text-indigo-500">
                <span>Pembulatan</span>
                <span>{formatPrice(roundingAmount)}</span>
              </div>
            )}
            {/* Promo diskon dihitung server-side, tidak tampil di estimasi */}
            {splitMode && splitPayments.filter(s => s.amount > 0).length > 0 && (
              <div className="border-t border-outline-variant/30 pt-1 mt-1 space-y-0.5">
                {splitPayments.filter(s => s.amount > 0).map((sp, i) => (
                  <div key={i} className="flex justify-between text-label-sm">
                    <span className="text-on-surface-variant">{splitMethods.find(m => m.value === sp.method)?.label || sp.method}</span>
                    <span className="font-medium text-on-surface">{formatPrice(sp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-outline-variant pt-1 mt-1 flex justify-between items-end">
              <span className="text-body-lg font-medium text-on-surface">Total</span>
              <span className="text-display-total text-primary font-bold">
                {formatPrice(displayTotal)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-md mt-md">
            <Button
              variant="outline"
              onClick={onClearCart}
              disabled={cart.length === 0 || isProcessing}
              className="flex-1 py-3"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (cart.length > 0) {
                  setIsProcessing(true)
                  try {
                    const result = await onCheckout()
                    window.dispatchEvent(new CustomEvent('checkout-success', { detail: result }))
                    setCheckoutSuccessData(result)
                  } catch (err) {
                    alert(`Gagal memproses pembayaran: ${err.message}`)
                  } finally {
                    setIsProcessing(false)
                  }
                }
              }}
              disabled={cart.length === 0 || isCheckingOut || isProcessing}
              className="flex-[2] py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {(isCheckingOut || isProcessing) ? (
                <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span><span>Memproses...</span></>
              ) : (
                <><span className="material-symbols-outlined text-[20px]">payments</span><span>Bayar</span></>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Modern & Premium Success Modal */}
      {checkoutSuccessData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col p-lg text-on-surface animate-slide-up">
            {/* Header / Success Indicator */}
            <div className="flex flex-col items-center text-center mb-md">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400 mb-md animate-bounce">
                <span className="material-symbols-outlined text-[40px] font-bold filled-icon">check_circle</span>
              </div>
              <h2 className="text-headline-md font-bold text-green-600 dark:text-green-400">Pembayaran Berhasil!</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Transaksi Anda telah selesai diproses.</p>
            </div>

            {/* Receipt Paper Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-md shadow-sm relative overflow-hidden mb-lg">
              {/* Top Receipt Decorative Cutouts */}
              <div className="absolute top-0 left-0 right-0 h-1.5 flex justify-between px-2 overflow-hidden opacity-30">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-on-surface rounded-full -translate-y-1" />
                ))}
              </div>

              <div className="pt-2 text-center">
                <p className="text-body-lg font-bold text-primary tracking-wide">{(localStorage.getItem('storeName') || 'PEKALIPAN').toUpperCase()}</p>
                <p className="text-label-xs text-on-surface-variant mt-0.5">{localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon'}</p>
              </div>

              {/* Dotted Line */}
              <div className="border-b border-dashed border-outline-variant my-md" />

              {/* Meta Info */}
              <div className="space-y-1 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">No. Invoice</span>
                  <span className="font-semibold text-on-surface font-data-mono">{checkoutSuccessData.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Tanggal</span>
                  <span className="text-on-surface">{new Date(checkoutSuccessData.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Kasir</span>
                  <span className="text-on-surface font-medium">{checkoutSuccessData.cashier || 'Kasir'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Pelanggan</span>
                  <span className="text-on-surface font-medium">{checkoutSuccessData.customer || 'Umum'}</span>
                </div>
              </div>

              {/* Dotted Line */}
              <div className="border-b border-dashed border-outline-variant my-md" />

              {/* Item List */}
              <div className="max-h-36 overflow-y-auto pr-1 space-y-2 mb-md hide-scrollbar">
                {(checkoutSuccessData.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-body-sm">
                    <div className="flex-1 pr-4">
                      <p className="text-on-surface font-medium">{item.product_name || item.name}</p>
                      {item.variation_name && (
                        <p className="text-label-xs text-on-surface-variant">Var: {item.variation_name}</p>
                      )}
                      <p className="text-label-xs text-on-surface-variant">{item.quantity} x {formatPrice(item.price)}</p>
                    </div>
                    <span className="font-semibold text-on-surface text-right shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Dotted Line */}
              <div className="border-b border-dashed border-outline-variant my-md" />

              {/* Price Breakdown */}
              <div className="space-y-1 text-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>{formatPrice(checkoutSuccessData.subtotal)}</span>
                </div>
                {checkoutSuccessData.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Manual</span>
                    <span>-{formatPrice(checkoutSuccessData.discount)}</span>
                  </div>
                )}
                {checkoutSuccessData.promo_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Diskon</span>
                    <span>-{formatPrice(checkoutSuccessData.promo_discount)}</span>
                  </div>
                )}
                {checkoutSuccessData.tax > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Pajak ({checkoutSuccessData.tax_rate || 10}%)</span>
                    <span>{formatPrice(checkoutSuccessData.tax)}</span>
                  </div>
                )}
                {checkoutSuccessData.service_charge > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Service Charge</span>
                    <span>{formatPrice(checkoutSuccessData.service_charge)}</span>
                  </div>
                )}
                {checkoutSuccessData.rounding_diff !== 0 && (
                  <div className="flex justify-between text-indigo-500">
                    <span>Pembulatan</span>
                    <span>{formatPrice(checkoutSuccessData.rounding_diff)}</span>
                  </div>
                )}
                <div className="border-t border-outline-variant pt-2 mt-2 flex justify-between items-end">
                  <span className="text-body-md font-bold text-on-surface">TOTAL</span>
                  <span className="text-body-lg font-bold text-primary">{formatPrice(checkoutSuccessData.total)}</span>
                </div>
                <div className="flex justify-between text-label-xs text-on-surface-variant mt-2 pt-1 border-t border-outline-variant/30">
                  <span>Metode Pembayaran</span>
                  <span className="font-bold uppercase text-primary">
                    {paymentMethods.find(m => m.value === checkoutSuccessData.payment_method)?.label || checkoutSuccessData.payment_method}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-md">
              <button
                type="button"
                onClick={() => {
                  const centerText = (text, width = 37) => {
                    if (!text) return ''
                    const len = text.length
                    if (len >= width) return text.substring(0, width)
                    const leftPad = Math.floor((width - len) / 2)
                    return ' '.repeat(leftPad) + text
                  }
                  const storeName = (localStorage.getItem('storeName') || 'PEKALIPAN').toUpperCase()
                  const storeAddress = localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon'
                  const storePhone = localStorage.getItem('storePhone') || '081234567890'
                  const receiptFooter = localStorage.getItem('receiptFooter') || 'Terima Kasih atas Kunjungan Anda'

                  const printContent = `
=====================================
${centerText(storeName)}
${centerText(storeAddress)}
${centerText('Telp: ' + storePhone)}
=====================================
Invoice  : ${checkoutSuccessData.invoice_number}
Tanggal  : ${new Date(checkoutSuccessData.created_at).toLocaleString('id-ID')}
Kasir    : ${checkoutSuccessData.cashier || 'Admin'}
-------------------------------------
Pelanggan: ${checkoutSuccessData.customer || 'Umum'}
-------------------------------------
ITEM                QTY    HARGA
${(checkoutSuccessData.items || []).map(item =>
  `${(item.product_name || item.name || '').padEnd(18)} ${(item.quantity || 0).toString().padStart(3)} ${formatPrice(item.price || 0).padStart(10)}`
).join('\n')}
-------------------------------------
Subtotal           ${formatPrice(checkoutSuccessData.subtotal || 0)}
Pajak              ${formatPrice(checkoutSuccessData.tax || 0)}
Diskon Manual      ${formatPrice(checkoutSuccessData.discount || 0)}
Promo Diskon       ${formatPrice(checkoutSuccessData.promo_discount || 0)}
=====================================
TOTAL              ${formatPrice(checkoutSuccessData.total || 0)}
Bayar (${checkoutSuccessData.payment_method})
=====================================
${centerText(receiptFooter)}
=====================================
                  `
                  const printWindow = window.open('', '_blank', 'width=320,height=600')
                  if (printWindow) {
                    printWindow.document.write(`<!DOCTYPE html><html><head><title>Cetak Struk</title><style>
                      body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
                      pre { white-space: pre; font-family: 'Courier New', monospace; font-size: 12px; }
                      @media print { @page { margin: 0; } body { padding: 0; } }
                    </style></head><body><pre>${printContent}</pre><script>window.print();window.close();</script></body></html>`)
                    printWindow.document.close()
                  } else {
                    window.print()
                  }
                }}
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl text-body-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">print</span>
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckoutSuccessData(null)
                  onClose()
                }}
                className="flex-1 py-3 px-4 bg-primary text-on-primary hover:bg-primary/95 rounded-xl text-body-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
