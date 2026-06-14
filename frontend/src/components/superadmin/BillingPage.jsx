import React, { useState, useEffect, useMemo } from 'react'
import { apiClient } from '../../services/apiClient'

const rp = (v) => { if (!v && v !== 0) return '-'; if (v >= 1e9) return `Rp${(v/1e9).toFixed(1)}M`; if (v >= 1e6) return `Rp${(v/1e6).toFixed(1)}JT`; return `Rp${v.toLocaleString('id-ID')}` }
const fmt = (v) => (v||0).toLocaleString('id-ID')

export function BillingPage() {
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState(null)
  const [showAssign, setShowAssign] = useState(false)
  const [assign, setAssign] = useState({ merchant_id: 0, plan_id: 0, billing_period: 'monthly' })
  const [editPlan, setEditPlan] = useState(null)

  const show = (msg, type='success') => { setNotif({msg,type}); setTimeout(()=>setNotif(null),4000) }

  const fetchAll = async () => {
    try {
      const [p, s, m] = await Promise.all([
        apiClient.get('/api/subscriptions/plans'),
        apiClient.get('/api/subscriptions'),
        apiClient.get('/api/merchants'),
      ])
      setPlans(p||[]); setSubscriptions(s||[]); setMerchants(m||[])
    } catch(e){console.error(e)} finally { setLoading(false) }
  }
  useEffect(()=>{fetchAll()},[])

  const subMap = useMemo(() => {
    const map = {}
    subscriptions.forEach(s => { map[s.merchant_id] = s })
    return map
  }, [subscriptions])

  const totalMRR = useMemo(() => subscriptions.reduce((sum, s) => {
    if (s.status !== 'active') return sum
    const price = s.billing_period === 'yearly' ? (s.plan?.price_yearly || 0) / 12 : (s.plan?.price_monthly || 0)
    return sum + price
  }, 0), [subscriptions])

  const handleAssign = async () => {
    if (!assign.merchant_id || !assign.plan_id) return
    try {
      await apiClient.post('/api/subscriptions/assign', assign)
      setShowAssign(false); setAssign({merchant_id:0,plan_id:0,billing_period:'monthly'})
      await fetchAll(); show('Langganan berhasil ditetapkan')
    } catch(e) { show(e.message,'error') }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await apiClient.put(`/api/subscriptions/plans/${editPlan.id}`, {
        name: editPlan.name,
        code: editPlan.code,
        price_monthly: parseInt(editPlan.price_monthly),
        price_yearly: parseInt(editPlan.price_yearly),
        max_branches: parseInt(editPlan.max_branches),
        max_users: parseInt(editPlan.max_users),
        features: (typeof editPlan.features === 'string' ? editPlan.features : '').split('\n').filter(f=>f.trim()!=='')
      })
      setEditPlan(null)
      await fetchAll()
      show('Paket berhasil diperbarui')
    } catch(err) { show(err.message, 'error') }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-[48px] text-white/20">sync</span></div>
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white/90">Langganan & Tagihan</h1>
            <p className="text-sm text-white/30 mt-1">{subscriptions.length} langganan aktif · {plans.length} paket tersedia</p>
          </div>
          <button onClick={()=>setShowAssign(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-[18px]">assignment</span>Atur Langganan</button>
        </div>

        {/* MRR KPI */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-600/15 to-emerald-900/5 border border-emerald-500/15 rounded-xl p-5">
            <p className="text-xs text-emerald-300/70 uppercase tracking-wider font-semibold">Monthly MRR</p>
            <h2 className="text-2xl font-black text-emerald-400 mt-1">{rp(totalMRR)}</h2>
            <p className="text-xs text-white/30 mt-1">dari {subscriptions.filter(s=>s.status==='active').length} langganan aktif</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/15 to-blue-900/5 border border-blue-500/15 rounded-xl p-5">
            <p className="text-xs text-blue-300/70 uppercase tracking-wider font-semibold">Total Paket</p>
            <h2 className="text-2xl font-black text-blue-400 mt-1">{plans.length}</h2>
            <p className="text-xs text-white/30 mt-1">paket tersedia</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600/15 to-purple-900/5 border border-purple-500/15 rounded-xl p-5">
            <p className="text-xs text-purple-300/70 uppercase tracking-wider font-semibold">Merchant</p>
            <h2 className="text-2xl font-black text-purple-400 mt-1">{merchants.length}</h2>
            <p className="text-xs text-white/30 mt-1">total terdaftar</p>
          </div>
          <div className="bg-gradient-to-br from-amber-600/15 to-amber-900/5 border border-amber-500/15 rounded-xl p-5">
            <p className="text-xs text-amber-300/70 uppercase tracking-wider font-semibold">Trial</p>
            <h2 className="text-2xl font-black text-amber-400 mt-1">{subscriptions.filter(s=>s.status==='trial').length}</h2>
            <p className="text-xs text-white/30 mt-1">masa percobaan</p>
          </div>
        </div>

        {/* ASSIGN MODAL */}
        {showAssign && (
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-white/80 mb-4">Atur Langganan Merchant</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <select value={assign.merchant_id} onChange={e=>setAssign({...assign,merchant_id:parseInt(e.target.value)})}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 cursor-pointer">
                <option value={0}>Pilih Merchant</option>
                {merchants.map(m=><option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
              </select>
              <select value={assign.plan_id} onChange={e=>setAssign({...assign,plan_id:parseInt(e.target.value)})}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 cursor-pointer">
                <option value={0}>Pilih Paket</option>
                {plans.map(p=><option key={p.id} value={p.id}>{p.name} - {rp(p.price_monthly)}/bln</option>)}
              </select>
              <select value={assign.billing_period} onChange={e=>setAssign({...assign,billing_period:e.target.value})}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 cursor-pointer">
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan (hemat 2x)</option>
              </select>
              <button onClick={handleAssign}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer">Simpan</button>
            </div>
            <button onClick={()=>setShowAssign(false)} className="text-xs text-white/30 hover:text-white/60 cursor-pointer">Batal</button>
          </div>
        )}

        {/* PLANS CARD */}
        <h2 className="text-sm font-semibold text-white/70 mb-4">Paket Langganan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map((p,i)=>(
            <div key={p.id} className={`bg-[#0a0a0a] border rounded-xl p-6 ${i===1?'border-blue-500/30 bg-blue-500/[0.03]':'border-white/[0.06]'}`}>
              {i===1&&<span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full mb-3 inline-block">POPULER</span>}
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white/90">{p.name}</h3>
                <button onClick={() => setEditPlan({...p, features: (p.features||[]).join('\n')})} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
              <div className="mt-3 mb-4"><span className="text-3xl font-black text-white">{rp(p.price_monthly)}</span><span className="text-sm text-white/40 ml-1">/bulan</span></div>
              {p.price_yearly>0&&<p className="text-xs text-emerald-400/70 mb-4">{rp(p.price_yearly)}/tahun (hemat {Math.round((1-p.price_yearly/(p.price_monthly*12))*100)}%)</p>}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-emerald-400 text-[14px]">check_circle</span><span className="text-white/70">Maks {p.max_branches} toko</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-emerald-400 text-[14px]">check_circle</span><span className="text-white/70">Maks {p.max_users} pengguna</span></div>
                {(p.features||[]).map((f,j)=>(
                  <div key={j} className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-emerald-400 text-[14px]">check_circle</span><span className="text-white/70">{f}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* SUBSCRIPTIONS TABLE */}
        <h2 className="text-sm font-semibold text-white/70 mb-4">Daftar Langganan Merchant</h2>
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-white/30 text-[11px] uppercase tracking-wider border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left py-4 px-5 font-semibold">Merchant</th>
                <th className="text-left py-4 px-5 font-semibold">Paket</th>
                <th className="text-center py-4 px-5 font-semibold">Periode</th>
                <th className="text-right py-4 px-5 font-semibold">Harga</th>
                <th className="text-right py-4 px-5 font-semibold">Berakhir</th>
                <th className="text-center py-4 px-5 font-semibold">Status</th>
              </tr></thead>
              <tbody>
                {subscriptions.map(s=>(
                  <tr key={s.id} className="border-b border-white/[0.04] text-white/70 hover:bg-white/[0.02]">
                    <td className="py-4 px-5"><div><p className="text-sm font-semibold text-white/80">{s.merchant?.name||'-'}</p><p className="text-[10px] text-white/30">{s.merchant?.code||''}</p></div></td>
                    <td className="py-4 px-5"><span className="text-sm font-semibold text-white/80">{s.plan?.name||'-'}</span></td>
                    <td className="py-4 px-5 text-center"><span className="text-xs text-white/50 capitalize">{s.billing_period}</span></td>
                    <td className="py-4 px-5 text-right"><span className="text-sm font-semibold text-white/80">{rp(s.billing_period==='yearly'?s.plan?.price_yearly||0:s.plan?.price_monthly||0)}</span></td>
                    <td className="py-4 px-5 text-right"><span className="text-xs text-white/50">{new Date(s.end_date).toLocaleDateString('id-ID')}</span></td>
                    <td className="py-4 px-5 text-center">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                        s.status==='active'?'bg-emerald-500/10 text-emerald-400':
                        s.status==='trial'?'bg-amber-500/10 text-amber-400':
                        s.status==='expired'?'bg-red-500/10 text-red-400':'bg-white/5 text-white/40'
                      }`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
                {subscriptions.length===0&&<tr><td colSpan={6} className="py-12 text-center text-white/20 text-sm">Belum ada langganan</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center text-[11px] text-white/[0.08] py-6 mt-6 border-t border-white/[0.04]">Langganan & Tagihan · SentraKas Platform · {new Date().getFullYear()}</div>
      </div>

      {/* EDIT PLAN MODAL */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Edit Paket {editPlan.name}</h3>
              <button onClick={()=>setEditPlan(null)} className="text-white/40 hover:text-white cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Nama Paket</label>
                  <input required value={editPlan.name} onChange={e=>setEditPlan({...editPlan,name:e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Kode Paket</label>
                  <input required value={editPlan.code} onChange={e=>setEditPlan({...editPlan,code:e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Harga Bulanan (Rp)</label>
                  <input required type="number" value={editPlan.price_monthly} onChange={e=>setEditPlan({...editPlan,price_monthly:e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Harga Tahunan (Rp)</label>
                  <input required type="number" value={editPlan.price_yearly} onChange={e=>setEditPlan({...editPlan,price_yearly:e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Maksimal Toko</label>
                  <input required type="number" value={editPlan.max_branches} onChange={e=>setEditPlan({...editPlan,max_branches:e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Maksimal Pengguna</label>
                  <input required type="number" value={editPlan.max_users} onChange={e=>setEditPlan({...editPlan,max_users:e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Fitur (Pisahkan dengan Enter)</label>
                <textarea rows={5} value={editPlan.features} onChange={e=>setEditPlan({...editPlan,features:e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={()=>setEditPlan(null)} className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white cursor-pointer">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 cursor-pointer">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notif&&(<div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up backdrop-blur-md ${notif.type==='error'?'bg-red-500/20 text-red-300 border border-red-500/20':'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'}`}>{notif.msg}</div>)}
    </div>
  )
}
