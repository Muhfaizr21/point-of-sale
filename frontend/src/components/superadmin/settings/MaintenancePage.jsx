import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'

export default function MaintenancePage() {
  const [enabled, setEnabled] = useState(false); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(true); const [notif, setNotif] = useState(null)
  const show=(msg,type='success')=>{setNotif({msg,type});setTimeout(()=>setNotif(null),4000)}

  useEffect(()=>{apiClient.get('/api/superadmin/maintenance').then(d=>{setEnabled(d.maintenance_mode);setMessage(d.maintenance_message||'')}).catch(()=>{}).finally(()=>setLoading(false))},[])

  const save=async()=>{setSaving(true);try{await apiClient.post('/api/superadmin/maintenance',{enabled,message});show(enabled?'Mode maintenance diaktifkan':'Mode maintenance dinonaktifkan')}catch(e){show(e.message,'error')}finally{setSaving(false)}}

  if(loading)return<div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-bold text-white/90">Mode Maintenance</h1><p className="text-sm text-white/30 mt-1">Nonaktifkan akses POS sementara untuk pemeliharaan sistem</p></div></div>

        <div className={`bg-[#0a0a0a] border ${enabled?'border-red-500/30':'border-white/[0.06]'} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${enabled?'bg-red-500/20':'bg-white/5'} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[24px] ${enabled?'text-red-400':'text-white/30'}`}>construction</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white/90">Status: {enabled?'Aktif':'Nonaktif'}</h3>
                <p className="text-xs text-white/40">{enabled?'Semua merchant tidak bisa mengakses POS':'Sistem berjalan normal'}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} className="sr-only peer" />
              <div className={`w-11 h-6 rounded-full peer peer-checked:bg-red-600 bg-gray-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5`} />
            </label>
          </div>

          {enabled&&(
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/80 block mb-2">Pesan Maintenance</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-red-500/50 resize-none placeholder:text-white/20"
                  placeholder="Maaf, sistem sedang dalam perawatan. Silakan coba lagi dalam beberapa saat." />
                <p className="text-[11px] text-white/30 mt-1">Pesan ini akan muncul di layar merchant saat mereka mengakses POS</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span className="text-sm font-semibold">Pratinjau tampilan merchant</span>
                </div>
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 text-center">
                  <span className="material-symbols-outlined text-[48px] text-white/20 block mb-3">construction</span>
                  <p className="text-white/80 font-semibold mb-2">Sistem Sedang dalam Perawatan</p>
                  <p className="text-sm text-white/40">{message||'Maaf, sistem sedang dalam perawatan. Silakan coba lagi nanti.'}</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={save} disabled={saving}
            className={`mt-6 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 w-full ${enabled?'bg-red-600 hover:bg-red-500 text-white':'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {saving?'Menyimpan...':enabled?'Aktifkan Maintenance Mode':'Nonaktifkan Maintenance Mode'}
          </button>
        </div>

        {notif&&<div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up backdrop-blur-md ${notif.type==='error'?'bg-red-500/20 text-red-300 border border-red-500/20':'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'}`}>{notif.msg}</div>}
      </div>
    </div>
  )
}
