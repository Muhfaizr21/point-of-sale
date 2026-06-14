import React, { useState, useEffect } from 'react'
import { apiClient } from '../../../services/apiClient'

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState(''); const [loading, setLoading] = useState(true); const limit = 30

  useEffect(()=>{setLoading(true);const p=new URLSearchParams({page,limit});if(actionFilter)p.set('action',actionFilter)
    apiClient.get(`/api/superadmin/audit-logs?${p}`).then(d=>{setLogs(d.data||[]);setTotal(d.total||0);setTotalPages(d.total_pages||1)}).catch(()=>{}).finally(()=>setLoading(false))
  },[page,actionFilter])

  const actions = [...new Set(logs.map(l=>l.action))]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-bold text-white/90">Audit Trail</h1><p className="text-sm text-white/30 mt-1">Catatan semua aktivitas superadmin & merchant untuk keamanan dan investigasi</p></div></div>

        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <select value={actionFilter} onChange={e=>{setActionFilter(e.target.value);setPage(1)}} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-blue-500/50">
              <option value="" className="bg-[#0a0a0a]">Semua Aksi</option>
              {actions.map(a=><option key={a} value={a} className="bg-[#0a0a0a]">{a}</option>)}
            </select>
            <button onClick={()=>{setActionFilter('');setPage(1)}} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs transition-all cursor-pointer">Reset</button>
            <span className="text-[11px] text-white/30 ml-auto">{total} log</span>
          </div>
        </div>

        {loading?<div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>:<>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="text-[11px] text-white/30 border-b border-white/[0.06]"><th className="text-left py-3 px-4">Waktu</th><th className="text-left py-3 px-4">User</th><th className="text-left py-3 px-4">Role</th><th className="text-left py-3 px-4">Aksi</th><th className="text-left py-3 px-4">Detail</th><th className="text-right py-3 px-4">IP</th></tr></thead>
              <tbody>{logs.map(l=>(<tr key={l.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-[12px]">
                <td className="py-3 px-4 text-white/50 whitespace-nowrap">{new Date(l.created_at).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4 text-white/80">{l.username||'-'}</td>
                <td className="py-3 px-4"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${l.role==='superadmin'?'bg-purple-500/10 text-purple-400':l.role==='owner'?'bg-blue-500/10 text-blue-400':'bg-gray-500/10 text-gray-400'}`}>{l.role||'-'}</span></td>
                <td className="py-3 px-4"><span className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-white/70">{l.action}</span></td>
                <td className="py-3 px-4 text-white/60 max-w-[300px] truncate" title={l.detail||''}>{l.detail||'-'}</td>
                <td className="py-3 px-4 text-right text-white/30 font-mono text-[10px]">{l.ip_address||'-'}</td>
              </tr>))}
              {logs.length===0&&<tr><td colSpan={6} className="text-center py-16 text-white/20">Belum ada log</td></tr>}
              </tbody></table>
          </div>
          {totalPages>1&&<div className="flex items-center justify-center gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-white/50">←</button>
            <span className="text-xs text-white/40">Hal {page}/{totalPages}</span>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-white/50">→</button>
          </div>}
        </>}
      </div>
    </div>
  )
}
