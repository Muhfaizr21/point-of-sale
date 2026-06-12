import React from 'react'
import { Button } from './common/Button'

export function CartSidebar({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  subtotal,
  tax,
  total,
  isOpen,
  onClose,
  onCheckout,
  isCheckingOut,
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
      {/* Backdrop for mobile view */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Cart container */}
      <aside
        className={`fixed right-0 top-0 h-full w-cart-width bg-surface border-l-4 border-primary z-50 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out lg:z-40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cart Header */}
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest h-[72px]">
          <div className="flex items-center gap-sm">
            {/* Close button for mobile drawer */}
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

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-md space-y-sm hide-scrollbar bg-surface-container-lowest">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-sm">
              <span className="material-symbols-outlined text-[48px]">shopping_cart</span>
              <p className="text-body-md font-medium">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-sm border-b border-surface-variant">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-body-md text-on-surface font-medium truncate">{item.name}</h4>
                  <span className="text-label-sm text-on-surface-variant">{formatPrice(item.price)}</span>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(item.id)}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span className="text-body-lg font-medium w-6 text-center font-data-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddToCart(item)}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>

                {/* Item Total Price */}
                <div className="w-24 text-right">
                  <span className="text-body-lg text-on-surface font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Actions */}
        <div className="p-md bg-surface border-t border-outline-variant">
          <div className="space-y-2 mb-md">
            <div className="flex justify-between text-body-md text-on-surface-variant">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-body-md text-on-surface-variant">
              <span>Pajak (10%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="border-t border-outline-variant pt-2 mt-2 flex justify-between items-end">
              <span className="text-body-lg font-medium text-on-surface">Total</span>
              <span className="text-display-total text-primary font-bold">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
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
                    const result = await onCheckout('CASH')
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
