import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { CartSidebar } from './components/CartSidebar'
import { Footer } from './components/Footer'
import { ProductPage } from './components/ProductPage'
import { TransaksiPage } from './components/TransaksiPage'
import { LaporanPage } from './components/LaporanPage'
import { DashboardPage } from './components/DashboardPage'
import { SettingsPage } from './components/SettingsPage'
import { KategoriPage } from './components/KategoriPage'
import { useCart } from './hooks/useCart'
import { useProducts } from './hooks/useProducts'
import { useCategories } from './hooks/useCategories'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProductForVariation, setSelectedProductForVariation] = useState(null)

  // Derive active tab from path (e.g., "/" -> "kasir", "/dashboard" -> "dashboard", "/produk" -> "produk")
  const currentTab = useMemo(() => {
    const path = location.pathname.replace(/^\//, '')
    return path || 'kasir'
  }, [location.pathname])

  const handleTabSelect = (tabId) => {
    if (tabId === 'kasir') {
      navigate('/')
    } else if (tabId === 'dashboard') {
      navigate('/dashboard')
    } else {
      navigate(`/${tabId}`)
    }
  }

  const {
    products,
    allProducts,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    addProduct,
    updateProduct,
    deleteProduct,
    loading: productsLoading,
    error: productsError,
    refetchProducts,
  } = useProducts()

  const {
    categories: rawCategories,
    loading: categoriesLoading,
    error: categoriesError,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories()

  const categories = useMemo(() => {
    return ['Semua', ...rawCategories.map(c => c.name)]
  }, [rawCategories])

  const {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    isCheckingOut,
    customerName,
    setCustomerName,
    discount,
    setDiscount,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    discountAmount,
    total,
  } = useCart()

  // Calculate total item count in cart
  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0)

  return (
    <div className="bg-background text-on-background min-h-screen flex overflow-hidden w-full relative">
      {/* Left Sidebar (Desktop: always visible, Mobile: toggled drawer) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentTab={currentTab}
        onTabSelect={handleTabSelect}
      />

      <Routes>
        <Route path="/" element={
          <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:mr-cart-width lg:w-[calc(100%-640px)] transition-all duration-300">
            <Header
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              onToggleCart={() => setIsCartOpen(true)}
              cartItemsCount={cartItemsCount}
            />

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
                  <button
                    onClick={refetchProducts}
                    className="mt-sm px-md py-sm bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-surface-tint transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1">refresh</span>
                    Coba Lagi
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-xs">
                  <span className="material-symbols-outlined text-[48px]">search_off</span>
                  <p className="text-body-md font-medium">Tidak ada produk yang cocok</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-xs sm:gap-md">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(prod) => {
                        if (prod.variations && prod.variations.length > 0) {
                          setSelectedProductForVariation(prod)
                        } else {
                          addToCart(prod)
                          if (window.innerWidth < 1024) {
                            setIsCartOpen(true)
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <Footer />

            <CartSidebar
              cart={cart}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              onClearCart={clearCart}
              subtotal={subtotal}
              discountAmount={discountAmount}
              total={total}
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
              discount={discount}
              onDiscountChange={setDiscount}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
            />

            {/* Variation Selection Modal */}
            {selectedProductForVariation && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg bg-black/50 backdrop-blur-md animate-fade-in"
                onClick={() => setSelectedProductForVariation(null)}
              >
                <div 
                  className="bg-surface w-full max-w-[28rem] rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden animate-slide-up border border-outline-variant/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                    <h3 className="text-headline-md font-semibold text-on-surface">Pilih Variasi</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedProductForVariation(null)}
                      className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="p-lg flex flex-col gap-sm overflow-y-auto bg-surface">
                    <p className="text-body-lg text-on-surface-variant mb-xs">
                      Pilih variasi untuk <span className="font-semibold text-on-surface">{selectedProductForVariation.name}</span>:
                    </p>
                    {selectedProductForVariation.variations.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          addToCart(selectedProductForVariation, v.name)
                          setSelectedProductForVariation(null)
                          if (window.innerWidth < 1024) {
                            setIsCartOpen(true)
                          }
                        }}
                        className="flex justify-between items-center w-full p-4 border border-outline-variant rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left cursor-pointer"
                      >
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
          </main>
        } />

        <Route path="/produk" element={
          <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
            <ProductPage
              products={allProducts}
              categories={rawCategories}
              deleteProduct={deleteProduct}
              addProduct={addProduct}
              updateProduct={updateProduct}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              loading={productsLoading}
              error={productsError}
            />
            <Footer />
          </main>
        } />

        <Route path="/transaksi" element={
          <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
            <TransaksiPage
              onToggleSidebar={() => setIsSidebarOpen(true)}
            />
            <Footer />
          </main>
        } />

        <Route path="/dashboard" element={
          <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
            <DashboardPage
              onToggleSidebar={() => setIsSidebarOpen(true)}
            />
            <Footer />
          </main>
        } />

        <Route path="/laporan" element={
          <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
            <LaporanPage
              onToggleSidebar={() => setIsSidebarOpen(true)}
            />
            <Footer />
          </main>
        } />

        <Route path="/kategori" element={
          <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
            <KategoriPage
              categories={rawCategories}
              addCategory={addCategory}
              updateCategory={updateCategory}
              deleteCategory={deleteCategory}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              loading={categoriesLoading}
              error={categoriesError}
            />
            <Footer />
          </main>
        } />

        <Route path="/pengaturan" element={
          <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
            <SettingsPage
              onToggleSidebar={() => setIsSidebarOpen(true)}
            />
            <Footer />
          </main>
        } />

        <Route path="*" element={
          <main className="w-full h-screen flex flex-col items-center justify-center relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300 pb-[72px]">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden absolute left-4 top-4 p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="text-center text-on-surface-variant gap-xs flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[48px] animate-bounce text-primary">construction</span>
              <h3 className="text-headline-md font-semibold text-on-surface capitalize">{currentTab} Page</h3>
              <p className="text-body-md">Halaman sedang dalam tahap pengembangan.</p>
            </div>
            <Footer />
          </main>
        } />
      </Routes>
    </div>
  )
}

export default App
