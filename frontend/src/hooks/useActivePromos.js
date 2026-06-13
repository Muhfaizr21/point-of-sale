import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export function useActivePromos(branchId) {
  const { user } = useAuth()
  const [promos, setPromos] = useState([])

  const fetchPromos = useCallback(async () => {
    try {
      const data = await apiClient.get(`/api/promos/active${branchId ? `?branch_id=${branchId}` : ''}`)
      setPromos(data || [])
    } catch { setPromos([]) }
  }, [branchId])

  useEffect(() => {
    if (user) {
      fetchPromos()
    }
  }, [fetchPromos, user])

  return { promos, allPromos: promos, refetch: fetchPromos }
}
