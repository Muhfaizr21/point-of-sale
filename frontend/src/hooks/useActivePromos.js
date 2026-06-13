import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export function useActivePromos() {
  const { user } = useAuth()
  const [promos, setPromos] = useState([])

  const fetchPromos = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/promos/active')
      setPromos(data || [])
    } catch { setPromos([]) }
  }, [])

  useEffect(() => {
    if (user) {
      fetchPromos()
    }
  }, [fetchPromos, user])

  return { promos, allPromos: promos, refetch: fetchPromos }
}
