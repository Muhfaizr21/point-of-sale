import React, { useState } from 'react'
import { API_BASE_URL } from '../services/apiClient'

export function ProductCard({ product, onAddToCart }) {
  const [imgError, setImgError] = useState(false)

  const formatPrice = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('IDR', 'Rp')
  }

  const hasImage = product.icon && (product.icon.startsWith('/') || product.icon.startsWith('http')) && !imgError
  const hasVariations = product.variations && product.variations.length > 0
  const lowStock = product.stock !== undefined && product.stock <= 5

  return (
    <div
      onClick={() => onAddToCart(product)}
      className="bg-surface rounded-lg p-sm sm:p-md border border-outline-variant hover:border-primary transition-all duration-200 cursor-pointer flex flex-col group relative"
    >
      {lowStock && (
        <span className="absolute top-2 right-2 z-10 bg-error text-on-error text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
          Sisa {product.stock}
        </span>
      )}

      <div className="aspect-video bg-surface-container-highest rounded-md mb-xs sm:mb-sm flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img
            src={product.icon.startsWith('/') ? `${API_BASE_URL}${product.icon}` : product.icon}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="material-symbols-outlined text-[32px] sm:text-[48px] text-on-surface-variant group-hover:text-primary transition-colors">
            {product.icon || 'restaurant'}
          </span>
        )}
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
        <div className="flex flex-col">
          {hasVariations && <span className="text-label-sm text-on-surface-variant">Mulai dari</span>}
          <span className="text-body-lg sm:text-headline-md text-primary font-semibold">
            {formatPrice(product.price)}
          </span>
        </div>
        <button
          type="button"
          aria-label={hasVariations ? `Pilih variasi ${product.name}` : `Tambah ${product.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart(product)
          }}
          className="bg-primary text-on-primary w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-surface-tint transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] sm:text-[20px]">
            {hasVariations ? 'list_alt' : 'add'}
          </span>
        </button>
      </div>
    </div>
  )
}
