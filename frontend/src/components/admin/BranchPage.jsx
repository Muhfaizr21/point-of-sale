import React, { useState, useEffect, useCallback } from 'react'
import { TopBar } from '../common/TopBar'
import { apiClient } from '../../services/apiClient'

export function BranchPage({ onToggleSidebar, onBranchChange }) {
  const [branches, setBranches] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', city: '' })
  const [expandedBranch, setExpandedBranch] = useState(null)
  const [branchPrices, setBranchPrices] = useState({})
  const [branchUsers, setBranchUsers] = useState({})
  const [showUserForm, setShowUserForm] = useState(null)
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '' })
  const [showPriceForm, setShowPriceForm] = useState(null)
  const [priceForm, setPriceForm] = useState({ product_id: 0, price: 0, stock: 0 })
  const [notif, setNotif] = useState(null)

  const showNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 3000) }

  const fetch = useCallback(async () => {
    try {
      const [b, p, u] = await Promise.all([
        apiClient.get('/api/branches'),
        apiClient.get('/api/products'),
        apiClient.get('/api/users'),
      ])
      setBranches(b || [])
      setAllProducts(p || [])
      setUsers(u || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const loadBranchPrices = async (branchId) => {
    try {
      const data = await apiClient.get(`/api/branches/${branchId}/products`)
      setBranchPrices(prev => ({ ...prev, [branchId]: data || [] }))
    } catch {}
  }

  const resetForm = () => {
    setForm({ name: '', code: '', address: '', phone: '', city: '' })
    setEditing(null); setShowForm(false)
  }

  const handleSaveBranch = async () => {
    if (!form.name || !form.code) return
    try {
      if (editing) { await apiClient.put(`/api/branches/${editing.id}`, form) }
      else { await apiClient.post('/api/branches', form) }
      if (onBranchChange) onBranchChange()
      resetForm(); fetch(); showNotif('Cabang berhasil disimpan')
    } catch (e) { showNotif(e.message) }
  }

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Hapus cabang ini? Semua data terkait mungkin akan hilang.')) return
    try { 
      await apiClient.delete(`/api/branches/${id}`); 
      if (onBranchChange) onBranchChange();
      fetch(); 
      showNotif('Cabang dihapus') 
    } catch (e) { showNotif(e.message) }
  }

  const handleCreateUser = async (branchId) => {
    if (!userForm.username || !userForm.password || !userForm.name) return
    try {
      await apiClient.post('/api/users', { ...userForm, role: 'cashier', branch_id: branchId })
      setShowUserForm(null); setUserForm({ username: '', password: '', name: '' })
      fetch(); showNotif('Kasir berhasil ditambahkan')
    } catch (e) { showNotif(e.message) }
  }

  const handleCopyProducts = async (targetId) => {
    const others = branches.filter(b => b.id !== targetId && b.active)
    if (others.length === 0) { showNotif('Tidak ada cabang lain untuk disalin'); return }
    const sourceId = window.prompt(
      `Salin harga dari cabang:\n${others.map(b => `ID ${b.id}: ${b.name}`).join('\n')}\n\nMasukkan ID cabang sumber:`
    )
    if (!sourceId) return
    if (sourceId == targetId) { showNotif('Tidak bisa copy ke cabang sendiri'); return }
    try {
      const res = await apiClient.post(`/api/branches/${targetId}/copy-products?from=${sourceId}`)
      showNotif(res.message || 'Produk berhasil disalin')
      loadBranchPrices(targetId)
    } catch (e) { showNotif(e.message) }
  }

  const handleSetPrice = async (branchId) => {
    const pid = priceForm.product_id
    if (!pid) return
    try {
      await apiClient.post(`/api/branches/${branchId}/products?product_id=${pid}`, {
        price: priceForm.price, cost_price: 0, stock: priceForm.stock, track_stock: true,
      })
      setShowPriceForm(null); setPriceForm({ product_id: 0, price: 0, stock: 0 })
      loadBranchPrices(branchId); showNotif('Harga cabang diperbarui')
    } catch (e) { showNotif(e.message) }
  }

  const toggleExpand = (id) => {
    if (expandedBranch === id) { setExpandedBranch(null); return }
    setExpandedBranch(id)
    setShowPriceForm(null)
    setPriceForm({ product_id: 0, price: 0, stock: 0 })
    setShowUserForm(null)
    setUserForm({ username: '', password: '', name: '' })
    loadBranchPrices(id)
  }

  const branchUserList = (branchId) => users.filter(u => u.branch_id === branchId)

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFAFA]">
      <TopBar title="Manajemen Cabang" onToggleSidebar={onToggleSidebar} />

      <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-10 hide-scrollbar relative">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Daftar Cabang</h2>
              <p className="text-sm text-gray-500 mt-1">Kelola informasi cabang, kasir, dan harga khusus produk di setiap lokasi.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">storefront</span>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Cabang</p>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{branches.length}</p>
                </div>
              </div>
              <button onClick={() => {resetForm(); setShowForm(true)}}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-md shadow-gray-900/20 active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span> Tambah Cabang
              </button>
            </div>
          </div>

          {/* Form Create/Edit Modal */}
          {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={resetForm}></div>
              
              {/* Modal Container */}
              <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                  <div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{editing ? 'Edit Informasi Cabang' : 'Registrasi Cabang'}</h3>
                      <p className="text-sm text-gray-500 mt-1">Lengkapi detail cabang di bawah ini.</p>
                  </div>
                  <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Cabang *</label>
                      <input placeholder="Contoh: Cabang Sudirman" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Kode Cabang *</label>
                      <input placeholder="Contoh: JKT-01" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all uppercase font-mono" />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Kota</label>
                      <input placeholder="Contoh: Jakarta" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Telepon</label>
                      <input placeholder="Contoh: 081234567890" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Alamat Lengkap</label>
                    <textarea placeholder="Masukkan alamat lengkap cabang..." value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none h-24 transition-all" />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-white">
                  <button onClick={handleSaveBranch} className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 font-semibold flex items-center justify-center gap-2 active:scale-[0.98]">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {editing ? 'Simpan Perubahan' : 'Buat Cabang'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List Cabang */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {branches.map(b => {
              const isExpanded = expandedBranch === b.id
              const bUsers = branchUserList(b.id)
              const prices = branchPrices[b.id] || []
              
              return (
                <div key={b.id} className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-300 shadow-md ring-1 ring-blue-500/10' : 'border-gray-200/80 shadow-sm hover:border-gray-300 hover:shadow-md hover:-translate-y-1'}`}>
                  
                  {/* Card Header (Clickable) */}
                  <div onClick={() => toggleExpand(b.id)}
                    className="p-6 flex flex-col gap-5 cursor-pointer group h-full">
                    
                    <div className="flex items-start justify-between w-full">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                        <span className="material-symbols-outlined text-[28px]">storefront</span>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-900'}`}>
                          <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-gray-900 truncate">{b.name}</h4>
                          {!b.active && <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded text-[10px] font-bold tracking-wider uppercase">Nonaktif</span>}
                        </div>
                        <div>
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-mono font-bold tracking-wider">{b.code}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 text-sm text-gray-500">
                        {b.city && (
                            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-gray-400">location_on</span> {b.city}</span>
                        )}
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-gray-400">group</span> {bUsers.length} Kasir Aktif</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content (Modal Popup) */}
                  {isExpanded && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
                      {/* Backdrop */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={(e) => { e.stopPropagation(); toggleExpand(null) }}></div>
                      
                      {/* Modal Container */}
                      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                              <span className="material-symbols-outlined text-[24px]">storefront</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">{b.name} <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono tracking-wider border border-gray-200">{b.code}</span></h3>
                              <p className="text-sm text-gray-500 mt-0.5">Manajemen Kasir Cabang</p>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleExpand(null) }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                            <span className="material-symbols-outlined text-[24px]">close</span>
                          </button>
                        </div>
                        
                        {/* Body */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/30 custom-scrollbar">
                          
                          {/* Action Bar */}
                          <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
                            <button onClick={(e) => { e.stopPropagation(); setEditing(b); setForm({ name: b.name, code: b.code, address: b.address||'', phone: b.phone||'', city: b.city||'' }); setShowForm(true); toggleExpand(null) }}
                              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">edit</span> Edit Profil Cabang
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteBranch(b.id); toggleExpand(null) }}
                              className="px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">delete</span> Hapus Cabang
                            </button>
                          </div>

                          <div className="p-6 max-w-4xl mx-auto">
                        
                        {/* Users / Kasir Panel */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-5">
                            <div>
                                <h5 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">badge</span> Daftar Kasir
                                </h5>
                                <p className="text-xs text-gray-500 mt-0.5">Akses login untuk cabang ini</p>
                            </div>
                            <button onClick={() => setShowUserForm(showUserForm === b.id ? null : b.id)}
                              className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">{showUserForm === b.id ? 'close' : 'add'}</span> Kasir
                            </button>
                          </div>
                          
                          {showUserForm === b.id && (
                            <div className="mb-5 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 animate-fade-in">
                              <input type="text" placeholder="Nama Kasir" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                              <div className="flex gap-3">
                                <input type="text" placeholder="Username login" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                                <input type="password" placeholder="Password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                              </div>
                              <button onClick={() => handleSaveUser(b.id)}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all">
                                Simpan Kasir
                              </button>
                            </div>
                          )}
                          
                          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {bUsers.map(u => (
                              <div key={u.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-200 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                      <span className="material-symbols-outlined text-[16px]">person</span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">@{u.username}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => {
                                      const newPass = prompt(`Reset password untuk ${u.username}:`)
                                      if (newPass) handleResetUserPassword(u.id, newPass)
                                  }} className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors" title="Reset Password">
                                      <span className="material-symbols-outlined text-[16px] block">key</span>
                                  </button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Hapus Kasir">
                                      <span className="material-symbols-outlined text-[16px] block">delete</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                            {bUsers.length === 0 && (
                                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <span className="material-symbols-outlined text-gray-300 text-[32px]">account_circle</span>
                                    <p className="text-sm text-gray-500 mt-2">Belum ada kasir terdaftar</p>
                                </div>
                            )}
                          </div>
                        </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {!loading && branches.length === 0 && (
              <div className="text-center py-20 bg-white border border-gray-200 border-dashed rounded-2xl">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[40px] text-gray-400">store_mall_directory</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Belum ada cabang terdaftar</h3>
                <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">Mulai tambahkan cabang pertama Anda untuk mengelola inventaris, kasir, dan laporan per lokasi.</p>
                <button onClick={() => {resetForm(); setShowForm(true)}} className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-md shadow-gray-900/20 active:scale-95 inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span> Tambah Cabang Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notif && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-gray-900/95 backdrop-blur text-white shadow-2xl text-sm font-semibold animate-slide-up flex items-center gap-3 border border-white/10">
          <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
          {notif}
        </div>
      )}
    </div>
  )
}
