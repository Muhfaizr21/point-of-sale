import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './components/admin/LoginPage'
import { Sidebar } from './components/admin/Sidebar'
import { Header } from './components/admin/Header'
import { ProductCard } from './components/admin/ProductCard'
import { CartSidebar } from './components/admin/CartSidebar'
import { Footer } from './components/admin/Footer'
import { ProductPage } from './components/admin/ProductPage'
import { TransaksiPage } from './components/admin/TransaksiPage'
import { LaporanPage } from './components/admin/LaporanPage'
import { DashboardPage } from './components/admin/DashboardPage'
import { SettingsPage } from './components/admin/SettingsPage'
import { KategoriPage } from './components/admin/KategoriPage'
import { BundlePage } from './components/admin/BundlePage'
import { PromoPage } from './components/admin/PromoPage'
import { RbacPage } from './components/admin/RbacPage'
import { StockPage } from './components/admin/StockPage'
import { ThemePage } from './components/admin/ThemePage'
import { SupplierPage } from './components/admin/SupplierPage'
import { CustomerPage } from './components/admin/CustomerPage'
import { OrderPage } from './components/admin/OrderPage'
import LandingPage from './components/landing/LandingPage'
import { AboutPage } from './components/landing/AboutPage'
import { HargaPage } from './components/landing/HargaPage'
import { KontakPage } from './components/landing/KontakPage'
import { apiClient } from './services/apiClient'
import { useCart } from './hooks/useCart'
import { useProducts } from './hooks/useProducts'
import { useCategories } from './hooks/useCategories'
import { useBundles } from './hooks/useBundles'
import { useActivePromos } from './hooks/useActivePromos'

function ProtectedRoute({ children, role, feature }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-primary text-[48px]">sync</span>
    </div>
  )
  if (!user) return <LoginPage />
  if (role && user.role !== 'owner' && user.role !== role) {
    return <AccessDenied />
  }
  if (feature && user.role !== 'owner') {
    try {
      const raw = localStorage.getItem('rbacConfig')
      if (raw) {
        const rbac = JSON.parse(raw)
        const perm = rbac.permissions?.[user.role]?.[feature]
        if (!perm || perm.read !== true) {
          return <AccessDenied />
        }
      }
    } catch {}
  }
  return children
}

