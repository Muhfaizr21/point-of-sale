import React, { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiClient } from '../../services/apiClient'

const rp = (v) => { if (!v && v !== 0) return '-'; if (v >= 1e9) return `Rp${(v/1e9).toFixed(1)}M`; if (v >= 1e6) return `Rp${(v/1e6).toFixed(1)}JT`; return `Rp${v.toLocaleString('id-ID')}` }
const fmt = (v) => (v||0).toLocaleString('id-ID')

const CTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length)return null
  return(<div className="bg-[#1a1a1a]/95 border border-white/10 rounded-lg px-4 py-3 shadow-2xl backdrop-blur-md"><p className="text-xs text-white/40 mb-1">{label}</p>{payload.map((p,i)=><p key={i} className="text-sm font-semibold" style={{color:p.color}}>{p.name}: {typeof p.value==='number'?rp(p.value):p.value}</p>)}</div>)
}

export function MerchantsPage() {
  const [merchants, setMerchants] = useState([]); const [branches, setBranches] = useState([])
  const [users, setUsers] = useState([]); const [analytics, setAnalytics] = useState(null)
  const [products, setProducts] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({name:'',code:'',email:'',phone:''})
  const [selected, setSelected] = useState(null); const [notif, setNotif] = useState(null)
  const show = (msg,type='success')=>{setNotif({msg,type});setTimeout(()=>setNotif(null),4000)}

  // Filters & pagination
  const [search, setSearch] = useState(''); const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('revenue'); const [page, setPage] = useState(1)
  const perPage = 8

  const fetchAll = async () => {
    try {
      const [m,b,u,a,p,sub] = await Promise.all([
        apiClient.get('/api/merchants'), apiClient.get('/api/branches'), apiClient.get('/api/users'),
        apiClient.get('/api/analytics').catch(()=>null), apiClient.get('/api/products'),
        apiClient.get('/api/subscriptions').catch(()=>null),
      ])
      setMerchants(m||[]); setBranches(b||[]); setUsers(u||[]); setAnalytics(a); setProducts(p||[]); setSubscriptions(sub||[])
    } catch{} finally{setLoading(false)}
  }
  useEffect(()=>{fetchAll()},[])

  const a = analytics; const branchSales = a?.branch_sales||[]; const totalRev = a?.summary?.total_revenue||0
  const subByMerchant = useMemo(() => {
    const map = {}; subscriptions.forEach(s => { map[s.merchant_id] = s })
    return map
  }, [subscriptions])
  const dailySalesAll = a?.daily_sales||[]; const categorySalesAll = a?.category_sales||[]
  const paymentSalesAll = a?.payment_sales||[]; const topProductsAll = a?.top_products||[]
  const weeklySalesAll = a?.weekly_sales||[]

  // Compute merchant metrics
  const merchantMetrics = useMemo(() => merchants.map(m => {
    const mB = branches.filter(b=>b.merchant_id===m.id); const mU = users.filter(u=>u.merchant_id===m.id)
    const bNames = mB.map(b=>b.name); const rev = branchSales.filter(bs=>bNames.includes(bs.branch_name)).reduce((s,bs)=>s+(bs.revenue||0),0)
    const trx = branchSales.filter(bs=>bNames.includes(bs.branch_name)).reduce((s,bs)=>s+(bs.transactions||0),0)
    return {...m, branches:mB, users:mU, revenue:rev, trx, pct:totalRev>0?(rev/totalRev)*100:0}
  }),[merchants,branches,users,analytics])

  // Filter, search, sort
  const filtered = useMemo(() => {
    let list = [...merchantMetrics]
    if (search) { const q = search.toLowerCase(); list = list.filter(m => m.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)) }
    if (filterStatus === 'active') list = list.filter(m => m.active)
    if (filterStatus === 'inactive') list = list.filter(m => !m.active)
    if (sortBy === 'revenue') list.sort((a,b) => (b.revenue||0) - (a.revenue||0))
    if (sortBy === 'name') list.sort((a,b) => (a.name||'').localeCompare(b.name||''))
    if (sortBy === 'trx') list.sort((a,b) => (b.trx||0) - (a.trx||0))
    if (sortBy === 'pct') list.sort((a,b) => (b.pct||0) - (a.pct||0))
    return list
  }, [merchantMetrics, search, filterStatus, sortBy])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page-1)*perPage, page*perPage)

  const handleCreate = async () => {
    if(!form.name||!form.code)return; try{
      await apiClient.post('/api/merchants',form); setShowForm(false); setForm({name:'',code:'',email:'',phone:''})
      await fetchAll(); show('Merchant created')
    }catch(e){show(e.message,'error')}
  }

  const handleToggle = async (m) => {
    try{
      await apiClient.put(`/api/merchants/${m.id}`,{active:!m.active,name:m.name,code:m.code})
      await fetchAll(); show(m.active?'Disabled':'Enabled')
    }catch(e){show(e.message,'error')}
  }

  // Detail for selected
  const detail = useMemo(() => {
    if(!selected)return null
    const mB = branches.filter(b=>b.merchant_id===selected.id); const mU = users.filter(u=>u.merchant_id===selected.id)
    const bNames = mB.map(b=>b.name)
    const mRev = branchSales.filter(bs=>bNames.includes(bs.branch_name)).reduce((s,bs)=>s+(bs.revenue||0),0)
    const mTrx = branchSales.filter(bs=>bNames.includes(bs.branch_name)).reduce((s,bs)=>s+(bs.transactions||0),0)
    const daily = dailySalesAll.map(d=>({date:d.label||d.date?.slice(5),revenue:d.revenue||0}))
    const categories = categorySalesAll.map(c=>({name:c.category,value:c.revenue||0}))
    const payments = paymentSalesAll.map(p=>({name:p.method,value:p.revenue||0}))
    const topProds = topProductsAll.slice(0,6).map(p=>({name:(p.product_name||'').length>18?p.product_name.slice(0,16)+'..':p.product_name,qty:p.quantity||0}))
    const weekly = weeklySalesAll.map(w=>({week:w.week||w.start_date?.slice(5),growth:w.growth||0}))
    return {...selected, branches:mB, users:mU, revenue:mRev, trx:mTrx, pct:totalRev>0?(mRev/totalRev)*100:0, daily, categories, payments, topProds, weekly, avgOrder:mTrx>0?Math.round(mRev/mTrx):0}
  },[selected,branches,users,analytics])

  const FilterBtn = ({label,value})=>(
    <button onClick={()=>setFilterStatus(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterStatus===value?'bg-blue-500/15 text-blue-400 border border-blue-500/30':'bg-white/5 text-white/40 hover:text-white/70 border border-transparent'}`}>{label}</button>
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white/90">Manajemen Merchant</h1>
            <p className="text-sm text-white/30 mt-1">{filtered.length} dari {merchants.length} merchant · {branches.length} toko · {users.filter(u=>u.role!=='superadmin').length} pengguna</p>
          </div>
          <button onClick={()=>setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-[18px]">add</span>Tambah</button>
        </div>

        {showForm && (
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 mb-5">
            <h3 className="text-sm font-semibold text-white/80 mb-4">Merchant Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <input placeholder="Nama *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-white/20" />
              <input placeholder="Kode *" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-white/20 uppercase" />
              <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-white/20" />
              <input placeholder="Telepon" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-white/20" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreate} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold cursor-pointer">Simpan</button>
              <button onClick={()=>setShowForm(false)} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm cursor-pointer">Batal</button>
            </div>
          </div>
        )}

        {/* FILTER + SEARCH BAR */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm material-symbols-outlined">search</span>
            <input placeholder="Cari merchant..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
              className="w-full pl-9 pr-4 py-2 bg-[#0a0a0a] border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/20" />
          </div>
          <FilterBtn label="Semua" value="" />
          <FilterBtn label="Aktif" value="active" />
          <FilterBtn label="Nonaktif" value="inactive" />
          <div className="text-xs text-white/30 ml-auto flex items-center gap-2">
            <span>Urut:</span>
            {['revenue','name','trx','pct'].map(s=>(<button key={s} onClick={()=>setSortBy(s)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${sortBy===s?'bg-white/10 text-white/70':'text-white/30 hover:text-white/50'}`}>{s}</button>))}
          </div>
        </div>

        {/* TABLE + DETAIL LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* TABLE */}
          <div className={`bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-300 ${selected?'lg:w-[38%] w-full':'w-full'}`}>
            {loading ? (
              <div className="flex items-center justify-center py-32"><span className="material-symbols-outlined animate-spin text-[48px] text-white/20">sync</span></div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-white/30 text-[11px] uppercase tracking-wider border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left py-4 px-5 font-semibold">Merchant</th>
                  <th className="text-left py-4 px-5 font-semibold hidden lg:table-cell">Paket</th>
                  <th className="text-center py-4 px-5 font-semibold">Toko</th>
                  <th className="text-right py-4 px-5 font-semibold hidden md:table-cell">Revenue</th>
                  <th className="text-right py-4 px-5 font-semibold hidden lg:table-cell">Trx</th>
                  <th className="text-right py-4 px-5 font-semibold hidden lg:table-cell">%</th>
                  <th className="text-center py-4 px-5 font-semibold">Status</th>
                  <th className="text-center py-4 px-5 font-semibold w-24">Aksi</th>
                </tr></thead>
                <tbody>
                  {paged.map((m,i)=>(
                    <tr key={m.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer ${selected?.id===m.id?'bg-blue-500/5':''} ${i===paged.length-1?'border-0':''}`}
                      onClick={()=>setSelected(selected?.id===m.id?null:m)}>
                      <td className="py-4 px-5"><div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${m.active?'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-400':'bg-white/5 text-white/30'}`}>{m.name?.charAt(0)||'?'}</div>
                        <div className="min-w-0"><p className="text-sm font-semibold text-white/90 truncate">{m.name}</p><p className="text-[10px] text-white/30 font-mono">{m.code}{m.email?` · ${m.email}`:''}</p></div>
                      </div></td>
                      <td className="py-4 px-5 hidden lg:table-cell">
                        {(() => { const s = subByMerchant[m.id]; return s?.plan ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.plan.name==='Enterprise'?'bg-purple-500/10 text-purple-400':s.plan.name==='Pro'?'bg-blue-500/10 text-blue-400':'bg-white/5 text-white/50'}`}>{s.plan.name}</span> : <span className="text-[11px] text-white/20">-</span> })()}
                      </td>
                      <td className="py-4 px-5 text-center"><p className="text-sm font-medium text-white/80">{m.branches.length}</p><p className="text-[10px] text-white/30">{m.users.length} user</p></td>
                      <td className="py-4 px-5 text-right hidden md:table-cell"><p className="text-sm font-bold text-white/90">{rp(m.revenue)}</p></td>
                      <td className="py-4 px-5 text-right hidden lg:table-cell"><p className="text-sm font-semibold text-white/80">{fmt(m.trx)}</p></td>
                      <td className="py-4 px-5 text-right hidden lg:table-cell"><div className="flex items-center gap-2 justify-end"><div className="w-14 h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full bg-blue-500/60 rounded-full" style={{width:`${Math.min(m.pct,100)}%`}}/></div><span className="text-xs font-semibold text-white/60 w-10 text-right">{m.pct.toFixed(1)}%</span></div></td>
                      <td className="py-4 px-5 text-center">
                        <button onClick={e=>{e.stopPropagation();handleToggle(m)}}
                          className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${m.active?'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20':'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                          {m.active?'Aktif':'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button onClick={e=>{e.stopPropagation();setSelected(selected?.id===m.id?null:m)}}
                          className="p-1.5 text-white/30 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paged.length===0&&<tr><td colSpan={7} className="py-16 text-center text-white/20 text-sm">Tidak ada merchant</td></tr>}
                </tbody>
              </table>
            </div>)}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
                <span className="text-xs text-white/30">{filtered.length} merchant</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={()=>setPage(Math.max(1,page-1))} disabled={page===1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 text-white/50 hover:bg-white/10">Prev</button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                    <button key={p} onClick={()=>setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${page===p?'bg-blue-500/15 text-blue-400':'bg-white/5 text-white/40 hover:bg-white/10'}`}>{p}</button>
                  ))}
                  <button onClick={()=>setPage(Math.min(totalPages,page+1))} disabled={page===totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 text-white/50 hover:bg-white/10">Next</button>
                </div>
              </div>
            )}
          </div>

          {/* DETAIL */}
          {detail && (
            <div className="lg:w-[62%] w-full space-y-4 lg:max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 flex items-center justify-between sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${detail.active?'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-400':'bg-white/5 text-white/30'}`}>{detail.name?.charAt(0)}</div>
                  <div><h2 className="text-lg font-bold text-white/90">{detail.name}</h2><p className="text-xs text-white/30 font-mono">{detail.code}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={e=>{e.stopPropagation();handleToggle(detail)}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${detail.active?'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20':'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>{detail.active?'Enabled':'Disabled'}</button>
                  <button onClick={()=>setSelected(null)} className="p-2 text-white/30 hover:text-white rounded-lg transition-all cursor-pointer"><span className="material-symbols-outlined text-[18px]">close</span></button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-emerald-600/15 to-emerald-900/5 border border-emerald-500/15 rounded-xl p-4"><p className="text-[10px] text-emerald-300/70 uppercase tracking-wider font-semibold">Revenue</p><p className="text-lg font-black text-emerald-400 mt-1">{rp(detail.revenue)}</p><p className="text-[10px] text-white/30 mt-0.5">{fmt(detail.trx)} transaksi</p></div>
                <div className="bg-gradient-to-br from-blue-600/15 to-blue-900/5 border border-blue-500/15 rounded-xl p-4"><p className="text-[10px] text-blue-300/70 uppercase tracking-wider font-semibold">Avg Order</p><p className="text-lg font-black text-blue-400 mt-1">{rp(detail.avgOrder)}</p><p className="text-[10px] text-white/30 mt-0.5">per transaksi</p></div>
                <div className="bg-gradient-to-br from-purple-600/15 to-purple-900/5 border border-purple-500/15 rounded-xl p-4"><p className="text-[10px] text-purple-300/70 uppercase tracking-wider font-semibold">Kontribusi</p><p className="text-lg font-black text-purple-400 mt-1">{detail.pct.toFixed(1)}%</p></div>
                <div className="bg-gradient-to-br from-amber-600/15 to-amber-900/5 border border-amber-500/15 rounded-xl p-4"><p className="text-[10px] text-amber-300/70 uppercase tracking-wider font-semibold">Toko</p><p className="text-lg font-black text-amber-400 mt-1">{detail.branches.length}</p><p className="text-[10px] text-white/30 mt-0.5">{detail.users.length} pengguna</p></div>
                <div className="bg-gradient-to-br from-cyan-600/15 to-cyan-900/5 border border-cyan-500/15 rounded-xl p-4"><p className="text-[10px] text-cyan-300/70 uppercase tracking-wider font-semibold">Produk</p><p className="text-lg font-black text-cyan-400 mt-1">{fmt(products.length)}</p></div>
                <div className="bg-gradient-to-br from-rose-600/15 to-rose-900/5 border border-rose-500/15 rounded-xl p-4"><p className="text-[10px] text-rose-300/70 uppercase tracking-wider font-semibold">Terjual</p><p className="text-lg font-black text-rose-400 mt-1">{fmt(detail.topProds.reduce((a,p)=>a+(p.qty||0),0))}</p></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5"><div className="flex items-center justify-between mb-3"><h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Revenue</h3><span className="text-[10px] text-white/30">7 days</span></div>
                  <div className="h-44"><ResponsiveContainer width="100%" height="100%"><AreaChart data={detail.daily}><defs><linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="date" stroke="rgba(255,255,255,0.15)" tick={{fontSize:10,fill:'rgba(255,255,255,0.4)'}}/><YAxis stroke="rgba(255,255,255,0.15)" tick={{fontSize:10,fill:'rgba(255,255,255,0.4)'}} tickFormatter={rp}/><Tooltip content={<CTooltip/>}/><Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rG)" name="Revenue"/></AreaChart></ResponsiveContainer></div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5"><div className="flex items-center justify-between mb-3"><h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Growth %</h3><span className="text-[10px] text-white/30">weekly</span></div>
                  <div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={detail.weekly}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="week" stroke="rgba(255,255,255,0.15)" tick={{fontSize:10,fill:'rgba(255,255,255,0.4)'}}/><YAxis domain={['auto','auto']} stroke="rgba(255,255,255,0.15)" tick={{fontSize:10,fill:'rgba(255,255,255,0.4)'}} tickFormatter={v=>`${v.toFixed(1)}%`}/><Tooltip content={<CTooltip/>}/><Bar dataKey="growth" fill="#ec4899" radius={[4,4,0,0]} name="Growth %"/></BarChart></ResponsiveContainer></div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Per-Toko</h3>
                <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-white/30 border-b border-white/[0.06]"><th className="text-left py-2 font-semibold">Nama</th><th className="text-right py-2 font-semibold">Kota</th><th className="text-right py-2 font-semibold">Status</th></tr></thead><tbody>{detail.branches.map(b=>(
                  <tr key={b.id} className="border-b border-white/[0.04] text-white/60"><td className="py-2.5 font-medium text-white/80">{b.name}</td><td className="py-2.5 text-right text-white/40">{b.city||'-'}</td><td className="py-2.5 text-right"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.active?'bg-emerald-500/10 text-emerald-400':'bg-red-500/10 text-red-400'}`}>{b.active?'Aktif':'Non'}</span></td></tr>
                ))}{detail.branches.length===0&&<tr><td colSpan={3} className="py-4 text-center text-white/20">-</td></tr>}</tbody></table></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5"><h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Kategori</h3><div className="space-y-2.5">{detail.categories.map((c,i)=>(<div key={c.name}><div className="flex justify-between text-xs mb-1"><span className="text-white/60 truncate">{c.name}</span><span className="text-white/80 font-semibold">{rp(c.value)}</span></div><div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full rounded-full bg-amber-500/60" style={{width:`${Math.min((c.value/Math.max(...detail.categories.map(x=>x.value),1))*100,100)}%`}}/></div></div>))}{detail.categories.length===0&&<p className="text-xs text-white/20 text-center py-4">-</p>}</div></div>
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5"><h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Pembayaran</h3><div className="space-y-2.5">{detail.payments.map((p,i)=>(<div key={p.name}><div className="flex justify-between text-xs mb-1"><span className="text-white/60 truncate">{p.name}</span><span className="text-white/80 font-semibold">{rp(p.value)}</span></div><div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500/60" style={{width:`${Math.min((p.value/Math.max(...detail.payments.map(x=>x.value),1))*100,100)}%`}}/></div></div>))}{detail.payments.length===0&&<p className="text-xs text-white/20 text-center py-4">-</p>}</div></div>
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5"><h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Top Produk</h3><div className="space-y-2.5">{detail.topProds.map((p,i)=>(<div key={p.name}><div className="flex justify-between text-xs mb-1"><span className="text-white/60 truncate">{p.name}</span><span className="text-white/80 font-semibold">{p.qty} pcs</span></div><div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full rounded-full bg-purple-500/60" style={{width:`${Math.min((p.qty/Math.max(...detail.topProds.map(x=>x.qty),1))*100,100)}%`}}/></div></div>))}{detail.topProds.length===0&&<p className="text-xs text-white/20 text-center py-4">-</p>}</div></div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">people</span> Pengguna ({detail.users.length})</h3>
                <div className="flex flex-wrap gap-2">{detail.users.map(u=>(
                  <div key={u.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${u.role==='owner'?'bg-emerald-500/20 text-emerald-400':'bg-blue-500/20 text-blue-400'}`}>{u.name?.charAt(0)}</div>
                    <div><p className="text-sm font-semibold text-white/80">{u.name}</p><p className="text-[10px] text-white/30">{u.username} · {u.role}</p></div>
                  </div>
                ))}{detail.users.length===0&&<p className="text-xs text-white/20 text-center py-4 w-full border border-dashed border-white/[0.06] rounded-xl">-</p>}</div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-white/[0.08] py-6 mt-6 border-t border-white/[0.04]">Manajemen Merchant · SentraKas Platform · {new Date().getFullYear()}</div>
      </div>

      {notif&&(<div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up backdrop-blur-md ${notif.type==='error'?'bg-red-500/20 text-red-300 border border-red-500/20':'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'}`}>{notif.msg}</div>)}
    </div>
  )
}