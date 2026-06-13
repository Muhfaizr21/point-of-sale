import React from 'react'
import { TopBar } from '../common/TopBar'

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
    <header className="flex flex-col w-full border-b border-outline-variant/40 bg-surface z-20 shadow-sm">
      <TopBar
        title="Kasir"
        subtitle="Pilih menu pesanan"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <>
            <div className="w-full max-w-[200px] md:max-w-[300px] flex-1">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full pl-9 pr-8 py-2 bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-0 rounded-lg text-body-sm text-on-surface placeholder:text-on-surface-variant transition-all hover:border-outline-variant outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-0.5 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCart}
              className="lg:hidden relative p-1.5 text-on-surface hover:text-primary rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-on-primary text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold shadow-sm px-0.5">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </>
        }
      />

      {/* Category Chips */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar px-4 pt-3 pb-3">
        {categories.map((category) => {
          const isActive = selectedCategory === category
          return (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className={`px-3.5 py-1.5 text-label-sm font-semibold transition-all cursor-pointer rounded-lg whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-on-primary bg-primary shadow-sm'
                  : 'text-on-surface-variant bg-surface-container-high hover:text-primary hover:bg-surface-container-highest'
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