function AccessDenied() {
  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-[64px] text-error">lock</span>
        <p className="text-body-lg text-on-surface mt-sm">Akses ditolak</p>
        <p className="text-label-sm text-on-surface-variant">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProductForVariation, setSelectedProductForVariation] = useState(null)

  const [storeName, setStoreName] = useState(localStorage.getItem('storeName') || 'PEKALIPAN')
  const [storeLogo, setStoreLogo] = useState(localStorage.getItem('storeLogo') || '')
  const [storeAddress, setStoreAddress] = useState(localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon')

  const handleSettingsChange = () => {
    setStoreName(localStorage.getItem('storeName') || 'PEKALIPAN')
    setStoreLogo(localStorage.getItem('storeLogo') || '')
    setStoreAddress(localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon')
  }

  // Load theme on mount
  useEffect(() => {
    const apply = (t) => {
      const root = document.documentElement
      const isDark = t.mode === 'dark'
      root.classList.toggle('dark-theme', isDark)
      root.style.setProperty('--color-primary', t.primary || '#af101a')
      root.style.setProperty('--color-surface-tint', t.tint || '#ba1a20')
      root.style.setProperty('--color-primary-container', t.container || '#d32f2f')
      root.style.setProperty('--color-error', t.error || '#ba1a1a')
      root.style.setProperty('--color-background', t.bg || '#fbf9f9')
      root.style.setProperty('--color-surface', t.surface || '#ffffff')
      root.style.setProperty('--color-surface-container-low', isDark ? '#000000' : '#f5f3f3')
      root.style.setProperty('--color-on-surface', isDark ? '#e5e5e5' : '#1b1c1c')
      root.style.setProperty('--color-on-surface-variant', isDark ? '#a3a3a3' : '#5b403d')
      root.style.setProperty('--font-body', t.font || "'Inter', sans-serif")
      root.style.setProperty('--color-sidebar-bg', t.sidebar || t.bg || '#fbf9f9')
    }
    ;(async () => {
      try {
        const res = await apiClient.get('/api/settings/theme')
        if (res?.value) { apply(JSON.parse(res.value)); return }
      } catch {}
      const local = localStorage.getItem('appTheme')
      if (local) { try { apply(JSON.parse(local)) } catch {} }
    })()
  }, [])

  // Derive active tab from path (e.g., "/" -> "kasir", "/dashboard" -> "dashboard", "/produk" -> "produk")
  const currentTab = useMemo(() => {
    const path = location.pathname.replace(/^\//, '')
    return path || 'kasir'
  }, [location.pathname])

  const handleTabSelect = (tabId) => {
    if (tabId === 'kasir') {
      navigate('/kasir')
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

  const { bundles, refetchBundles } = useBundles()
  const { promos: activePromos, refetch: refetchPromos } = useActivePromos()

  // Auto-refresh bundles & promos every time user navigates to kasir
  useEffect(() => {
    if (location.pathname === '/kasir') { refetchBundles(); refetchPromos() }
  }, [location.pathname, refetchBundles, refetchPromos])

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
    notes,
    setNotes,
    discount,
    setDiscount,
    paymentMethod,
    setPaymentMethod,
    splitMode,
    setSplitMode,
    splitPayments,
    setSplitPayments,
    subtotal,
    discountAmount,
    total,
  } = useCart()

  // Calculate total item count in cart
  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0)

  const isLandingPage = location.pathname === '/' || location.pathname === '/tentang' || location.pathname === '/harga' || location.pathname === '/kontak' || location.pathname === '/login'

  return (
    <div className={isLandingPage ? "min-h-screen w-full bg-background text-on-background" : "bg-background text-on-background min-h-screen flex overflow-hidden w-full relative"}>
      {user && location.pathname !== '/' && location.pathname !== '/tentang' && location.pathname !== '/harga' && location.pathname !== '/kontak' && location.pathname !== '/login' && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentTab={currentTab}
          onTabSelect={handleTabSelect}
          storeName={storeName}
          storeLogo={storeLogo}
          storeAddress={storeAddress}
        />
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/kasir" element={
          <ProtectedRoute feature="kasir">
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

            {/* Active Promo Banner */}
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
                  <button
                    onClick={refetchProducts}
                    className="mt-sm px-md py-sm bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-surface-tint transition-colors cursor-pointer"
                  >
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
                        id: `bundle-${bundle.id}`,
                        _bundleId: bundle.id,
                        _bundle: true,
                        bundleName: bundle.name,
                        name: bundle.name,
                        price: bundle.price,
                        icon: bundle.icon || 'inventory',
                        category: 'Paket',
                        stock: null,
                        track_stock: false,
                        variations: [],
                      }}
                      isBundle
                      onAddToCart={() => {
                        addToCart({
                          _bundle: true,
                          _bundleId: bundle.id,
                          bundleName: bundle.name,
                          name: bundle.name,
                          price: bundle.price,
                        })
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
                await refetchBundles()
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
          </ProtectedRoute>
        } />

        <Route path="/tentang" element={<AboutPage />} />
        <Route path="/harga" element={<HargaPage />} />
        <Route path="/kontak" element={<KontakPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/produk" element={
          <ProtectedRoute role="owner" feature="produk">
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
          </ProtectedRoute>
        } />

        <Route path="/transaksi" element={
          <ProtectedRoute feature="transaksi">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <TransaksiPage
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/pesanan" element={
          <ProtectedRoute>
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <OrderPage
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/tema" element={
          <ProtectedRoute feature="tema">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <ThemePage onToggleSidebar={() => setIsSidebarOpen(true)} />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/hakakses" element={
          <ProtectedRoute role="owner">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <RbacPage onToggleSidebar={() => setIsSidebarOpen(true)} />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute feature="dashboard">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <DashboardPage
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/laporan" element={
          <ProtectedRoute role="owner" feature="laporan">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <LaporanPage
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/kategori" element={
          <ProtectedRoute role="owner" feature="kategori">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <KategoriPage
                categories={rawCategories}
                addCategory={addCategory}
                updateCategory={async (id, name) => {
                  await updateCategory(id, name)
                  await refetchProducts()
                }}
                deleteCategory={async (id) => {
                  await deleteCategory(id)
                  await refetchProducts()
                }}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                loading={categoriesLoading}
                error={categoriesError}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/pengaturan" element={
          <ProtectedRoute role="owner" feature="pengaturan">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <SettingsPage
                onToggleSidebar={() => setIsSidebarOpen(true)}
                onSettingsChange={handleSettingsChange}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/bundel" element={
          <ProtectedRoute role="owner" feature="bundel">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <BundlePage
                products={allProducts}
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/promo" element={
          <ProtectedRoute role="owner" feature="promo">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <PromoPage
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/stok" element={
          <ProtectedRoute role="owner" feature="stok">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <StockPage
                products={allProducts}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                onRefreshProducts={refetchProducts}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/supplier" element={
          <ProtectedRoute role="owner" feature="supplier">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <SupplierPage
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="/pelanggan" element={
          <ProtectedRoute role="owner">
            <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
              <CustomerPage
                onToggleSidebar={() => setIsSidebarOpen(true)}
              />
              <Footer />
            </main>
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <ProtectedRoute>
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
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
