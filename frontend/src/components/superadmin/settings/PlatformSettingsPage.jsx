import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState({}); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(null); const [notif, setNotif] = useState(null)
  const show=(msg,type='success')=>{setNotif({msg,type});setTimeout(()=>setNotif(null),4000)}

  useEffect(()=>{apiClient.get('/api/superadmin/platform-settings').then(setSettings).catch(()=>{}).finally(()=>setLoading(false))},[])

  const save=async(key,value)=>{setSaving(key);try{await apiClient.post('/api/superadmin/platform-settings',{key,value});show('Pengaturan berhasil disimpan')}catch(e){show(e.message,'error')}finally{setSaving(null)}}

  const fields=[
    {key:'platform_name',label:'Nama Platform',desc:'Nama yang muncul di title browser & email',placeholder:'SentraKas POS'},
    {key:'platform_logo',label:'URL Logo Platform',desc:'Digunakan di login page & email template',placeholder:'https://...logo.png'},
    {key:'platform_favicon',label:'Favicon URL',desc:'Ikon tab browser',placeholder:'https://...favicon.ico'},
    {key:'platform_email',label:'Email Pengirim (Noreply)',desc:'Alamat email untuk notifikasi otomatis',placeholder:'noreply@sentralid.com'},
    {key:'platform_description',label:'Deskripsi Platform',desc:'Meta description untuk SEO & landing page',placeholder:'Platform POS terintegrasi untuk UMKM Indonesia'},
  ]

  if(loading)return<div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-bold text-white/90">Pengaturan Platform</h1><p className="text-sm text-white/30 mt-1">Atur identitas visual & konfigurasi global platform</p></div></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fields.map(f=>(<div key={f.key} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <label className="text-sm font-semibold text-white/80 block mb-1">{f.label}</label>
            <p className="text-[11px] text-white/40 mb-3">{f.desc}</p>
            <div className="flex items-center gap-2">
              <input type="text" defaultValue={settings[f.key]||''} placeholder={f.placeholder} id={`input-${f.key}`}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-white/20" />
              <button onClick={()=>{const v=document.getElementById(`input-${f.key}`)?.value||'';save(f.key,v)}} disabled={saving===f.key}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap">
                {saving===f.key?'...':'Simpan'}
              </button>
            </div>
          </div>))}
        </div>

        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 mt-4">
          <h3 className="text-sm font-semibold text-white/80 mb-3">Pratinjau</h3>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {settings.platform_logo?<img src={settings.platform_logo} alt="" className="w-full h-full object-contain"/>:(
                <span className="material-symbols-outlined text-[24px]">store</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white/90">{settings.platform_name||'SentraKas POS'}</p>
              <p className="text-[11px] text-white/40">{settings.platform_description||'Platform POS terintegrasi'}</p>
            </div>
          </div>
        </div>

        {notif&&<div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up backdrop-blur-md ${notif.type==='error'?'bg-red-500/20 text-red-300 border border-red-500/20':'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'}`}>{notif.msg}</div>}
      </div>
    </div>
  )
}
