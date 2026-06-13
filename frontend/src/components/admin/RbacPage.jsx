import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../common/Button'
import { TopBar } from '../common/TopBar'
import { apiClient } from '../../services/apiClient'

const ALL_FEATURES = [
  { id: 'dashboard', label: 'Dashboard', group: 'Menu Utama' },
  { id: 'kasir', label: 'Kasir', group: 'Menu Utama' },
  { id: 'produk', label: 'Produk', group: 'Manajemen' },
  { id: 'kategori', label: 'Kategori', group: 'Manajemen' },
  { id: 'bundel', label: 'Paket Bundling', group: 'Manajemen' },
  { id: 'transaksi', label: 'Transaksi', group: 'Aktivitas & Data' },
  { id: 'laporan', label: 'Laporan', group: 'Aktivitas & Data' },
  { id: 'modal', label: 'Modal', group: 'Aktivitas & Data' },
  { id: 'pengeluaran', label: 'Pengeluaran', group: 'Aktivitas & Data' },
  { id: 'promo', label: 'Promo Diskon', group: 'Sistem' },
  { id: 'stok', label: 'Manajemen Stok', group: 'Sistem' },
  { id: 'supplier', label: 'Supplier', group: 'Sistem' },
  { id: 'tema', label: 'Tema', group: 'Sistem' },
  { id: 'pengaturan', label: 'Pengaturan', group: 'Sistem' },
]

const ACTIONS = [
  { id: 'read', label: 'R', title: 'Baca (Read) — izin melihat halaman', color: 'bg-blue-500' },
  { id: 'create', label: 'C', title: 'Buat (Create) — izin menambah data', color: 'bg-emerald-500' },
  { id: 'update', label: 'U', title: 'Ubah (Update) — izin mengubah data', color: 'bg-amber-500' },
  { id: 'delete', label: 'D', title: 'Hapus (Delete) — izin menghapus data', color: 'bg-rose-500' },
]

const DEFAULT_CONFIG = {
  roles: { owner: { label: 'Owner', is_super: true }, cashier: { label: 'Kasir', is_super: false } },
  permissions: { cashier: {} },
}

function emptyPerms() { return { create: false, read: false, update: false, delete: false } }

const groups = ALL_FEATURES.reduce((acc, f) => {
  if (!acc[f.group]) acc[f.group] = []
  acc[f.group].push(f)
  return acc
}, {})

const roleColors = [
  'from-emerald-500 to-emerald-600', 'from-blue-500 to-blue-600', 'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600', 'from-cyan-500 to-cyan-600', 'from-purple-500 to-purple-600',
]

