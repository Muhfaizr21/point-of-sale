import React from 'react'
import { Button } from './common/Button'

const PAYMENT_METHODS = [
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
  total,
  isOpen,
  onClose,
  onCheckout,
  isCheckingOut,
  customerName,
  onCustomerNameChange,
  discount,
  onDiscountChange,
  paymentMethod,
  onPaymentMethodChange,
}) {
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
                  <div className="flex items-center gap-sm">
                    <span className="text-label-sm text-on-surface-variant shrink-0">Diskon</span>
                    <div className="flex items-center gap-1">
                      <span className="text-label-sm text-on-surface-variant">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={discount || ''}
                        onChange={(e) => onDiscountChange(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="w-24 px-sm py-2 border border-outline-variant rounded-md text-body-sm text-on-surface bg-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0 outline-none text-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              {cart.map((item) => (
                <div key={`${item.id}-${item.variation_name || ''}`} className="flex justify-between items-center py-sm border-b border-surface-variant">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-body-md text-on-surface font-medium truncate">{item.name}</h4>
                    {item.variation_name && (
                      <span className="text-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded-sm mr-2">{item.variation_name}</span>
                    )}
                    <span className="text-label-sm text-on-surface-variant">{formatPrice(item.price)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onRemoveFromCart(item.id, item.variation_name)}
                      className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="text-body-lg font-medium w-6 text-center font-data-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddToCart(item, item.variation_name)}
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
              <p className="text-label-sm text-on-surface-variant mb-sm">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-sm">
                {PAYMENT_METHODS.map((pm) => {
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
                <span>Diskon</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-outline-variant pt-1 mt-1 flex justify-between items-end">
              <span className="text-body-lg font-medium text-on-surface">Total</span>
              <span className="text-display-total text-primary font-bold">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-md mt-md">
            <Button
              variant="outline"
              onClick={onClearCart}
              disabled={cart.length === 0}
              className="flex-1 py-3"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (cart.length > 0) {
                  try {
                    const result = await onCheckout()
                    window.dispatchEvent(new CustomEvent('checkout-success', { detail: result }))
                    alert(`Pembayaran Sukses!\nNo. Invoice: ${result.invoice_number}\nTotal Bayar: ${formatPrice(result.total)}`)
                    onClose()
                  } catch (err) {
                    alert(`Gagal memproses pembayaran: ${err.message}`)
                  }
                }
              }}
              disabled={cart.length === 0 || isCheckingOut}
              className="flex-[2] py-3"
            >
              <span className={`material-symbols-outlined ${isCheckingOut ? 'animate-spin' : ''}`}>
                {isCheckingOut ? 'sync' : 'payments'}
              </span>
              {isCheckingOut ? 'Memproses...' : 'Bayar'}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
