import React from 'react'
import { Input } from './common/Input'

export function Header({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategorySelect,
  onToggleSidebar,
  onToggleCart,
  cartItemsCount,
}) {
  return (
    <header className="flex justify-between items-center px-lg py-md h-[72px] w-full border-b border-outline-variant bg-surface z-20">
      <div className="flex-1 flex items-center gap-lg">
        {/* Burger menu button for mobile/tablet */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer mr-2 flex items-center justify-center"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <h2 className="text-headline-md text-on-surface font-semibold hidden md:block">Kasir</h2>
        
        {/* Search Bar */}
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari produk..."
          icon="search"
          className="max-w-md w-full"
        />
      </div>

      <div className="flex items-center gap-md">
        {/* Category Filters (scrollable on mobile) */}
        <div className="flex gap-sm overflow-x-auto max-w-[200px] sm:max-w-none hide-scrollbar">
          {categories.map((category) => {
            const isActive = selectedCategory === category
            return (
              <button
                key={category}
                onClick={() => onCategorySelect(category)}
                className={`px-md py-xs text-label-sm transition-colors cursor-pointer rounded-md whitespace-nowrap ${
                  isActive
                    ? 'text-primary font-bold bg-primary/10 border border-primary/20'
                    : 'text-secondary hover:text-primary hover:bg-surface-container-highest'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>

        {/* Separator line */}
        <div className="w-px h-6 bg-outline-variant mx-1 sm:mx-2"></div>

        {/* Floating Cart Button with Badge for mobile */}
        <button
          type="button"
          onClick={onToggleCart}
          className="lg:hidden relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors rounded-full cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartItemsCount}
            </span>
          )}
        </button>

        {/* Notification and User Buttons (Hidden on very small mobile screens) */}
        <button
          aria-label="Notifikasi"
          className="hidden sm:flex p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors rounded-full cursor-pointer items-center justify-center"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          aria-label="Profil"
          className="hidden sm:flex p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors rounded-full cursor-pointer items-center justify-center"
        >
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  )
}
