import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export function useBundles() {
  const { user } = useAuth()
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBundles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get('/api/bundles')
      setBundles(data || [])
    } catch (err) {
      console.error('Failed to fetch bundles:', err)
      setError(err.message || 'Gagal memuat data paket bundling')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchBundles()
    }
  }, [fetchBundles, user])

  return { bundles, refetchBundles: fetchBundles, loading }
}
