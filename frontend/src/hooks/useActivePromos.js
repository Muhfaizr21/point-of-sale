import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiClient } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export function useActivePromos() {
  const { user } = useAuth()
  const [promos, setPromos] = useState([])

  const fetchPromos = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/promos')
      setPromos(data?.filter(p => p.active) || [])
    } catch { setPromos([]) }
  }, [])

  useEffect(() => {
    if (user) {
      fetchPromos()
    }
  }, [fetchPromos, user])

  const activeNow = useMemo(() => {
    const now = new Date()
    const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const curDay = now.getDay()

    return promos.filter(p => {
      if (p.day_of_week) {
        const days = p.day_of_week.split(',')
        if (!days.includes(String(curDay))) return false
      }
      if (p.time_start && p.time_end) {
        if (p.time_start <= p.time_end) {
          if (curTime < p.time_start || curTime > p.time_end) return false
        } else {
          if (curTime < p.time_start && curTime > p.time_end) return false
        }
      }
      return true
    })
  }, [promos])

  return { promos: activeNow, allPromos: promos, refetch: fetchPromos }
}
