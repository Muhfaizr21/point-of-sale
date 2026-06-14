import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './components/admin/LoginPage'
import { RegisterPage } from './components/admin/RegisterPage'
import { Sidebar } from './components/admin/Sidebar'
import { Footer } from './components/admin/Footer'
import { apiClient } from './services/apiClient'
import { useCart } from './hooks/useCart'
import { useProducts } from './hooks/useProducts'
import { useCategories } from './hooks/useCategories'
import { useBundles } from './hooks/useBundles'
import { useActivePromos } from './hooks/useActivePromos'
import { KasirPage } from './components/admin/KasirPage'
import { BranchPage } from './components/admin/BranchPage'
import { ErrorBoundary } from './components/common/ErrorBoundary'

const DashboardPage = lazy(() => import('./components/admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProductPage = lazy(() => import('./components/admin/ProductPage').then(m => ({ default: m.ProductPage })))
const TransaksiPage = lazy(() => import('./components/admin/TransaksiPage').then(m => ({ default: m.TransaksiPage })))
const LaporanPage = lazy(() => import('./components/admin/LaporanPage').then(m => ({ default: m.LaporanPage })))
const SettingsPage = lazy(() => import('./components/admin/SettingsPage').then(m => ({ default: m.SettingsPage })))
const IntegrasiPage = lazy(() => import('./components/admin/IntegrasiPage').then(m => ({ default: m.IntegrasiPage })))
const SupportPage = lazy(() => import('./components/admin/SupportPage').then(m => ({ default: m.SupportPage })))
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
const SuperadminDashboard = lazy(() => import('./components/superadmin/SuperadminDashboard').then(m => ({ default: m.SuperadminDashboard })))

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
  
  // Debug: log user role
  console.log('ProtectedRoute user:', user?.username, user?.role)

  if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />

  // Owner & superadmin can access everything
  if (user.role === 'owner') return children

  // Role check for non-owner
  if (role && user.role !== role) {
    return <AccessDenied />
  }
  // Feature check for non-owner (cashier)
  if (feature) {
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

function SuperadminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoading />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== 'superadmin') return <AccessDenied />
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

import { NotificationBell } from './components/common/NotificationBell'

const AdminLayout = ({ children, onToggleSidebar }) => (
  <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
    <Suspense fallback={<PageLoading />}>{children}</Suspense>
    <Footer />
  </main>
)

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [branchRefreshKey, setBranchRefreshKey] = useState(0)
  const [activeBranch, setActiveBranch] = useState(() => {
    const saved = localStorage.getItem('activeBranch')
    return saved ? parseInt(saved) : null
  })
  const [branchList, setBranchList] = useState([])
  // Cashier always scoped to own branch; owner can switch
  const effectiveBranch = useMemo(() => {
    if (!user) return activeBranch
    if (user.role === 'owner') return activeBranch
    return user.branch_id || null
  }, [user, activeBranch])
  // Store identity: branch name when scoped, merchant name when "all"
  const currentBranch = useMemo(() =>
    branchList.find(b => b.id === effectiveBranch), [branchList, effectiveBranch])
  const [storeName, setStoreName] = useState(localStorage.getItem('storeName') || 'PEKALIPAN')
  const [storeLogo, setStoreLogo] = useState(localStorage.getItem('storeLogo') || '')
  const [storeAddress, setStoreAddress] = useState(localStorage.getItem('storeAddress') || 'Jl. Pekalipan No. 99, Cirebon')
  // Override with branch info when scoped
  const displayName = currentBranch?.name || storeName
  const displayAddress = currentBranch?.address || storeAddress
  const displayLogo = currentBranch?.logo || storeLogo

  // Fetch branches for display + sidebar
  useEffect(() => {
    apiClient.get('/api/branches').then(d => setBranchList(d || [])).catch(() => {})
  }, [])

  const handleBranchChange = (branchId) => {
    setActiveBranch(branchId)
    if (branchId) localStorage.setItem('activeBranch', branchId)
    else localStorage.removeItem('activeBranch')
    navigate('/merchant/dashboard')
  }

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
    const path = location.pathname.replace('/merchant/', '')
    return path || 'kasir'
  }, [location.pathname])

  const handleTabSelect = (tabId) => {
    navigate(tabId === 'kasir' ? '/merchant/kasir' : tabId === 'dashboard' ? '/merchant/dashboard' : `/merchant/${tabId}`)
  }

  const {
    products, allProducts, selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery, addProduct, updateProduct, deleteProduct,
    loading: productsLoading, error: productsError, refetchProducts,
  } = useProducts(effectiveBranch)

  const {
    categories: rawCategories, loading: categoriesLoading, error: categoriesError,
    addCategory, updateCategory, deleteCategory,
  } = useCategories(effectiveBranch)

  const { bundles, refetchBundles } = useBundles(effectiveBranch)
  const { promos: activePromos, refetch: refetchPromos } = useActivePromos(effectiveBranch)

  useEffect(() => {
    if (location.pathname === '/merchant/kasir') { refetchBundles(); refetchPromos() }
  }, [location.pathname, refetchBundles, refetchPromos])

  const categories = useMemo(() => ['Semua', ...rawCategories.map(c => c.name)], [rawCategories])

  const {
    cart, addToCart, removeFromCart, clearCart, checkout, isCheckingOut,
    customerName, setCustomerName, notes, setNotes, discount, setDiscount,
    paymentMethod, setPaymentMethod, splitMode, setSplitMode, splitPayments, setSplitPayments,
    subtotal, discountAmount,
  } = useCart()

  const isLandingPage = location.pathname === '/' || location.pathname.startsWith('/tentang') || location.pathname.startsWith('/harga') || location.pathname.startsWith('/kontak') || location.pathname === '/login' || location.pathname.startsWith('/superadmin')

  return (
    <div className={isLandingPage ? "min-h-screen w-full bg-background text-on-background" : "bg-background text-on-background min-h-screen flex overflow-hidden w-full relative"}>
      {user && !isLandingPage && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentTab={currentTab}
          onTabSelect={handleTabSelect}
          storeName={displayName} storeLogo={displayLogo} storeAddress={displayAddress}
          activeBranch={effectiveBranch}
          onBranchChange={handleBranchChange}
          branchRefreshKey={branchRefreshKey}
        />
      )}

      <Routes>
        <Route path="/" element={<Suspense fallback={<PageLoading />}><LandingPage /></Suspense>} />
        <Route path="/tentang" element={<Suspense fallback={<PageLoading />}><AboutPage /></Suspense>} />
        <Route path="/harga" element={<Suspense fallback={<PageLoading />}><HargaPage /></Suspense>} />
        <Route path="/kontak" element={<Suspense fallback={<PageLoading />}><KontakPage /></Suspense>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/merchant/kasir" element={
          <ProtectedRoute feature="kasir">
            <KasirPage
              searchQuery={searchQuery} onSearchChange={setSearchQuery} activeBranch={effectiveBranch}
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

        <Route path="/merchant/produk" element={
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

        <Route path="/merchant/dashboard" element={
          <ProtectedRoute feature="dashboard">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <DashboardPage onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/transaksi" element={
          <ProtectedRoute feature="transaksi">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <TransaksiPage onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/laporan" element={
          <ProtectedRoute role="owner" feature="laporan">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <LaporanPage onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/pesanan" element={
          <ProtectedRoute>
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <OrderPage onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/kategori" element={
          <ProtectedRoute role="owner" feature="kategori">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <KategoriPage
                categories={rawCategories} addCategory={addCategory}
                updateCategory={async (id, name) => { await updateCategory(id, name); await refetchProducts() }}
                deleteCategory={async (id) => { await deleteCategory(id); await refetchProducts() }}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                loading={categoriesLoading} error={categoriesError}
                activeBranch={effectiveBranch}
              />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/pengaturan" element={
          <ProtectedRoute role="owner" feature="pengaturan">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <SettingsPage onToggleSidebar={() => setIsSidebarOpen(true)} onSettingsChange={handleSettingsChange} />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/merchant/integrasi" element={
          <ProtectedRoute role="owner" feature="integrasi">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <IntegrasiPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/merchant/support" element={
          <ProtectedRoute>
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <SupportPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/bundel" element={
          <ProtectedRoute role="owner" feature="bundel">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <BundlePage products={allProducts} onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/promo" element={
          <ProtectedRoute role="owner" feature="promo">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <PromoPage onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/stok" element={
          <ProtectedRoute role="owner" feature="stok">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <StockPage products={allProducts} onToggleSidebar={() => setIsSidebarOpen(true)} onRefreshProducts={refetchProducts} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/cabang" element={
          <ProtectedRoute role="owner">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <BranchPage onToggleSidebar={() => setIsSidebarOpen(true)} onBranchChange={() => setBranchRefreshKey(k => k + 1)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/tema" element={
          <ProtectedRoute feature="tema">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <ThemePage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/hakakses" element={
          <ProtectedRoute role="owner">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <RbacPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/supplier" element={
          <ProtectedRoute role="owner" feature="supplier">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <SupplierPage onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/pelanggan" element={
          <ProtectedRoute role="owner">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <CustomerPage onToggleSidebar={() => setIsSidebarOpen(true)} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/pengeluaran" element={
          <ProtectedRoute feature="pengeluaran">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <ExpensePage onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/merchant/modal" element={
          <ProtectedRoute feature="modal">
            <AdminLayout onToggleSidebar={() => setIsSidebarOpen(true)}>
              <ModalPage onToggleSidebar={() => setIsSidebarOpen(true)} activeBranch={effectiveBranch} />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/superadmin" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="overview" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/analytics" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="analytics" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/tenants" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="tenants" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/billing" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="billing" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/broadcasts" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="broadcasts" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/integrations" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="integrations" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/finance-revenue" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="finance-revenue" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/finance-orders" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="finance-orders" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/finance-merchants" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="finance-merchants" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/finance-payments" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="finance-payments" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/finance-health" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="finance-health" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/audit-log" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="audit-log" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/platform-settings" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="platform-settings" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/maintenance" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="maintenance" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/support-inbox" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="support-inbox" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/tickets" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="tickets" />
            </Suspense>
          </SuperadminRoute>
        } />
        <Route path="/superadmin/demographics" element={
          <SuperadminRoute>
            <Suspense fallback={<PageLoading />}>
              <SuperadminDashboard section="demographics" />
            </Suspense>
          </SuperadminRoute>
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
            </main>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

function App() {
  const [maintenance, setMaintenance] = useState(null)
  useEffect(() => {
    const handler = (e) => setMaintenance(e.detail?.message || 'Sistem sedang dalam perawatan. Silakan coba lagi nanti.')
    window.addEventListener('maintenance-mode', handler)
    return () => window.removeEventListener('maintenance-mode', handler)
  }, [])

  if (maintenance) {
    return (
      <div className="h-screen w-screen bg-[#030303] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden selection:bg-amber-500/20">
        {/* Animated background orbs */}
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-amber-500/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-orange-500/[0.03] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-500/[0.02] to-transparent blur-[150px]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',backgroundSize:'40px 40px'}} />

        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-amber-500/15 to-orange-500/5 border border-amber-500/15 flex items-center justify-center shadow-2xl shadow-amber-500/10">
            <span className="material-symbols-outlined text-[56px] text-amber-400" style={{animation:'spin 6s linear infinite'}}>settings</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-[#030303]">
            <span className="material-symbols-outlined text-[18px] text-white">construction</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-lg">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-amber-500/5 border border-amber-500/10 mb-7 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400" style={{animation:'pulse 2s ease-in-out infinite'}} />
            <span className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-[0.15em]">Pemeliharaan Terjadwal</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-5">
            Sistem Sedang{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">Dalam Perawatan</span>
          </h1>

          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mx-auto mb-5" />

          <p className="text-sm lg:text-base text-white/40 leading-relaxed max-w-md mx-auto font-light">
            {maintenance}
          </p>
        </div>

        {/* Loading bar */}
        <div className="relative mt-12 w-48">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{animation:'loading 2s ease-in-out infinite'}} />
          </div>
          <style>{`@keyframes loading{0%,100%{transform:translateX(-100%)}50%{transform:translateX(300%)}}`}</style>
        </div>

        {/* Status */}
        <div className="relative mt-8 flex items-center gap-6 text-[11px] text-white/20">
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" /><span>Server Aktif</span></div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" style={{animation:'pulse 2s ease-in-out infinite'}} /><span>Mode Maintenance</span></div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/10" /><span>Database</span></div>
        </div>

        <p className="relative mt-10 text-[11px] text-white/10 font-mono tracking-wider">SENTRAKAS PLATFORM v1.0</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
