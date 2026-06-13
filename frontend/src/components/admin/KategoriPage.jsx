import React, { useState } from 'react'
import { TopBar } from '../common/TopBar'
import { Input } from '../common/Input'

export function KategoriPage({ categories, addCategory, updateCategory, deleteCategory, onToggleSidebar, loading, error }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  
  const [formName, setFormName] = useState('')
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenAdd = () => {
    setEditingCategory(null)
    setFormName('')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (category) => {
    setEditingCategory(category)
    setFormName(category.name)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim()) return

    setFormError(null)
    setIsSubmitting(true)

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formName)
      } else {
        await addCategory(formName)
      }
      handleCloseModal()
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (category) => {
    if (window.confirm(`Yakin ingin menghapus kategori "${category.name}"?`)) {
      try {
        await deleteCategory(category.id)
      } catch (err) {
        alert(err.message || 'Gagal menghapus kategori')
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-low pb-[72px]">
      {/* Header */}
      <TopBar
        title="Kategori Menu"
        subtitle="Kelola kelompok menu untuk memudahkan pencarian."
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <button
            onClick={handleOpenAdd}
            className="btn-primary shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-xs rounded-full px-lg py-3 font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="hidden sm:inline">Tambah Kategori</span>
          </button>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-lg hide-scrollbar">
        {error && (
          <div className="mb-md p-md bg-error-container text-on-error-container rounded-lg flex items-start gap-sm">
            <span className="material-symbols-outlined">error</span>
            <p className="text-body-md">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {loading && categories.length === 0 ? (
            <div className="col-span-full py-xl text-center text-on-surface-variant flex flex-col items-center justify-center gap-sm">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
              <p className="text-body-lg font-medium">Memuat kategori...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="col-span-full py-2xl text-center text-on-surface-variant flex flex-col items-center justify-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-md">
                <span className="material-symbols-outlined text-[40px]">category</span>
              </div>
              <p className="text-title-lg font-semibold text-on-surface mb-xs">Belum Ada Kategori</p>
              <p className="text-body-md max-w-sm">Tambahkan kategori pertama Anda untuk mulai mengorganisir produk Anda dengan rapi.</p>
              <button
                onClick={handleOpenAdd}
                className="btn-primary mt-lg flex items-center gap-xs"
              >
                <span className="material-symbols-outlined">add</span>
                Buat Kategori
              </button>
            </div>
          ) : (
            categories.map((category) => (
              <div 
                key={category.id} 
                className="group relative bg-surface border border-outline-variant rounded-2xl p-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Decorative background element */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                
                <div className="relative z-10 flex items-start justify-between mb-xl">
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-2xl">category</span>
                  </div>
                  <div className="flex bg-surface-container-highest rounded-full px-sm py-1 shadow-inner text-label-sm font-bold text-on-surface-variant">
                    ID: {category.id}
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-title-lg font-bold text-on-surface mb-md line-clamp-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  
                  <div className="flex items-center gap-sm pt-md border-t border-outline-variant/50">
                    <button
                      onClick={() => handleOpenEdit(category)}
                      className="flex-1 py-2 bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface-variant font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-xs text-label-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 bg-surface-container hover:bg-error hover:text-on-error text-error font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
                      title="Hapus"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Tambah/Edit Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md sm:p-lg bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-[28rem] rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden animate-slide-up border border-outline-variant/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-md border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="text-title-lg font-bold text-on-surface">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-lg bg-surface">
              {formError && (
                <div className="mb-md p-sm bg-error-container text-on-error-container rounded-lg text-body-sm">
                  {formError}
                </div>
              )}

              <form id="categoryForm" onSubmit={handleSubmit} className="flex flex-col gap-md">
                <Input
                  label="Nama Kategori"
                  type="text"
                  placeholder="Contoh: Makanan Berat"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-lg py-md border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-md">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="categoryForm"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full font-semibold bg-primary text-on-primary hover:bg-surface-tint transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
