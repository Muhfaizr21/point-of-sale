import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { CartSidebar } from './components/CartSidebar'
import { Footer } from './components/Footer'
import { ProductPage } from './components/ProductPage'
import { useCart } from './hooks/useCart'
import { useProducts } from './hooks/useProducts'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Derive active tab from path (e.g., "/" -> "kasir", "/produk" -> "produk")
  const currentTab = useMemo(() => {
    const path = location.pathname.replace(/^\//, '')
    return path || 'kasir'
  }, [location.pathname])

  const handleTabSelect = (tabId) => {
    if (tabId === 'kasir') {
      navigate('/')
    } else {
      navigate(`/${tabId}`)
    }
  }

  const {
    products,
    allProducts,
    categories,
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
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    isCheckingOut,
    subtotal,
    tax,
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

      {/* Conditionally render screens depending on active tab */}
      {currentTab === 'kasir' ? (
        <>
          {/* Cashier main panel */}
          <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:mr-cart-width lg:w-[calc(100%-640px)] transition-all duration-300">
            {/* Top Header */}
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

            {/* Product Catalog Grid */}
            <div className="flex-1 overflow-y-auto p-lg hide-scrollbar pb-[72px]">
              {products.length === 0 ? (
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
                        addToCart(prod)
                        // Auto-open cart sidebar on mobile when adding items
                        if (window.innerWidth < 1024) {
                          setIsCartOpen(true)
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic footer status bar */}
            <Footer />
          </main>

          {/* Right Sidebar (Cart) (Desktop: always visible, Mobile: toggled drawer) */}
          <CartSidebar
            cart={cart}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCart}
            subtotal={subtotal}
            tax={tax}
            total={total}
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onCheckout={async (method) => {
              const res = await checkout(method)
              await refetchProducts()
              return res
            }}
            isCheckingOut={isCheckingOut}
          />
        </>
      ) : currentTab === 'produk' ? (
        /* Product Management Page (No Right Cart Sidebar) */
        <main className="w-full h-screen flex flex-col relative bg-surface-container-low lg:ml-sidebar-width lg:w-[calc(100%-260px)] transition-all duration-300">
          <ProductPage
            products={allProducts}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            loading={productsLoading}
            error={productsError}
          />
          <Footer />
        </main>
      ) : (
        /* Placeholder for other navigation tabs */
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
      )}
    </div>
  )
}

export default App
