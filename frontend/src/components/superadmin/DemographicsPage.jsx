import React, { useState, useEffect, useRef } from 'react'
import { apiClient } from '../../services/apiClient'

// Approximate coordinates for Indonesian cities (for demo mapping)
const CITY_COORDS = {
  'Cirebon': [-6.732, 108.552],
  'Jakarta': [-6.2088, 106.8456],
  'Bandung': [-6.9175, 107.6191],
  'Surabaya': [-7.2575, 112.7521],
  'Semarang': [-6.9932, 110.4203],
  'Yogyakarta': [-7.7956, 110.3695],
  'Medan': [3.5952, 98.6722],
  'Makassar': [-5.1477, 119.4327],
  'Palembang': [-2.9761, 104.7754],
  'Denpasar': [-8.6705, 115.2126],
  'Bali': [-8.3405, 115.0920],
  'Bekasi': [-6.2349, 106.9896],
  'Tangerang': [-6.1781, 106.6300],
  'Depok': [-6.3940, 106.8225],
  'Bogor': [-6.5944, 106.7892],
  'Malang': [-7.9797, 112.6304],
  'Batam': [1.1195, 104.0475],
  'Pekanbaru': [0.5071, 101.4478],
  'Balikpapan': [-1.2379, 116.8529],
  'Manado': [1.4748, 124.8421],
  'Pontianak': [-0.0263, 109.3425],
  'Banjarmasin': [-3.3186, 114.5944],
  'Padang': [-0.9473, 100.4172],
  'Solo': [-7.5566, 110.8317],
  'Samarinda': [-0.4942, 117.1476],
  'Mataram': [-8.5833, 116.1167],
  'Aceh': [5.5483, 95.3238],
  'Lampung': [-5.4292, 105.2605],
  'Kupang': [-10.1772, 123.6070],
  'Ambon': [-3.6554, 128.1908],
  'Jayapura': [-2.5337, 140.7181],
  'Unknown': [-2.5, 117.0],
}

