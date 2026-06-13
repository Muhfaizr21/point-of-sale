import React, { useState, useMemo, useEffect } from 'react'
import { TopBar } from '../common/TopBar'
import { Input } from '../common/Input'
import { apiClient, API_BASE_URL } from '../../services/apiClient'

export function ProductPage({
  products,
  categories,
  addProduct,
  updateProduct,
  deleteProduct,
  onToggleSidebar,
  loading,
  error,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  // Form state
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('Makanan')
  const [formPrice, setFormPrice] = useState('')
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formVariations, setFormVariations] = useState([])
  const [formIcon, setFormIcon] = useState('restaurant')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [formStock, setFormStock] = useState('')
  const [formTrackStock, setFormTrackStock] = useState(true)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter & Sort States
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, sortField, sortDirection])

  // Format price helper
  const formatPrice = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('IDR', 'Rp')
  }

  // Format input helper
  const formatInputValue = (val) => {
    if (!val) return ''
    return parseInt(val, 10).toLocaleString('id-ID')
  }

  const handlePriceChange = (value, setter) => {
    const numericValue = value.replace(/\D/g, '')
    setter(numericValue)
  }

  // Navigate to add page (now opens modal)
  const handleOpenAdd = () => {
    setEditingProduct(null)
    setFormName('')
    setFormCategory(categoryNames.find(c => c !== 'Semua') || '')
    setFormPrice('')
    setFormCostPrice('')
    setFormVariations([])
    setFormIcon('restaurant')
    setFormStock('')
    setFormTrackStock(true)
    setImageFile(null)
    setImagePreview('')
    setFormError(null)
    setIsModalOpen(true)
  }

  // Navigate to edit page (now opens modal)
  const handleOpenEdit = (product) => {
    setEditingProduct(product)
    setFormName(product.name)
    setFormCategory(product.category)
    setFormPrice(product.price.toString())
    setFormCostPrice(product.cost_price?.toString() || '')
    setFormVariations(product.variations || [])
    setFormIcon(product.icon || 'restaurant')
    setFormStock(product.stock?.toString() || '')
    setFormTrackStock(product.track_stock !== false)
    setImageFile(null)
    if (product.icon && (product.icon.startsWith('/') || product.icon.startsWith('http'))) {
      setImagePreview(product.icon.startsWith('/') ? `${API_BASE_URL}${product.icon}` : product.icon)
    } else {
      setImagePreview('')
    }
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let basePrice = 0
    if (formVariations.length > 0) {
      const variationPrices = formVariations.map(v => parseInt(v.price, 10)).filter(p => !isNaN(p))
      if (variationPrices.length > 0) {
        basePrice = Math.min(...variationPrices)
      }
    } else {
      if (!formPrice) return
      basePrice = parseInt(formPrice, 10)
    }

    if (!formName) return
    
    setFormError(null)
    setIsSubmitting(true)

    try {
      let iconUrl = formIcon

      // If user uploaded a new image file
      if (imageFile) {
        const uploadRes = await apiClient.uploadFile('/api/upload', imageFile)
        iconUrl = uploadRes.url
      }

      const productData = {
        id: editingProduct ? editingProduct.id : undefined,
        name: formName,
        category: formCategory,
        price: basePrice,
        cost_price: parseInt(formCostPrice, 10) || 0,
        icon: iconUrl,
        stock: parseInt(formStock) || 0,
        track_stock: formTrackStock,
        variations: formVariations.map(v => ({ name: v.name, price: parseInt(v.price, 10) })),
      }

      if (editingProduct) {
        await updateProduct(productData)
      } else {
        await addProduct(productData)
      }
      handleCloseModal()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Use categories passed from props (array of category objects) instead of deriving from products
  const categoryNames = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return ['Semua']
    return ['Semua', ...categories.map(c => typeof c === 'string' ? c : c.name)]
  }, [categories])

  // Filtered and Sorted list for local search & filter
  const processedList = useMemo(() => {
    // 1. Filter by Search Query
    let result = products.filter((prod) =>
      prod.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 2. Filter by Category
    if (selectedCategory !== 'Semua') {
      result = result.filter((prod) => prod.category === selectedCategory)
    }

    // 3. Sort
    result.sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [products, searchQuery, selectedCategory, sortField, sortDirection])

  // Pagination Logic
  const totalPages = Math.ceil(processedList.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return processedList.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [processedList, currentPage])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      {/* Top Header */}
      <TopBar
        title="Manajemen Produk"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-lg font-headline-md font-semibold text-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center gap-2 cursor-pointer bg-primary text-on-primary hover:bg-surface-tint py-2 px-4"
          >
            <span className="material-symbols-outlined">add</span>
            Tambah Produk
          </button>
        }
      />

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {/* Search filter row */}
        <div className="mb-md flex flex-col sm:flex-row gap-md sm:items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk..."
              icon="search"
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-xs">
            <span className="text-body-md font-semibold text-on-surface-variant">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-surface-container-high border border-outline-variant rounded-full text-on-surface focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer pr-10"
            >
              {categoryNames.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold w-16">Ikon</th>
                  <th 
                    className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-xs">
                      Nama Produk
                      {sortField === 'name' && (
                        <span className="material-symbols-outlined text-[16px] font-bold">
                          {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-xs">
                      Kategori
                      {sortField === 'category' && (
                        <span className="material-symbols-outlined text-[16px] font-bold">
                          {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-xs">
                      Harga Jual
                      {sortField === 'price' && (
                        <span className="material-symbols-outlined text-[16px] font-bold">
                          {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="p-md font-semibold text-on-surface-variant">
                    <div className="flex items-center gap-xs">
                      Harga Modal
                    </div>
                  </th>
                  <th 
                    className="p-md font-semibold cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center gap-xs">
                      Stok
                      {sortField === 'stock' && (
                        <span className="material-symbols-outlined text-[16px] font-bold">
                          {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="p-md font-semibold text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-xl text-center text-primary">
                      <div className="flex justify-center items-center gap-sm">
                        <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                        <span className="text-body-lg font-medium">Memuat data produk...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="p-xl text-center text-error">
                      <span className="material-symbols-outlined text-[48px] block mb-xs">error</span>
                      <p className="text-body-lg font-medium">Gagal memuat produk: {error}</p>
                    </td>
                  </tr>
                ) : processedList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-xl text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[48px] block mb-xs">inventory_2</span>
                      Belum ada data produk yang cocok.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                      {/* Icon */}
                      <td className="p-md">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant overflow-hidden">
                          {product.icon && (product.icon.startsWith('/') || product.icon.startsWith('http')) ? (
                            <img
                              src={product.icon.startsWith('/') ? `${API_BASE_URL}${product.icon}` : product.icon}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined">{product.icon || 'restaurant'}</span>
                          )}
                        </div>
                      </td>
                      {/* Name */}
                      <td className="p-md font-medium">{product.name}</td>
                      {/* Category */}
                      <td className="p-md">
                        <span className="px-3 py-1 bg-surface-container-high border border-outline-variant/30 rounded-full text-label-sm">
                          {product.category}
                        </span>
                      </td>
                      {/* Price */}
                      <td className="p-md font-semibold">{formatPrice(product.price)}</td>
                      {/* Cost Price */}
                      <td className="p-md text-on-surface-variant">{formatPrice(product.cost_price || 0)}</td>
                      {/* Stock */}
                      <td className="p-md">
                        {product.track_stock === false ? (
                          <span className="px-3 py-1 bg-surface-container-high border border-outline-variant/30 rounded-full text-label-sm text-on-surface-variant">
                            Unlimited
                          </span>
                        ) : (
                          <span className={`font-semibold ${product.stock <= 5 ? 'text-error' : product.stock <= 20 ? 'text-warning' : 'text-on-surface'}`}>
                            {product.stock}
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="p-md text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-full cursor-pointer mr-1"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Hapus produk ${product.name}?`)) {
                              try {
                                await deleteProduct(product.id)
                              } catch (err) {
                                alert(`Gagal menghapus produk: ${err.message}`)
                              }
                            }
                          }}
                          className="p-2 text-error hover:bg-error/10 rounded-full cursor-pointer"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {processedList.length > 0 && (
          <div className="mt-md flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant font-medium">
              Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, processedList.length)} dari {processedList.length} produk
            </span>
            <div className="flex items-center gap-xs">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors disabled:opacity-50 cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                // Show current, first, last, and pages around current
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-body-sm font-bold transition-colors cursor-pointer ${
                        currentPage === page 
                          ? 'bg-primary text-on-primary' 
                          : 'text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                
                // Show ellipsis
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={i} className="text-on-surface-variant px-1">...</span>;
                }
                
                return null;
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors disabled:opacity-50 cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Popup with Blurred Background */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden animate-slide-up border border-outline-variant/30">
            {/* Modal Header */}
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-lg bg-surface">
              {formError && (
                <div className="mb-lg p-4 bg-error-container text-on-error-container rounded-lg font-medium">
                  Error: {formError}
                </div>
              )}

              <form id="productForm" onSubmit={handleSubmit} className="space-y-xl">
                <div className="space-y-2">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Kopi Susu Aren"
                    className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-lg font-body-lg text-on-surface"
                  >
                    {categoryNames.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {formVariations.length === 0 && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-2 flex-1">
                      <label className="text-label-lg font-semibold text-on-surface-variant block">Harga Jual (Rp)</label>
                      <input
                        type="text"
                        required
                        value={formatInputValue(formPrice)}
                        onChange={(e) => handlePriceChange(e.target.value, setFormPrice)}
                        placeholder="Contoh: 15.000"
                        className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="text-label-lg font-semibold text-on-surface-variant block">Harga Modal (Rp)</label>
                      <input
                        type="text"
                        value={formatInputValue(formCostPrice)}
                        onChange={(e) => handlePriceChange(e.target.value, setFormCostPrice)}
                        placeholder="Contoh: 10.000"
                        className="w-full px-4 py-3 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Stok</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      placeholder="0"
                      disabled={!formTrackStock}
                      className="w-32 px-3 py-2 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant disabled:opacity-50"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formTrackStock}
                        onChange={(e) => {
                          setFormTrackStock(e.target.checked)
                          if (!e.target.checked) setFormStock('')
                        }}
                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-body-sm text-on-surface-variant">Lacak stok</span>
                    </label>
                  </div>
                  {!formTrackStock && (
                    <p className="text-label-xs text-on-surface-variant">Stok produk ini tidak akan dilacak (unlimited)</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-label-lg font-semibold text-on-surface-variant block">Variasi Produk (Opsional)</label>
                    <button
                      type="button"
                      onClick={() => setFormVariations([...formVariations, { name: '', price: '' }])}
                      className="text-primary text-label-sm font-semibold hover:bg-primary/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Tambah
                    </button>
                  </div>
                  {formVariations.length > 0 && (
                    <div className="space-y-2">
                      {formVariations.map((v, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            required
                            value={v.name}
                            onChange={(e) => {
                              const newV = [...formVariations]
                              newV[index].name = e.target.value
                              setFormVariations(newV)
                            }}
                            placeholder="Nama Variasi (misal: Large)"
                            className="flex-1 px-3 py-2 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-md text-on-surface"
                          />
                          <input
                            type="text"
                            required
                            value={formatInputValue(v.price)}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/\D/g, '')
                              const newV = [...formVariations]
                              newV[index].price = numericValue
                              setFormVariations(newV)
                            }}
                            placeholder="Harga Variasi"
                            className="flex-1 px-3 py-2 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-md text-on-surface"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newV = formVariations.filter((_, i) => i !== index)
                              setFormVariations(newV)
                            }}
                            className="p-2 text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-label-lg font-semibold text-on-surface-variant block">Gambar Produk</label>
                  <div className="flex gap-md items-center">
                    <div className="w-20 h-20 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-[36px] border border-outline-variant shadow-sm overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-[36px]">image</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-xs">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload-input"
                      />
                      <label
                        htmlFor="image-upload-input"
                        className="px-4 py-2 border border-dashed border-outline-variant hover:border-primary rounded-lg text-center cursor-pointer transition-colors text-body-md font-medium text-on-surface-variant hover:text-primary flex items-center justify-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-[20px]">upload</span>
                        {imageFile ? 'Ganti Gambar' : 'Pilih Gambar Produk'}
                      </label>
                      {imageFile && (
                        <span className="text-label-sm text-primary font-medium truncate max-w-[200px]">
                          {imageFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-md border-t border-outline-variant flex justify-end gap-md bg-surface-container-lowest">
              <button
                type="button"
                onClick={handleCloseModal}
                className="py-3 px-6 rounded-xl font-headline-md font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={isSubmitting}
                className="py-3 px-6 rounded-xl bg-primary text-on-primary hover:bg-surface-tint font-headline-md font-semibold cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
