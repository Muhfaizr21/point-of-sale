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
    <header className="flex flex-col px-6 pt-4 pb-2 w-full border-b border-outline-variant/50 bg-surface z-20 gap-4 shadow-sm">
      {/* Top Row: Title, Search, and Icons */}
      <div className="flex items-center justify-between gap-4 w-full">
        
        {/* Left: Title & Mobile Burger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary rounded-xl hover:bg-surface-container-highest transition-colors cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="hidden sm:block">
            <h2 className="text-title-lg text-primary font-black tracking-tight leading-none">Kasir</h2>
            <p className="text-label-sm text-on-surface-variant mt-1">Pilih menu pesanan</p>
          </div>
        </div>

        {/* Middle: Search Bar */}
        <div className="flex-1 flex justify-center max-w-xl mx-auto w-full">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari menu..."
              className="w-full pl-12 pr-10 py-3 bg-surface-container-lowest border-2 border-outline-variant/50 focus:border-primary focus:ring-0 rounded-2xl text-body-md text-on-surface placeholder:text-on-surface-variant transition-all shadow-sm hover:border-outline-variant focus:shadow-md min-w-[150px]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container-highest transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Icons (Cart, Notification, Profile) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleCart}
            className="lg:hidden relative p-2 text-on-surface hover:text-primary bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-xl cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                {cartItemsCount}
              </span>
            )}
          </button>
          
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
      </div>

      {/* Bottom Row: Category Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full pb-2">
        {categories.map((category) => {
          const isActive = selectedCategory === category
          return (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className={`px-5 py-2 text-label-md font-semibold transition-all cursor-pointer rounded-xl whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-on-primary bg-primary shadow-md'
                  : 'text-on-surface-variant bg-surface-container-low hover:text-primary hover:bg-surface-container-high border border-outline-variant/30'
              }`}
            >
              {category}
            </button>
          )
        })}
      </div>
    </header>
  )
}