function CityBar({ data }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.count), 1)
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((c, i) => (
        <div key={c.city}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60 truncate">{c.city}</span>
            <span className="text-white/80 font-semibold shrink-0 ml-2">{c.count} toko{c.merchants > 1 ? ` (${c.merchants} merchant)` : ''}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(c.count / max) * 100}%`, background: colors[i % colors.length] }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DemographicsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('cities')
  const mapRef = useRef(null)
  const mapContainer = useRef(null)

  useEffect(() => {
    apiClient.get('/api/superadmin/demographics').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Initialize map when data is loaded and view switches to 'map'
  useEffect(() => {
    if (!data || view !== 'map' || mapRef.current) return
    // Load Leaflet CSS once (use onload to ensure CSS is applied before map init)
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    // Ensure Leaflet default CSS for dragging is applied inline as fallback
    if (!document.getElementById('leaflet-fallback')) {
      const style = document.createElement('style')
      style.id = 'leaflet-fallback'
      style.textContent = '.leaflet-grab{cursor:grab!important}.leaflet-dragging .leaflet-grab{cursor:grabbing!important}.leaflet-container{overflow:hidden!important;touch-action:none!important;width:100%!important;height:100%!important}'
      document.head.appendChild(style)
    }

    const initMap = () => {
      if (!mapContainer.current || mapRef.current) return
      const L = window.L
      if (!L) return

      // Ensure container has explicit height
      mapContainer.current.style.height = '100%'
      mapContainer.current.style.minHeight = '500px'

      const map = L.map(mapContainer.current, {
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        tap: true,
      }).setView([-2.5, 117.0], 5)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      const bounds = []
      ;(data.branches || []).forEach(b => {
        let lat = b.latitude
        let lng = b.longitude
        if ((!lat || lat === 0) && (!lng || lng === 0)) {
          const coords = CITY_COORDS[b.city] || CITY_COORDS['Unknown']
          lat = coords[0] + (Math.random() - 0.5) * 0.1
          lng = coords[1] + (Math.random() - 0.5) * 0.1
        }
        if (lat && lng) {
          bounds.push([lat, lng])
          L.circleMarker([lat, lng], {
            radius: 8, fillColor: '#6366f1', color: '#fff', weight: 2, fillOpacity: 0.7,
          }).addTo(map).bindPopup(`
            <div style="font-family:sans-serif;font-size:12px;line-height:1.5">
              <strong style="font-size:14px">${b.name}</strong><br/>
              ${b.merchant?.name ? `<span>${b.merchant.name}</span><br/>` : ''}
              ${b.address ? `<span>${b.address}</span><br/>` : ''}
              ${b.city ? `<span>📍 ${b.city}</span>` : ''}
            </div>
          `)
        }
      })

      ;(data.city_distribution || []).slice(0, 15).forEach((c, i) => {
        const coords = CITY_COORDS[c.city] || CITY_COORDS['Unknown']
        if (coords) {
          L.circleMarker(coords, {
            radius: Math.min(12 + c.count * 2, 30), fillColor: ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][i % 6],
            color: '#fff', weight: 2, fillOpacity: 0.4,
          }).addTo(map).bindPopup(`<div style="font-size:13px;line-height:1.5"><strong>${c.city}</strong><br/>${c.count} cabang · ${c.merchants} merchant</div>`)
        }
      })
      // Force Leaflet to recalculate size now that container is visible
      map.invalidateSize()
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30] })
      }
      // Re-invalidate after paint to fix any remaining size issues
      setTimeout(() => map.invalidateSize(), 300)
    }

    // Wait for container to be visible before initializing map
    const tryInit = () => {
      if (!mapContainer.current || mapRef.current) return false
      const rect = mapContainer.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return false // container not visible yet

      if (window.L) {
        initMap(); return true
      } else {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = initMap
        document.body.appendChild(script)
        return true
      }
    }
    // Retry until container is visible (max 3s)
    let attempts = 0
    const timer = setInterval(() => { attempts++; if (tryInit() || attempts > 30) clearInterval(timer) }, 100)
    return () => { clearInterval(timer); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [data, view])

  if (loading) return <div className="flex justify-center py-24"><span className="material-symbols-outlined animate-spin text-[40px] text-white/20">sync</span></div>
  if (!data) return <div className="text-center py-24 text-white/30">Gagal memuat data</div>

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-bold text-white/90">Demografi Pelanggan</h1><p className="text-sm text-white/30 mt-1">Sebaran toko & cabang berdasarkan wilayah</p></div>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
            <button onClick={() => setView('cities')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${view === 'cities' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white/80'}`}>Kota</button>
            <button onClick={() => setView('map')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${view === 'map' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white/80'}`}>Peta</button>
          </div>
        </div>

        {/* What - Ringkasan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[10px] text-white/40">Total Merchant Aktif</p>
            <p className="text-2xl font-bold text-white/90">{(data.total_merchants || 0).toLocaleString()}</p>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[10px] text-white/40">Total Cabang</p>
            <p className="text-2xl font-bold text-white/90">{(data.total_branches || 0).toLocaleString()}</p>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[10px] text-white/40">Kota / Kabupaten</p>
            <p className="text-2xl font-bold text-white/90">{(data.total_cities || 0).toLocaleString()}</p>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[10px] text-white/40">Rata-rata per Kota</p>
            <p className="text-2xl font-bold text-white/90">{data.total_cities > 0 ? (data.total_branches / data.total_cities).toFixed(1) : '0'}</p>
          </div>
        </div>

        {view === 'cities' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Kota distribution */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/80">Sebaran per Kota</h3>
                <span className="text-[10px] text-white/30">{(data.city_distribution || []).length} kota</span>
              </div>
              {(data.city_distribution || []).length > 0 ? <CityBar data={data.city_distribution} /> : <p className="text-xs text-white/30">Belum ada data</p>}
            </div>

            {/* Recent merchants */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-4">Merchant Terbaru</h3>
              <div className="space-y-3">
                {(data.recent_merchants || []).slice(0, 10).map(m => (
                  <div key={m.id} className="flex items-center gap-3 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400">{m.name?.charAt(0) || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 font-medium truncate">{m.name}</p>
                      <p className="text-[10px] text-white/30 truncate">{m.city || '-'} · {m.code}</p>
                    </div>
                    <span className="text-[9px] text-white/20">{m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID') : '-'}</span>
                  </div>
                ))}
                {(data.recent_merchants || []).length === 0 && <p className="text-xs text-white/30">Belum ada data</p>}
              </div>
            </div>

            {/* Detail table */}
            <div className="lg:col-span-3 bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="text-sm font-semibold text-white/80">Daftar Kota</h3>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4">Kota</th>
                  <th className="text-right py-3 px-4">Jumlah Cabang</th>
                  <th className="text-right py-3 px-4">Jumlah Merchant</th>
                  <th className="text-right py-3 px-4">Persentase</th>
                </tr></thead>
                <tbody>
                  {(data.city_distribution || []).map(c => {
                    const pct = data.total_branches > 0 ? ((c.count / data.total_branches) * 100).toFixed(1) : '0'
                    return (
                      <tr key={c.city} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-white/80 font-medium">{c.city}</td>
                        <td className="py-3 px-4 text-right text-white/70">{(c.count || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-white/70">{c.merchants || 0}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-white/50 text-xs">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {(data.city_distribution || []).length === 0 && <tr><td colSpan={4} className="text-center py-12 text-white/20">Belum ada data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {/* Map container — always rendered but hidden via CSS for 'cities' view */}
        <div className={`bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-300 ${view === 'map' ? 'block' : 'hidden'}`}
          style={{ height: '600px', position: 'relative' }}>
          <div ref={mapContainer} className="w-full h-full" style={{ touchAction: 'none' }} />
          {!mapRef.current && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
              <div className="text-center">
                <span className="material-symbols-outlined animate-spin text-[40px] text-white/20 block mb-3">sync</span>
                <p className="text-xs text-white/30">Memuat peta...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
