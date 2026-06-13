import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import logoSentrakas from '../../assets/Sentrakas.png'

// --- HIGHLY DETAILED MOCK DATA ---

// 1. KPI Sparkline Data
const sparklineMRR = [{v: 30}, {v: 32}, {v: 31}, {v: 35}, {v: 38}, {v: 37}, {v: 42}]
const sparklineTenants = [{v: 180}, {v: 190}, {v: 185}, {v: 200}, {v: 215}, {v: 220}, {v: 230}]
const sparklineGMV = [{v: 8.5}, {v: 9.2}, {v: 9.0}, {v: 10.5}, {v: 11.2}, {v: 11.8}, {v: 12.4}]
const sparklineLatency = [{v: 150}, {v: 145}, {v: 160}, {v: 130}, {v: 125}, {v: 135}, {v: 124}]

// 2. Main MRR Evolution Data
const mrrTrendData = [
  { date: '1 Jun', totalMRR: 35.0, newMRR: 2.0, expansionMRR: 0.5, churnMRR: 0.2 },
  { date: '5 Jun', totalMRR: 36.5, newMRR: 1.5, expansionMRR: 0.8, churnMRR: 0.1 },
  { date: '10 Jun', totalMRR: 38.0, newMRR: 2.5, expansionMRR: 0.4, churnMRR: 0.5 },
  { date: '15 Jun', totalMRR: 39.0, newMRR: 1.0, expansionMRR: 0.9, churnMRR: 0.2 },
  { date: '20 Jun', totalMRR: 41.0, newMRR: 2.2, expansionMRR: 1.1, churnMRR: 0.1 },
  { date: '25 Jun', totalMRR: 42.0, newMRR: 1.0, expansionMRR: 0.6, churnMRR: 0.0 },
]

// 3. Revenue by Tier (Bar Chart)
const revenueByTierData = [
  { tier: 'Enterprise', revenue: 18.5 },
  { tier: 'Pro', revenue: 15.0 },
  { tier: 'Basic', revenue: 8.5 },
]

// 4. Tenant Distribution
const tenantDistribution = [
  { name: 'Enterprise', value: 15, color: '#3b82f6' },
  { name: 'Pro', value: 45, color: '#8b5cf6' },
  { name: 'Basic', value: 120, color: '#10b981' },
  { name: 'Free Trial', value: 50, color: '#6b7280' },
]

// 5. System Performance (Lines)
const systemPerformance = [
  { time: '00:00', cpu: 30, memory: 45, db: 20 },
  { time: '04:00', cpu: 25, memory: 40, db: 15 },
  { time: '08:00', cpu: 65, memory: 70, db: 55 },
  { time: '12:00', cpu: 85, memory: 82, db: 75 },
  { time: '16:00', cpu: 70, memory: 75, db: 60 },
  { time: '20:00', cpu: 55, memory: 60, db: 40 },
]

// 6. Activity & Top Tenants
const recentActivityFeed = [
  { id: 1, type: 'upgrade', icon: 'rocket_launch', color: 'text-purple-400', bg: 'bg-purple-500/10', tenant: 'Kopi Kenangan', action: 'Upgraded to Enterprise', detail: 'Billing cycle updated', time: '10 mins ago' },
  { id: 2, type: 'signup', icon: 'person_add', color: 'text-emerald-400', bg: 'bg-emerald-500/10', tenant: 'Toko Makmur', action: 'New Sign Up (Free Trial)', detail: 'Referred by Partner A', time: '1 hour ago' },
  { id: 3, type: 'alert', icon: 'warning', color: 'text-amber-400', bg: 'bg-amber-500/10', tenant: 'System', action: 'CPU Spike Detected', detail: 'Node worker-03 hit 95% CPU', time: '2 hours ago' },
  { id: 4, type: 'churn', icon: 'cancel', color: 'text-red-400', bg: 'bg-red-500/10', tenant: 'Warteg Bahari', action: 'Subscription Cancelled', detail: 'Reason: Too expensive', time: '5 hours ago' },
]

const topTenantsByGMV = [
  { id: 'T001', name: 'Kopi Kenangan Senja', gmv: 'Rp 450.5M', trx: 12450, region: 'Jakarta Selatan', health: 98 },
  { id: 'T008', name: 'Grosir Maju Jaya', gmv: 'Rp 320.1M', trx: 8300, region: 'Surabaya', health: 92 },
  { id: 'T015', name: 'Apotek Sejahtera', gmv: 'Rp 215.0M', trx: 5120, region: 'Bandung', health: 85 },
  { id: 'T042', name: 'Minimarket Berkah', gmv: 'Rp 150.2M', trx: 3400, region: 'Medan', health: 95 },
]

// --- COMPONENTS ---

