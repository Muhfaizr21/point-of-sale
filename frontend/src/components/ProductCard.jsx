import React from 'react'

export function ProductCard({ product, onAddToCart }) {
  // Format price helper (e.g. 25000 -> Rp25.000)
  const formatPrice = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('IDR', 'Rp')
  }

  return (
    <div
      onClick={() => onAddToCart(product)}
      className="bg-surface rounded-lg p-sm sm:p-md border border-outline-variant hover:border-primary transition-all duration-200 cursor-pointer flex flex-col group"
    >
      <div className="aspect-video bg-surface-container-highest rounded-md mb-xs sm:mb-sm flex items-center justify-center overflow-hidden">
        <span className="material-symbols-outlined text-[32px] sm:text-[48px] text-on-surface-variant group-hover:text-primary transition-colors">
          {product.icon}
        </span>
      </div>
      
      <div className="flex-1">
        <h3 className="text-body-md sm:text-body-lg text-on-surface mb-xs truncate font-medium">
          {product.name}
        </h3>
        <p className="text-on-surface-variant text-label-sm">
          {product.category}
        </p>
      </div>

      <div className="flex justify-between items-end mt-xs sm:mt-sm">
        <span className="text-body-lg sm:text-headline-md text-primary font-semibold">
          {formatPrice(product.price)}
        </span>
        <button
          type="button"
          aria-label={`Tambah ${product.name}`}
          onClick={(e) => {
            e.stopPropagation() // Prevent triggering card onClick
            onAddToCart(product)
          }}
          className="bg-primary text-on-primary w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-surface-tint transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] sm:text-[20px]">add</span>
        </button>
      </div>
    </div>
  )
}