export function RbacPage({ onToggleSidebar }) {
  const [config, setConfig] = useState(null)
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState(null)

  // Role form
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [fId, setFId] = useState('')
  const [fLabel, setFLabel] = useState('')
  const [fErr, setFErr] = useState(null)

  const [loading, setLoading] = useState(true)

  const notif = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const raw = localStorage.getItem('rbacConfig')
      setConfig(raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_CONFIG)))
      const d = await apiClient.get('/api/users'); setUsers(d || [])
    } catch { setConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG))) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const save = (next) => {
    localStorage.setItem('rbacConfig', JSON.stringify(next))
    setConfig(next)
  }

  // Role CRUD
  const openAdd = () => { setEditId(null); setFId(''); setFLabel(''); setFErr(null); setShowForm(true) }
  const openEdit = (id) => { setEditId(id); setFId(id); setFLabel(config.roles[id].label); setFErr(null); setShowForm(true) }

  const submitRole = (e) => {
    e.preventDefault()
    const id = fId.trim().toLowerCase().replace(/\s+/g, '_')
    if (!id || !fLabel.trim()) { setFErr('Isi semua field'); return }
    const next = { ...config, roles: { ...config.roles }, permissions: { ...config.permissions } }
    if (editId && editId !== id) {
      next.roles[id] = { label: fLabel, is_super: false }
      if (next.permissions[editId]) next.permissions[id] = next.permissions[editId]
      delete next.roles[editId]; delete next.permissions[editId]
    } else if (editId) {
      next.roles[id] = { ...next.roles[id], label: fLabel }
    } else {
      if (next.roles[id]) { setFErr('ID sudah ada'); return }
      next.roles[id] = { label: fLabel, is_super: false }
      if (!next.permissions[id]) {
        // Default: beri akses R (Read) ke semua fitur agar role langsung bisa dipakai
        next.permissions[id] = {}
        ALL_FEATURES.forEach(f => { next.permissions[id][f.id] = { create: false, read: true, update: false, delete: false } })
      }
    }
    save(next); setShowForm(false); notif('Role tersimpan')
  }

  const hapusRole = (id) => {
    if (!confirm(`Hapus role "${config.roles[id]?.label}"?`)) return
    const next = { ...config, roles: { ...config.roles }, permissions: { ...config.permissions } }
    delete next.roles[id]; delete next.permissions[id]
    save(next); notif('Role dihapus')
  }

  // Permissions
  const ubah = (roleId, featId, action) => {
    const next = JSON.parse(JSON.stringify(config))
    if (!next.permissions[roleId]) next.permissions[roleId] = {}
    if (!next.permissions[roleId][featId]) next.permissions[roleId][featId] = emptyPerms()
    const curr = next.permissions[roleId][featId][action]
    if (action === 'read') {
      if (curr) {
        next.permissions[roleId][featId] = emptyPerms()
      } else {
        next.permissions[roleId][featId].read = true
      }
    } else {
      if (!next.permissions[roleId][featId].read) return
      next.permissions[roleId][featId][action] = !curr
    }
    save(next)
  }

  const selectAll = (roleId, checked) => {
    const next = JSON.parse(JSON.stringify(config))
    if (!next.permissions[roleId]) next.permissions[roleId] = {}
    ALL_FEATURES.forEach(f => {
      next.permissions[roleId][f.id] = checked ? { create: true, read: true, update: true, delete: true } : emptyPerms()
    })
    save(next)
  }

  const roleList = Object.entries(config?.roles || {}).filter(([id]) => id !== 'owner')
  const allRoles = Object.entries(config?.roles || {})

  if (loading) return (
    <div className="flex-1 flex h-full items-center justify-center bg-gray-50">
      <span className="material-symbols-outlined animate-spin text-[48px] text-violet-600">sync</span>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">
      {/* HEADER */}
      <TopBar
        title="Hak Akses"
        onToggleSidebar={onToggleSidebar}
        rightContent={
          <button onClick={() => notif('Tersimpan')}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 transition-all cursor-pointer shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-[16px]">save</span> Simpan
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-5">
        <div className="space-y-5 pb-8">

          {/* USERS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">people</span>
              <span className="text-sm font-bold text-gray-800">Pengguna</span>
              <span className="text-xs text-gray-400 font-medium ml-1">({users.length})</span>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold ${u.role === 'owner' ? 'bg-violet-500' : 'bg-blue-500'}`}>
                    {u.name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-800 text-xs">{u.name}</span>
                  <span className="text-[10px] text-gray-400">({config?.roles[u.role]?.label || u.role})</span>
                </div>
              ))}
              {users.length === 0 && <span className="text-xs text-gray-400 px-2">Belum ada pengguna</span>}
            </div>
          </div>

          {/* ROLES + ADD BUTTON */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-600 text-[18px]">badge</span>
                <span className="text-sm font-bold text-gray-800">Role</span>
                <span className="text-xs text-gray-400 font-medium ml-1">({allRoles.length})</span>
              </div>
              <button onClick={openAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 transition-all cursor-pointer shadow-sm active:scale-95">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Tambah Role Baru
              </button>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {allRoles.map(([id, role], i) => (
                <div key={id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${role.is_super ? 'border-violet-200 bg-violet-50/50' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'} transition-all`}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleColors[i % roleColors.length]} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {role.label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-tight">{role.label}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">
                      {role.is_super ? 'Akses penuh ke semua fitur' : `@${id}`}
                    </p>
                  </div>
                  {!role.is_super && (
                    <div className="flex ml-1">
                      <button onClick={() => openEdit(id)} className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer transition-colors" title="Edit role">
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      <button onClick={() => hapusRole(id)} className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer transition-colors" title="Hapus role">
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {allRoles.length === 0 && <p className="text-sm text-gray-400 px-2">Belum ada role. Klik "Tambah Role Baru" untuk mulai.</p>}
            </div>
          </div>

          {/* PERMISSIONS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-600 text-[18px]">admin_panel_settings</span>
                <span className="text-sm font-bold text-gray-800">Izin CRUD</span>
              </div>
              {roleList.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Aktifkan semua:</span>
                  {roleList.map(([id, role], i) => (
                    <label key={id} className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer hover:text-gray-700 select-none bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                      <input type="checkbox" onChange={(e) => selectAll(id, e.target.checked)}
                        className="w-3 h-3 rounded border-gray-300 text-violet-600 focus:ring-violet-300 cursor-pointer" />
                      <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${roleColors[i % roleColors.length]}`}></span>
                      {role.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {roleList.length === 0 ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-[40px] text-gray-300">admin_panel_settings</span>
                <p className="text-sm text-gray-400 mt-2">Belum ada role selain Owner</p>
                <p className="text-xs text-gray-400">Buat role baru dulu di bagian "Role" di atas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-36">Fitur</th>
                      {roleList.map(([id, role], i) => (
                        <th key={id} className="text-center px-2 py-2.5 min-w-[130px]">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${roleColors[i % roleColors.length]}`}></span>
                            <span className="text-xs font-bold text-gray-700 cursor-default">{role.label}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                    {/* Sub-header: C R U D labels */}
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th></th>
                      {roleList.map(([id]) => (
                        <th key={id} className="px-2 py-1">
                          <div className="flex items-center justify-center gap-1">
                            {ACTIONS.map(a => (
                              <span key={a.id} className="text-[9px] font-bold text-gray-400 w-7 text-center">{a.label}</span>
                            ))}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(groups).map(([group, features]) => (
                      <React.Fragment key={group}>
                        <tr className="bg-gray-50/30">
                          <td colSpan={roleList.length + 1} className="px-5 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">{group}</td>
                        </tr>
                        {features.map(feat => (
                          <tr key={feat.id} className="hover:bg-violet-50/30 transition-colors">
                            <td className="px-5 py-2.5 text-xs font-semibold text-gray-800">{feat.label}</td>
                            {roleList.map(([roleId], ri) => {
                              const p = config?.permissions?.[roleId]?.[feat.id] || {}
                              return (
                                <td key={roleId} className="px-2 py-2">
                                  <div className="flex items-center justify-center gap-1">
                                    {ACTIONS.map(a => {
                                      const on = p[a.id] === true
                                      const locked = a.id !== 'read' && !p.read
                                      return (
                                        <button key={a.id}
                                          onClick={() => ubah(roleId, feat.id, a.id)}
                                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer select-none
                                            ${on
                                              ? 'text-white shadow-sm ' + a.color
                                              : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-500'
                                            }
                                            ${locked ? 'opacity-20 hover:opacity-20 hover:bg-gray-100 hover:text-gray-300' : ''}
                                          `}
                                          title={locked ? `${a.title} — Aktifkan R (Read) dulu` : `${a.title}`}>
                                          {a.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
              {ACTIONS.map(a => (
                <span key={a.id} className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded ${a.color}`}></span>
                  <span className="font-semibold">{a.label}</span> = {a.title.split('—')[0].trim()}
                </span>
              ))}
              <span className="ml-auto">Klik <span className="font-bold text-blue-500">R</span> dulu untuk memberi akses fitur, baru <span className="font-bold text-emerald-500">C</span>/<span className="font-bold text-amber-500">U</span>/<span className="font-bold text-rose-500">D</span> bisa diatur</span>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL TAMBAH/EDIT ROLE */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">{editId ? 'Edit Role' : 'Tambah Role Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={submitRole} className="p-5 space-y-3">
              {fErr && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg font-medium">{fErr}</div>}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">ID Role <span className="text-gray-400 font-normal">(huruf kecil, tanpa spasi)</span></label>
                <input value={fId} disabled={!!editId} required onChange={e => setFId(e.target.value)}
                  placeholder="contoh: manager_gudang"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 disabled:bg-gray-100 disabled:text-gray-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Nama Role</label>
                <input value={fLabel} required onChange={e => setFLabel(e.target.value)}
                  placeholder="Contoh: Manajer Gudang"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500" />
              </div>
              <p className="text-[11px] text-gray-400">Setelah dibuat, role akan muncul di tabel izin CRUD di bawah.</p>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">Batal</button>
                <button type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors cursor-pointer shadow-sm">{editId ? 'Simpan' : 'Tambah Role'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white shadow-2xl animate-slide-up">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}
