import { useState, useEffect, useMemo, useCallback } from 'react'
import { apiClient } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export function useProducts() {
  const { user } = useAuth()
  const [productsList, setProductsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('Semua')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get('/api/products')
      setProductsList(data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [fetchProducts, user])

  const addProduct = async (product) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.post('/api/products', {
        name: product.name,
        category: product.category,
        price: product.price,
        cost_price: product.cost_price || 0,
        icon: product.icon,
        stock: product.stock !== undefined ? product.stock : 100,
        track_stock: product.track_stock !== false,
        variations: product.variations || [],
      })
      await fetchProducts()
    } catch (err) {
      setError(err.message || 'Gagal menambah produk')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProduct = async (updatedProduct) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.put(`/api/products/${updatedProduct.id}`, {
        name: updatedProduct.name,
        category: updatedProduct.category,
        price: updatedProduct.price,
        cost_price: updatedProduct.cost_price || 0,
        icon: updatedProduct.icon,
        stock: updatedProduct.stock !== undefined ? updatedProduct.stock : 100,
        track_stock: updatedProduct.track_stock !== false,
        variations: updatedProduct.variations || [],
      })
      await fetchProducts()
    } catch (err) {
      setError(err.message || 'Gagal memperbarui produk')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (productId) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.delete(`/api/products/${productId}`)
      await fetchProducts()
    } catch (err) {
      setError(err.message || 'Gagal menghapus produk')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Filtered products list based on search query and category
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      
      const matchesCategory =
        selectedCategory === 'Semua' || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [productsList, searchQuery, selectedCategory])

  return {
    products: filteredProducts,
    allProducts: productsList, // Raw list for management page
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    addProduct,
    updateProduct,
    deleteProduct,
    loading,
    error,
    refetchProducts: fetchProducts,
  }
}
