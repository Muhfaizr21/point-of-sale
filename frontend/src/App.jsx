import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './components/admin/LoginPage'
import { Sidebar } from './components/admin/Sidebar'
import { Footer } from './components/admin/Footer'
import { apiClient } from './services/apiClient'
import { useCart } from './hooks/useCart'
import { useProducts } from './hooks/useProducts'
import { useCategories } from './hooks/useCategories'
import { useBundles } from './hooks/useBundles'
import { useActivePromos } from './hooks/useActivePromos'
import { KasirPage } from './components/admin/KasirPage'
import { ErrorBoundary } from './components/common/ErrorBoundary'

const DashboardPage = lazy(() => import('./components/admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProductPage = lazy(() => import('./components/admin/ProductPage').then(m => ({ default: m.ProductPage })))
const TransaksiPage = lazy(() => import('./components/admin/TransaksiPage').then(m => ({ default: m.TransaksiPage })))
const LaporanPage = lazy(() => import('./components/admin/LaporanPage').then(m => ({ default: m.LaporanPage })))
const SettingsPage = lazy(() => import('./components/admin/SettingsPage').then(m => ({ default: m.SettingsPage })))
const KategoriPage = lazy(() => import('./components/admin/KategoriPage').then(m => ({ default: m.KategoriPage })))
const BundlePage = lazy(() => import('./components/admin/BundlePage').then(m => ({ default: m.BundlePage })))
const PromoPage = lazy(() => import('./components/admin/PromoPage').then(m => ({ default: m.PromoPage })))
const RbacPage = lazy(() => import('./components/admin/RbacPage').then(m => ({ default: m.RbacPage })))
const StockPage = lazy(() => import('./components/admin/StockPage').then(m => ({ default: m.StockPage })))
const ThemePage = lazy(() => import('./components/admin/ThemePage').then(m => ({ default: m.ThemePage })))
const SupplierPage = lazy(() => import('./components/admin/SupplierPage').then(m => ({ default: m.SupplierPage })))
const CustomerPage = lazy(() => import('./components/admin/CustomerPage').then(m => ({ default: m.CustomerPage })))
const OrderPage = lazy(() => import('./components/admin/OrderPage').then(m => ({ default: m.OrderPage })))
const ExpensePage = lazy(() => import('./components/admin/ExpensePage').then(m => ({ default: m.ExpensePage })))
const ModalPage = lazy(() => import('./components/admin/ModalPage').then(m => ({ default: m.ModalPage })))
const LandingPage = lazy(() => import('./components/landing/LandingPage'))
const AboutPage = lazy(() => import('./components/landing/AboutPage').then(m => ({ default: m.AboutPage })))
const HargaPage = lazy(() => import('./components/landing/HargaPage').then(m => ({ default: m.HargaPage })))
const KontakPage = lazy(() => import('./components/landing/KontakPage').then(m => ({ default: m.KontakPage })))

function PageLoading() {
  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-primary text-[48px]">sync</span>
    </div>
  )
}

function ProtectedRoute({ children, role, feature }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoading />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (role && user.role !== 'owner' && user.role !== role) {
    return <AccessDenied />
  }
  if (feature && user.role !== 'owner') {
    try {
      const raw = localStorage.getItem('rbacConfig')
      if (raw) {
        const rbac = JSON.parse(raw)
        const perm = rbac.permissions?.[user.role]?.[feature]
        if (!perm || perm.read !== true) return <AccessDenied />
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
        <p className="text-body-lg text-on-surface font-medium">Akses ditolak</p>
        <p className="text-label-sm text-on-surface-variant">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    </div>
  )
}

const AdminLayout = ({ children, onToggleSidebar }) => (
  <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
    <Suspense fallback={<PageLoading />}>{children}</Suspense>
    <Footer />
  </main>
)

const PageShell = ({ onToggleSidebar, children }) => (
  <div className="flex-1 overflow-y-auto hide-scrollbar">{children}</div>
)

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [storeName, setStoreName] = useState(localStorage.getItem('storeName') || 'PEKALIPAN')
  const [storeLogo, setStoreLogo] = useState(localStorage.getItem('storeLogo') || '')
  const [storeAddress, setStoreAddress] = useState(localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon')

  const handleSettingsChange = () => {
    setStoreName(localStorage.getItem('storeName') || 'PEKALIPAN')
    setStoreLogo(localStorage.getItem('storeLogo') || '')
    setStoreAddress(localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon')
  }

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

  const currentTab = useMemo(() => {
    return location.pathname.replace(/^\//, '') || 'kasir'
  }, [location.pathname])

  const handleTabSelect = (tabId) => {
    navigate(tabId === 'kasir' ? '/kasir' : tabId === 'dashboard' ? '/dashboard' : `/${tabId}`)
  }

  const {
    products, allProducts, selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery, addProduct, updateProduct, deleteProduct,
    loading: productsLoading, error: productsError, refetchProducts,
  } = useProducts()

  const {
    categories: rawCategories, loading: categoriesLoading, error: categoriesError,
    addCategory, updateCategory, deleteCategory,
  } = useCategories()

  const { bundles, refetchBundles } = useBundles()
  const { promos: activePromos, refetch: refetchPromos } = useActivePromos()

  useEffect(() => {
    if (location.pathname === '/kasir') { refetchBundles(); refetchPromos() }
  }, [location.pathname, refetchBundles, refetchPromos])

  const categories = useMemo(() => ['Semua', ...rawCategories.map(c => c.name)], [rawCategories])

  const {
    cart, addToCart, removeFromCart, clearCart, checkout, isCheckingOut,
    customerName, setCustomerName, notes, setNotes, discount, setDiscount,
    paymentMethod, setPaymentMethod, splitMode, setSplitMode, splitPayments, setSplitPayments,
    subtotal, discountAmount,
  } = useCart()

  const isLandingPage = ['/', '/tentang', '/harga', '/kontak', '/login'].includes(location.pathname)

  return (
    <div className={isLandingPage ? "min-h-screen w-full bg-background text-on-background" : "bg-background text-on-background min-h-screen flex overflow-hidden w-full relative"}>
      {user && !isLandingPage && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentTab={currentTab}
          onTabSelect={handleTabSelect}
          storeName={storeName} storeLogo={storeLogo} storeAddress={storeAddress}
        />
      )}

      <Routes>
        <Route path="/" element={<Suspense fallback={<PageLoading />}><LandingPage /></Suspense>} />
        <Route path="/tentang" element={<Suspense fallback={<PageLoading />}><AboutPage /></Suspense>} />
        <Route path="/harga" element={<Suspense fallback={<PageLoading />}><HargaPage /></Suspense>} />
        <Route path="/kontak" element={<Suspense fallback={<PageLoading />}><KontakPage /></Suspense>} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/kasir" element={
          <ProtectedRoute feature="kasir">
            <KasirPage
              searchQuery={searchQuery} onSearchChange={setSearchQuery}
              categories={categories} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory}
              products={products} bundles={bundles} productsLoading={productsLoading} productsError={productsError} refetchProducts={refetchProducts}
              activePromos={activePromos}
              cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} clearCart={clearCart}
              checkout={checkout} isCheckingOut={isCheckingOut}
              customerName={customerName} setCustomerName={setCustomerName}
              notes={notes} setNotes={setNotes} discount={discount} setDiscount={setDiscount}
              paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              splitMode={splitMode} setSplitMode={setSplitMode} splitPayments={splitPayments} setSplitPayments={setSplitPayments}
              subtotal={subtotal} discountAmount={discountAmount}
            />
          </ProtectedRoute>
        } />

        <Route path="/produk" element={
          <ProtectedRoute role="owner" feature="produk">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <ProductPage
                products={allProducts} categories={rawCategories}
                addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                loading={productsLoading} error={productsError}
              />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute feature="dashboard">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <DashboardPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/transaksi" element={
          <ProtectedRoute feature="transaksi">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <TransaksiPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/laporan" element={
          <ProtectedRoute role="owner" feature="laporan">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <LaporanPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pesanan" element={
          <ProtectedRoute>
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <OrderPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/kategori" element={
          <ProtectedRoute role="owner" feature="kategori">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <KategoriPage
                categories={rawCategories} addCategory={addCategory}
                updateCategory={async (id, name) => { await updateCategory(id, name); await refetchProducts() }}
                deleteCategory={async (id) => { await deleteCategory(id); await refetchProducts() }}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                loading={categoriesLoading} error={categoriesError}
              />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pengaturan" element={
          <ProtectedRoute role="owner" feature="pengaturan">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <SettingsPage onToggleSidebar={() => setIsSidebarOpen(true)} onSettingsChange={handleSettingsChange} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/bundel" element={
          <ProtectedRoute role="owner" feature="bundel">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <BundlePage products={allProducts} onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/promo" element={
          <ProtectedRoute role="owner" feature="promo">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <PromoPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/stok" element={
          <ProtectedRoute role="owner" feature="stok">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <StockPage products={allProducts} onToggleSidebar={() => setIsSidebarOpen(true)} onRefreshProducts={refetchProducts} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/tema" element={
          <ProtectedRoute feature="tema">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <ThemePage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/hakakses" element={
          <ProtectedRoute role="owner">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <RbacPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/supplier" element={
          <ProtectedRoute role="owner" feature="supplier">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <SupplierPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pelanggan" element={
          <ProtectedRoute role="owner">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <CustomerPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pengeluaran" element={
          <ProtectedRoute feature="pengeluaran">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <ExpensePage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/modal" element={
          <ProtectedRoute feature="modal">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <ModalPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <ProtectedRoute>
            <main className="w-full h-screen flex flex-col items-center justify-center relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300 pb-[72px]">
              <button type="button" onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden absolute left-4 top-4 p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer flex items-center justify-center">
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
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
