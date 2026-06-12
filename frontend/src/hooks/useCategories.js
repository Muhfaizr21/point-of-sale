import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/apiClient'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get('/api/categories')
      setCategories(data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = async (categoryName) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.post('/api/categories', { name: categoryName })
      await fetchCategories()
    } catch (err) {
      setError(err.message || 'Gagal menambah kategori')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateCategory = async (id, categoryName) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.put(`/api/categories/${id}`, { name: categoryName })
      await fetchCategories()
    } catch (err) {
      setError(err.message || 'Gagal memperbarui kategori')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (id) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.delete(`/api/categories/${id}`)
      await fetchCategories()
    } catch (err) {
      setError(err.message || 'Gagal menghapus kategori')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetchCategories: fetchCategories,
  }
}