// Mini Sparkline Chart Component
const Sparkline = ({ data, color }) => (
  <div className="h-10 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
)

export function SuperadminDashboard() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('overview')

  const menuGroups = [
    {
      title: 'Ringkasan & Data',
      items: [
        { id: 'overview', label: 'Ringkasan Platform', icon: 'dashboard' },
        { id: 'analytics', label: 'AI & Analitik', icon: 'insights' },
      ]
    },
    {
      title: 'Manajemen',
      items: [
        { id: 'tenants', label: 'Daftar Klien / Toko', icon: 'storefront' },
        { id: 'billing', label: 'Langganan & Tagihan', icon: 'credit_card' },
        { id: 'support', label: 'Dukungan & Tiket', icon: 'support_agent' },
        { id: 'broadcasts', label: 'Pengumuman Global', icon: 'campaign' },
      ]
    },
    {
      title: 'Ekosistem',
      items: [
        { id: 'integrations', label: 'Integrasi Aplikasi', icon: 'extension' },
        { id: 'developer', label: 'API & Webhooks', icon: 'webhook' },
        { id: 'customization', label: 'White-Labeling', icon: 'palette' },
      ]
    },
    {
      title: 'Sistem & Keamanan',
      items: [
        { id: 'infrastructure', label: 'Kesehatan Sistem', icon: 'memory' },
        { id: 'audit', label: 'Log Audit', icon: 'shield_person' },
        { id: 'compliance', label: 'Legal & Kepatuhan', icon: 'gavel' },
        { id: 'settings', label: 'Pengaturan Global', icon: 'tune' },
      ]
    }
  ]

  // Flatten items just to find the active label for the header
  const allItems = menuGroups.flatMap(g => g.items)

  return (
    <div className="flex h-screen w-full bg-[#030303] text-white font-sans selection:bg-blue-500/30">
      
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0a0a0a] border-r border-white/5 flex flex-col h-full z-20">
        <div className="h-[72px] flex items-center justify-center border-b border-white/5 px-6">
          <img src={logoSentrakas} alt="SentraKas Logo" className="h-12 w-auto object-contain brightness-0 invert drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
        </div>
        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto custom-scrollbar pb-24">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{group.title}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-sm font-medium ${
                      activeMenu === item.id 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        
        {/* User Profile / Exit */}
        <div className="p-4 border-t border-white/5 bg-[#050505]">
          <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white/10">
              SA
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-semibold text-white/90 truncate">System Admin</p>
              <p className="text-[10px] text-emerald-400 font-medium">Platform Owner</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/60 transition-all cursor-pointer text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Exit to Tenant View
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-[72px] flex items-center justify-between px-8 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Module: {allItems.find(m => m.id === activeMenu)?.label || 'Dashboard'}
            </h1>
            <div className="h-5 w-px bg-white/10"></div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-white/40">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              June 2026
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              <span className="text-xs font-medium text-white/60">System Operational</span>
            </div>
            <button className="relative text-white/40 hover:text-white transition">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0a0a0a]"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* ROW 1: Premium KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* MRR Card */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Total MRR</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">Rp 42.0<span className="text-lg text-white/50 font-semibold ml-1">M</span></h3>
                  </div>
                  <Sparkline data={sparklineMRR} color="#3b82f6" />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                    <span className="material-symbols-outlined text-[12px]">arrow_upward</span> 8.4%
                  </span>
                  <span className="text-xs text-white/40 font-medium">vs last month</span>
                </div>
              </div>

              {/* Tenants Card */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Active Tenants</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">230</h3>
                  </div>
                  <Sparkline data={sparklineTenants} color="#8b5cf6" />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                    <span className="material-symbols-outlined text-[12px]">add</span> 12
                  </span>
                  <span className="text-xs text-white/40 font-medium">new this week</span>
                </div>
              </div>

              {/* GMV Card */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Global GMV</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">Rp 12.4<span className="text-lg text-white/50 font-semibold ml-1">B</span></h3>
                  </div>
                  <Sparkline data={sparklineGMV} color="#10b981" />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <span className="text-xs font-bold text-white/70 bg-white/5 px-2 py-0.5 rounded">345,021</span>
                  <span className="text-xs text-white/40 font-medium">total transactions</span>
                </div>
              </div>

              {/* Latency Card */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">API Latency</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">124<span className="text-lg text-white/50 font-semibold ml-1">ms</span></h3>
                  </div>
                  <Sparkline data={sparklineLatency} color="#f97316" />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 99.99% Uptime
                  </span>
                </div>
              </div>

            </div>

            {/* ROW 2: Complex Analytics (MRR & System) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* MRR Stacked Area Chart */}
              <div className="lg:col-span-2 bg-[#0a0a0a] rounded-xl border border-white/10 p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Revenue Metrics (MRR)</h3>
                    <p className="text-xs text-white/40">Total MRR vs New vs Churned (in Millions)</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-medium text-white/60 hover:text-white transition">Month</button>
                    <button className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs font-medium text-blue-400 transition">Quarter</button>
                  </div>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mrrTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#ffffff40', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}M`} tick={{fill: '#ffffff40', fontSize: 11}} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'}}
                        itemStyle={{fontSize: '12px'}} labelStyle={{color: '#ffffff80', fontSize: '11px', marginBottom: '4px'}}
                      />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                      <Area type="monotone" dataKey="totalMRR" name="Total MRR" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="newMRR" name="New MRR" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
                      <Area type="monotone" dataKey="churnMRR" name="Churned MRR" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Infrastructure Load */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-6 shadow-lg flex flex-col">
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white">Infrastructure Load</h3>
                    <p className="text-xs text-white/40">24-hour resource utilization</p>
                  </div>
                  <span className="material-symbols-outlined text-white/20">memory</span>
                </div>
                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={systemPerformance} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#ffffff40', fontSize: 10}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} tick={{fill: '#ffffff40', fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '8px'}}
                        itemStyle={{fontSize: '11px'}} labelStyle={{color: '#ffffff80', fontSize: '10px'}}
                      />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '5px'}} />
                      <Line type="basis" dataKey="cpu" name="CPU Usage" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="basis" dataKey="memory" name="RAM Usage" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <Line type="basis" dataKey="db" name="DB IOPS" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ROW 3: Distributions & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Tenant Distribution Pie & Bar */}
              <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-6 shadow-lg flex flex-col">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white">Revenue by Tier</h3>
                  <p className="text-xs text-white/40">Distribution of MRR per subscription tier</p>
                </div>
                <div className="h-[140px] w-full mb-6 border-b border-white/5 pb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByTierData} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="tier" type="category" axisLine={false} tickLine={false} tick={{fill: '#ffffff60', fontSize: 11}} />
                      <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '12px'}} />
                      <Bar dataKey="revenue" name="Revenue (M)" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {revenueByTierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981'][index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Tenant Volume</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {tenantDistribution.map((tier, idx) => (
                      <div key={idx} className="bg-[#141414] border border-white/5 rounded-lg p-3">
                        <p className="text-[10px] text-white/40 font-semibold mb-1" style={{ color: tier.color }}>{tier.name}</p>
                        <p className="text-lg font-bold text-white">{tier.value} <span className="text-[10px] text-white/30 font-normal">toko</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Tenants Table */}
              <div className="lg:col-span-2 bg-[#0a0a0a] rounded-xl border border-white/10 shadow-lg flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#141414]/30">
                  <div>
                    <h3 className="text-base font-bold text-white">Top Performing Tenants</h3>
                    <p className="text-xs text-white/40">Highest transaction volume and GMV</p>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md transition border border-white/5">
                    View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#0a0a0a] border-b border-white/5">
                      <tr className="text-[10px] uppercase tracking-widest text-white/40">
                        <th className="py-3 px-6 font-semibold">Tenant / Location</th>
                        <th className="py-3 px-6 font-semibold text-right">Transactions</th>
                        <th className="py-3 px-6 font-semibold text-right">GMV Generated</th>
                        <th className="py-3 px-6 font-semibold text-right">Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {topTenantsByGMV.map((tenant, idx) => (
                        <tr key={idx} className="hover:bg-[#141414] transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60 shadow-inner">
                                {tenant.id.replace('T0', '')}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white/90 group-hover:text-blue-400 transition-colors cursor-pointer">{tenant.name}</p>
                                <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[10px]">location_on</span> {tenant.region}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <p className="text-sm font-medium text-white/80">{tenant.trx.toLocaleString()}</p>
                            <p className="text-[10px] text-white/30">this month</p>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <p className="text-sm font-bold text-white">{tenant.gmv}</p>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-bold text-emerald-400">{tenant.health}%</span>
                              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${tenant.health}%` }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* ROW 4: Live Event Stream (Audit Log) */}
            <div className="bg-[#0a0a0a] rounded-xl border border-white/10 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#141414]/30">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-white">Live Audit Stream</h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 border border-red-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> Live
                  </span>
                </div>
              </div>
              <div className="p-0">
                {recentActivityFeed.map((activity, idx) => (
                  <div key={activity.id} className={`flex items-start gap-4 p-4 hover:bg-[#141414] transition-colors ${idx !== recentActivityFeed.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5 shadow-inner ${activity.bg} ${activity.color}`}>
                      <span className="material-symbols-outlined text-[16px]">{activity.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-white/90">{activity.action}</p>
                        <span className="text-[11px] text-white/40 whitespace-nowrap">{activity.time}</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">{activity.detail}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-1 rounded border border-white/5">{activity.tenant}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
