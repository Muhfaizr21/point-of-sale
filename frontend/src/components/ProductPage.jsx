import React, { useState, useMemo } from 'react'
import { Button } from './common/Button'
import { Input } from './common/Input'

const ICON_OPTIONS = [
  { value: 'restaurant', label: 'Makanan / Restoran' },
  { value: 'local_cafe', label: 'Kopi / Kafe' },
  { value: 'set_meal', label: 'Lauk / Ikan' },
  { value: 'bakery_dining', label: 'Roti / Kue' },
  { value: 'icecream', label: 'Es Krim / Dessert' },
  { value: 'local_bar', label: 'Minuman Segar' },
]

export function ProductPage({
  products,
  addProduct,
  updateProduct,
  deleteProduct,
  onToggleSidebar,
  loading,
  error,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  // Form State
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('Makanan')
  const [formPrice, setFormPrice] = useState('')
  const [formIcon, setFormIcon] = useState('restaurant')

  // Format price helper
  const formatPrice = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('IDR', 'Rp')
  }

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingProduct(null)
    setFormName('')
    setFormCategory('Makanan')
    setFormPrice('')
    setFormIcon('restaurant')
    setIsModalOpen(true)
  }

  // Open modal for edit
  const handleOpenEdit = (product) => {
    setEditingProduct(product)
    setFormName(product.name)
    setFormCategory(product.category)
    setFormPrice(product.price.toString())
    setFormIcon(product.icon)
    setIsModalOpen(true)
  }

  // Handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formName || !formPrice) return

    const productData = {
      id: editingProduct ? editingProduct.id : undefined,
      name: formName,
      category: formCategory,
      price: parseInt(formPrice, 10),
      icon: formIcon,
    }

    try {
      if (editingProduct) {
        await updateProduct(productData)
      } else {
        await addProduct(productData)
      }
      setIsModalOpen(false)
    } catch (err) {
      alert(`Gagal menyimpan produk: ${err.message}`)
    }
  }

  // Filtered list for local search
  const filteredList = useMemo(() => {
    return products.filter((prod) =>
      prod.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      {/* Top Header */}
      <header className="flex justify-between items-center px-lg py-md h-[72px] w-full border-b border-outline-variant bg-surface z-20">
        <div className="flex items-center gap-md">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer mr-2 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="text-headline-md text-on-surface font-semibold">Manajemen Produk</h2>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="rounded-lg font-headline-md font-semibold text-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center gap-2 cursor-pointer bg-primary text-on-primary hover:bg-surface-tint py-2 px-4"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Produk
        </button>
      </header>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {/* Search filter row */}
        <div className="mb-md flex gap-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk..."
            icon="search"
            className="max-w-md w-full"
          />
        </div>

        {/* Responsive Table Wrapper */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant text-label-sm text-on-surface-variant">
                  <th className="p-md font-semibold">Ikon</th>
                  <th className="p-md font-semibold">Nama Produk</th>
                  <th className="p-md font-semibold">Kategori</th>
                  <th className="p-md font-semibold">Harga</th>
                  <th className="p-md font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-xl text-center text-primary">
                      <div className="flex justify-center items-center gap-sm">
                        <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                        <span className="text-body-lg font-medium">Memuat data produk...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="p-xl text-center text-error">
                      <span className="material-symbols-outlined text-[48px] block mb-xs">error</span>
                      <p className="text-body-lg font-medium">Gagal memuat produk: {error}</p>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-xl text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[48px] block mb-xs">inventory_2</span>
                      Belum ada data produk.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((product) => (
                    <tr key={product.id} className="hover:bg-surface-container-low transition-colors text-body-md text-on-surface">
                      {/* Icon */}
                      <td className="p-md">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined">{product.icon}</span>
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
      </div>

      {/* Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Form Modal Box */}
          <div className="bg-surface rounded-2xl w-full max-w-md border border-outline-variant shadow-2xl relative z-10 overflow-hidden">
            <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-headline-md font-semibold text-on-surface">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container-highest cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-md space-y-md bg-surface">
              {/* Product Name Input */}
              <div className="space-y-1">
                <label className="text-label-sm font-semibold text-on-surface-variant block">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Kopi Susu Aren"
                  className="w-full px-4 py-2 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant"
                />
              </div>

              {/* Category Select */}
              <div className="space-y-1">
                <label className="text-label-sm font-semibold text-on-surface-variant block">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-md font-body-md text-on-surface"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                </select>
              </div>

              {/* Price Input */}
              <div className="space-y-1">
                <label className="text-label-sm font-semibold text-on-surface-variant block">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="Contoh: 15000"
                  className="w-full px-4 py-2 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant"
                />
              </div>

              {/* Icon Select with Symbol Preview */}
              <div className="space-y-1">
                <label className="text-label-sm font-semibold text-on-surface-variant block">Ikon Tampilan</label>
                <div className="flex gap-md items-center">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary text-[28px] border border-outline-variant">
                    <span className="material-symbols-outlined">{formIcon}</span>
                  </div>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="flex-1 px-4 py-2 border border-outline-variant bg-surface-container-high focus:border-primary focus:ring-0 rounded-lg text-body-md font-body-md text-on-surface"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-sm flex gap-md border-t border-outline-variant mt-lg">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border-2 border-primary text-primary hover:bg-surface-tint/10 bg-surface-container-lowest font-headline-md font-semibold text-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-primary text-on-primary hover:bg-surface-tint font-headline-md font-semibold text-lg cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
