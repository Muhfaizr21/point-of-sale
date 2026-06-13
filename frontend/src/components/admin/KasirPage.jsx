import React, { useState } from 'react'
import { Header } from './Header'
import { ProductCard } from './ProductCard'
import { CartSidebar } from './CartSidebar'
import { Footer } from './Footer'

export function KasirPage({
  searchQuery, onSearchChange,
  categories, selectedCategory, onCategorySelect,
  products, bundles, productsLoading, productsError, refetchProducts,
  activePromos,
  cart, addToCart, removeFromCart, clearCart, checkout, isCheckingOut,
  customerName, setCustomerName, notes, setNotes,
  discount, setDiscount,
  paymentMethod, setPaymentMethod,
  splitMode, setSplitMode, splitPayments, setSplitPayments,
  subtotal, discountAmount,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProductForVariation, setSelectedProductForVariation] = useState(null)

  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0)

  return (
    <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:mr-cart-width lg:w-[calc(100%-640px)] transition-all duration-300">
      <Header
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={onCategorySelect}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onToggleCart={() => setIsCartOpen(true)}
        cartItemsCount={cartItemsCount}
      />

      {activePromos.length > 0 && (
        <div className="px-lg pt-lg pb-0 space-y-2">
          {activePromos.map(p => {
            const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
            const dayList = p.day_of_week ? p.day_of_week.split(',').map(d => days[parseInt(d)]).filter(Boolean) : []
            return (
              <div key={p.id} className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm">
                <span className="material-symbols-outlined text-amber-600 text-[22px] filled-icon mt-0.5 shrink-0">local_offer</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-body-sm font-semibold text-amber-800">{p.name}</p>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-label-xs font-semibold rounded-full inline-flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      Aktif
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-label-xs text-amber-700">
                    <span className="font-medium">
                      {p.type === 'PERCENT' ? `Diskon ${p.value}%` : p.type === 'NOMINAL' ? `Diskon Rp${(p.value || 0).toLocaleString('id-ID')}` : `Beli ${p.buy_qty} Gratis ${p.free_qty}`}
                    </span>
                    {p.min_amount > 0 && <span>Min. Rp{(p.min_amount).toLocaleString('id-ID')}</span>}
                    {dayList.length > 0 && <span>🗓 {dayList.join(', ')}</span>}
                    {p.time_start && p.time_end && <span>⏰ {p.time_start}-{p.time_end}</span>}
                  </div>
                </div>
              </div>
            )}
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar pb-[72px]">
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-xs sm:gap-md">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-lg p-sm sm:p-md border border-outline-variant animate-pulse">
                <div className="aspect-video bg-surface-container-highest rounded-md mb-xs sm:mb-sm" />
                <div className="h-4 bg-surface-container-highest rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-container-highest rounded w-1/2 mb-3" />
                <div className="h-5 bg-surface-container-highest rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-sm">
            <span className="material-symbols-outlined text-[48px] text-error">error_outline</span>
            <p className="text-body-md font-medium text-on-surface">Gagal memuat produk</p>
            <p className="text-label-sm text-on-surface-variant">{productsError}</p>
            <button onClick={refetchProducts}
              className="mt-sm px-md py-sm bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-surface-tint transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[16px] mr-1">refresh</span>
              Coba Lagi
            </button>
          </div>
        ) : products.length === 0 && bundles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-xs">
            <span className="material-symbols-outlined text-[48px]">search_off</span>
            <p className="text-body-md font-medium">Tidak ada produk yang cocok</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-xs sm:gap-md">
            {bundles.map((bundle) => (
              <ProductCard
                key={`bundle-${bundle.id}`}
                product={{
                  id: `bundle-${bundle.id}`, _bundleId: bundle.id, _bundle: true,
                  bundleName: bundle.name, name: bundle.name, price: bundle.price,
                  icon: bundle.icon || 'inventory', category: 'Paket',
                  stock: null, track_stock: false, variations: [],
                }}
                isBundle
                onAddToCart={() => {
                  addToCart({ _bundle: true, _bundleId: bundle.id, bundleName: bundle.name, name: bundle.name, price: bundle.price })
                  if (window.innerWidth < 1024) setIsCartOpen(true)
                }}
              />
            ))}
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(prod) => {
                  if (prod.variations && prod.variations.length > 0) {
                    setSelectedProductForVariation(prod)
                  } else {
                    addToCart(prod)
                    if (window.innerWidth < 1024) setIsCartOpen(true)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CartSidebar
        cart={cart}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
        subtotal={subtotal}
        discountAmount={discountAmount}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={async () => {
          const res = await checkout()
          await refetchProducts()
          return res
        }}
        isCheckingOut={isCheckingOut}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        notes={notes}
        onNotesChange={setNotes}
        discount={discount}
        onDiscountChange={setDiscount}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        splitMode={splitMode}
        onSplitModeChange={setSplitMode}
        splitPayments={splitPayments}
        onSplitPaymentsChange={setSplitPayments}
        activePromos={activePromos}
      />

      {selectedProductForVariation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg bg-black/50 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedProductForVariation(null)}>
          <div className="bg-surface w-full max-w-[28rem] rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden animate-slide-up border border-outline-variant/30"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface">Pilih Variasi</h3>
              <button type="button" onClick={() => setSelectedProductForVariation(null)}
                className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-lg flex flex-col gap-sm overflow-y-auto bg-surface">
              <p className="text-body-lg text-on-surface-variant mb-xs">
                Pilih variasi untuk <span className="font-semibold text-on-surface">{selectedProductForVariation.name}</span>:
              </p>
              {selectedProductForVariation.variations.map((v, i) => (
                <button key={i} type="button"
                  onClick={() => {
                    addToCart(selectedProductForVariation, v.name)
                    setSelectedProductForVariation(null)
                    if (window.innerWidth < 1024) setIsCartOpen(true)
                  }}
                  className="flex justify-between items-center w-full p-4 border border-outline-variant rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left cursor-pointer">
                  <span className="text-body-lg font-medium text-on-surface">{v.name}</span>
                  <span className="text-body-md font-semibold text-primary">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v.price).replace('IDR', 'Rp')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
