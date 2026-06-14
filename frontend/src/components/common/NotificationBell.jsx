import React, { useState, useEffect, useRef, useCallback } from 'react'
import { apiClient } from '../../services/apiClient'
import { useAuth } from '../../context/AuthContext'

export function NotificationBell() {
  const { user } = useAuth()
  const [unread, setUnread] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const fetchUnread = useCallback(async () => {
    if (!user || (user.role !== 'owner' && user.role !== 'cashier')) return
    try {
      const data = await apiClient.get('/api/broadcasts/unread')
      setUnread(data || [])
    } catch {}
  }, [user])

  useEffect(() => { fetchUnread(); const iv = setInterval(fetchUnread, 30000); return () => clearInterval(iv) }, [fetchUnread])

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post(`/api/broadcasts/${id}/read`)
      setUnread(prev => prev.filter(b => b.id !== id))
    } catch {}
  }

  if (!user || (user.role !== 'owner' && user.role !== 'cashier')) return null

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer">
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest">
            <p className="text-body-sm font-semibold text-on-surface">Notifikasi</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {unread.length > 0 ? unread.map(b => (
              <div key={b.id} className="px-4 py-3 border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">campaign</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-on-surface">{b.title}</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5 line-clamp-2">{b.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-label-xs text-on-surface-variant/60">{new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      <button onClick={() => handleMarkRead(b.id)}
                        className="text-label-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer">Tandai dibaca</button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/30 block mx-auto mb-2">notifications_off</span>
                Tidak ada notifikasi baru
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
