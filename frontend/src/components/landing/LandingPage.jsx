import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from 'recharts';
import logoSentrakas from '../../assets/Sentrakas.png';
import Beams from './Beams';
import { PublicFooter } from './PublicFooter';

const chartData = [
  { month: 'Jan', revenue: 18.5 },
  { month: 'Feb', revenue: 22.1 },
  { month: 'Mar', revenue: 19.8 },
  { month: 'Apr', revenue: 26.4 },
  { month: 'Mei', revenue: 24.2 },
  { month: 'Jun', revenue: 28.4 },
  { month: 'Jul', revenue: 32.1 },
  { month: 'Agu', revenue: 29.5 },
  { month: 'Sep', revenue: 31.2 },
  { month: 'Okt', revenue: 35.8 },
  { month: 'Nov', revenue: 38.6 },
  { month: 'Des', revenue: 42.3 },
]

const stats = [
  { value: '50rb+', label: 'Transaksi Sukses per Hari' },
  { value: '15+', label: 'Metode Pembayaran' },
  { value: '2.000+', label: 'Pengusaha Aktif' },
  { value: '99,9%', label: 'Uptime Server' },
]

const features = [
  {
    icon: 'monitoring',
    title: 'Analitik Penjualan Waktu Nyata',
    desc: 'Pantau tren produk terlaris, jam sibuk, dan performa kasir secara langsung. Grafik interaktif yang bisa Anda filter kapan saja.',
    iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
  },
  {
    icon: 'account_balance_wallet',
    title: 'Pembayaran Fleksibel',
    desc: 'Tunai, kartu, QRIS, e-wallet hingga split payment dalam satu layar. Transaksi apa pun bisa ditangani tanpa ganti aplikasi.',
    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
  },
  {
    icon: 'inventory_2',
    title: 'Stok Otomatis & Peringatan Dini',
    desc: 'Stok ter-update otomatis setiap transaksi. Dapatkan notifikasi sebelum barang habis dan riwayat pergerakan stok lengkap.',
    iconBg: 'bg-sky-100', iconColor: 'text-sky-600',
  },
  {
    icon: 'group',
    title: 'Manajemen Pelanggan Terpadu',
    desc: 'Catat riwayat belanja, total pengeluaran, dan preferensi tiap pelanggan. Data siap pakai untuk program loyalitas dan promosi.',
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
  },
  {
    icon: 'description',
    title: 'Laporan Keuangan Siap Audit',
    desc: 'Laporan laba-rugi, arus kas, dan PPN per periode. Export PDF siap sajikan ke konsultan pajak atau investor.',
    iconBg: 'bg-rose-100', iconColor: 'text-rose-600',
  },
  {
    icon: 'linked_services',
    title: 'Integrasi Marketplace',
    desc: 'Sinkron stok dan pesanan dari marketplace favorit. Semua channel penjualan terpusat di satu dashboard.',
    iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
  },
]

export default function LandingPage() {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'SentraKas POS - Kelola Toko Lebih Cerdas';
    const html = document.documentElement;
    const savedDark = html.classList.contains('dark');
    const savedDarkTheme = html.classList.contains('dark-theme');
    html.classList.remove('dark', 'dark-theme');

    if (window.location.hash) {
      setTimeout(() => {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    return () => {
      document.title = originalTitle;
      if (savedDark) html.classList.add('dark');
      if (savedDarkTheme) html.classList.add('dark-theme');
    };
  }, []);

  return (
    <div className="antialiased min-h-screen overflow-x-hidden w-full h-screen overflow-y-auto relative" style={{ backgroundColor: '#000000', color: '#fafafa' }}>
      {/* Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1100px] bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-lg rounded-full z-50 hidden md:flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-4">
          <img alt="SentraKas Logo" className="h-12 object-contain brightness-0 invert" src={logoSentrakas} />
        </div>
        <div className="flex items-center gap-8">
          <a className="text-white font-bold text-xs tracking-widest hover:text-indigo-400 transition-colors" href="#beranda">BERANDA</a>
          <Link className="text-zinc-400 hover:text-indigo-400 transition-colors text-xs tracking-widest font-semibold" to="/tentang">TENTANG</Link>
          <Link className="text-zinc-400 hover:text-indigo-400 transition-colors text-xs tracking-widest font-semibold" to="/harga">HARGA</Link>
          <Link className="text-zinc-400 hover:text-indigo-400 transition-colors text-xs tracking-widest font-semibold" to="/kontak">KONTAK</Link>
        </div>
        <div>
          <Link className="inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" to="/login">Masuk</Link>
        </div>
      </nav>

      {/* Mobile branding */}
      <div className="fixed top-4 left-4 z-50 flex md:hidden items-center bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-4 py-2 shadow-lg">
        <img alt="SentraKas Logo" className="h-9 object-contain brightness-0 invert" src={logoSentrakas} />
      </div>

      {/* Mobile nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[480px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-2xl z-50 flex md:hidden items-center justify-around py-2.5 px-3">
        {[
          { to: '#beranda', label: 'Beranda', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
          { to: '/tentang', label: 'Tentang', icon: 'M11.25 11.25l.041-.02a.75.75 0 111.083.985l-.04.02a.75.75 0 01-1.083-.985zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { to: '/harga', label: 'Harga', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.44 1.44 0 002.037 0l4.723-4.723a1.44 1.44 0 000-2.037l-9.58-9.58A2.25 2.25 0 009.568 3z' },
          { to: '/kontak', label: 'Kontak', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
          { to: '/login', label: 'Masuk', icon: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75' },
        ].map((item, i) => (
          item.to.startsWith('#') ? (
            <a key={i} href={item.to} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-indigo-400 transition-colors py-1 px-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
            </a>
          ) : (
            <Link key={i} to={item.to} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-indigo-400 transition-colors py-1 px-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
            </Link>
          )
        ))}
      </nav>

      <main className="w-full">
        {/* ===== HERO ===== */}
        <div className="relative w-full min-h-[90vh] overflow-hidden" id="beranda" style={{ backgroundColor: '#000000' }}>
          <div className="absolute inset-0 z-0">
            <Beams beamWidth={3} beamHeight={50} beamNumber={100} lightColor="#e6e8ea" speed={2} noiseIntensity={1.75} scale={0.2} rotation={0} />
          </div>
          <section className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl mx-auto min-h-[90vh] px-6 pt-32 pb-20 text-center">
            <div className="w-full flex flex-col items-center max-w-4xl">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
                Kelola Toko <span className="text-indigo-400">10× Lebih</span> Cepat & Cerdas
              </h1>

              <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl mb-10">
                Mulai dari kasir, stok, laporan keuangan, hingga analitik pelanggan — semua dalam satu dashboard. 
                Tanpa ribet, tanpa aplikasi tambahan.
              </p>

              <div className="flex flex-wrap gap-4 justify-center mb-12">
                <a href="#" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-lg shadow-indigo-900/50">
                  <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                  Coba Gratis 14 Hari
                </a>
                <a href="#" className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl font-bold text-base hover:bg-zinc-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <span className="material-symbols-outlined text-[20px]">play_circle</span>
                  Lihat Demo
                </a>
              </div>

              {/* Hero stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl">
                {stats.map((s, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md hover:border-indigo-700 transition-all duration-200">
                    <p className="text-2xl md:text-3xl font-black text-indigo-400">{s.value}</p>
                    <p className="text-sm text-zinc-400 mt-1 leading-tight font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-10 text-sm text-zinc-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-700 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-indigo-900/60 text-indigo-300 flex items-center justify-center text-[10px] font-black">+2k</div>
                </div>
                <span className="font-semibold">Dipercaya 2.000+ pengusaha Indonesia</span>
              </div>
            </div>
          </section>
        </div>

        {/* ===== FITUR ===== */}
        <section className="py-28 border-y border-zinc-900" id="fitur" style={{ backgroundColor: '#0a0a0a' }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto space-y-4">
                <h2 className="text-4xl font-bold text-white tracking-tight">
                Satu Platform untuk Semua Urusan Toko
              </h2>
              <p className="text-lg text-zinc-400">
                Tidak perlu integrasi manual atau gonta-ganti aplikasi. SentraKas sudah mencakup seluruh siklus operasional bisnis ritel & F&amp;B.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className="group rounded-2xl p-7 hover:shadow-lg hover:border-indigo-700 hover:-translate-y-1 transition-all duration-300 border border-zinc-800" style={{ backgroundColor: '#111111' }}>
                  <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <span className={`material-symbols-outlined text-[26px] ${f.iconColor}`}>{f.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CHART MOCK ===== */}
        <section className="py-28" style={{ backgroundColor: '#000000' }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 w-full">
                <div className="rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-800" style={{ backgroundColor: '#111111' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-zinc-400 font-bold">Grafik Penjualan</p>
                      <p className="text-2xl font-black text-white">Rp 28,4 Juta</p>
                      <p className="text-sm text-green-400 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        +12.5% dari bulan lalu
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-800"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-700"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-800"></span>
                    </div>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }}
                          formatter={(v) => [`Rp${v} Juta`, 'Pendapatan']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Pantau Kinerja Bisnis dalam Hitungan Detik
                </h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  Dashboard analitik menampilkan tren penjualan, performa kasir, kategori produk terlaris, dan metode pembayaran favorit — semua dalam satu layar.
                </p>
                <ul className="space-y-3">
                  {[
                    'Rekap harian, mingguan, dan bulanan otomatis',
                    '10+ grafik interaktif siap pakai',
                    'Export laporan ke Excel/PDF satu klik',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-200 font-semibold">
                      <span className="w-6 h-6 rounded-full bg-indigo-900/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-indigo-400 font-bold">check</span>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ===== INTEGRASI ===== */}
        <section className="py-28" style={{ backgroundColor: '#0a0a0a' }}>
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Terima Pembayaran dari Semua Metode
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-12">
              Dari tunai hingga QRIS, dari e-wallet hingga split payment — tidak perlu minta pelanggan ganti aplikasi.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-3xl mx-auto">
              {[
                { label: 'Tunai', icon: 'payments', bg: 'bg-green-900/30', text: 'text-green-300' },
                { label: 'QRIS', icon: 'qr_code', bg: 'bg-blue-900/30', text: 'text-blue-300' },
                { label: 'Kartu', icon: 'credit_card', bg: 'bg-purple-900/30', text: 'text-purple-300' },
                { label: 'E-Wallet', icon: 'wallet', bg: 'bg-amber-900/30', text: 'text-amber-300' },
                { label: 'Split', icon: 'call_split', bg: 'bg-red-900/30', text: 'text-red-300' },
                { label: 'Transfer', icon: 'account_balance', bg: 'bg-indigo-900/30', text: 'text-indigo-300' },
              ].map((pm, i) => (
                <div key={i} className={`${pm.bg} ${pm.text} rounded-2xl p-4 md:p-5 flex flex-col items-center gap-2 border border-zinc-800 hover:scale-105 transition-transform duration-200`}>
                  <span className="material-symbols-outlined text-[28px]">{pm.icon}</span>
                  <span className="text-sm font-bold">{pm.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HARGA ===== */}
        <section className="py-28" id="harga" style={{ backgroundColor: '#000000' }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl font-bold text-white tracking-tight">Pilih Paket Sesuai Skala Bisnis</h2>
              <p className="text-lg text-zinc-400">Semua paket sudah termasuk support 24/7 dan update gratis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="rounded-3xl hover:shadow-lg transition-shadow flex flex-col h-full p-8 border border-zinc-800" style={{ backgroundColor: '#111111' }}>
                <span className="inline-block px-3 py-1 bg-zinc-800 text-zinc-300 font-bold text-sm rounded-full mb-4 w-fit">Pemula</span>
                <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-white">Rp150.000</span>
                  <span className="text-zinc-400 font-medium">/bln</span>
                </div>
                <p className="text-sm text-zinc-400 mb-6">Cocok untuk UMKM dan toko baru mulai digitalisasi.</p>
                <div className="w-full h-px bg-zinc-800 mb-6" />
                <ul className="space-y-3 mb-8 flex-1">
                  {['Kasir Online & Offline', 'Laporan Penjualan Standar', 'Manajemen 1 Outlet', 'Dukungan 24/7'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-200 font-bold">
                      <div className="w-6 h-6 rounded-full bg-indigo-900/40 flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-indigo-400 font-bold">check</span></div>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#" className="block w-full text-center py-4 rounded-xl font-bold transition-all border border-zinc-700 text-white hover:bg-zinc-800" style={{ backgroundColor: '#1a1a1a' }}>Mulai dengan Basic</a>
              </div>

              <div className="bg-indigo-600 p-8 rounded-3xl shadow-2xl flex flex-col h-full relative transform md:-translate-y-4">
                <div className="absolute top-0 right-8 -translate-y-1/2">
                  <span className="bg-amber-400 text-amber-900 text-sm font-bold px-4 py-2 rounded-full shadow-lg">Paling Populer</span>
                </div>
                <span className="inline-block px-3 py-1 bg-white/20 text-white font-bold text-sm rounded-full mb-4 w-fit">Profesional</span>
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-white">Rp350.000</span>
                  <span className="text-white/80 font-medium">/bln</span>
                </div>
                <p className="text-white/80 text-sm mb-6">Solusi lengkap untuk bisnis yang bertumbuh pesat.</p>
                <div className="w-full h-px bg-white/20 mb-6" />
                <ul className="space-y-3 mb-8 flex-1">
                  {['Semua fitur Basic', 'Manajemen Stok & Inventaris Lanjut', 'Multi-Outlet (Hingga 5 Cabang)', 'Analitik & Grafik Cerdas', 'Integrasi Multi Pembayaran'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-white font-semibold">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-white font-bold">check</span></div>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#" className="block w-full text-center py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg">Mulai dengan Pro</a>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONI + CTA ===== */}
        <section className="py-28" id="testimoni" style={{ backgroundColor: '#0a0a0a' }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden border border-zinc-800 shadow-sm" style={{ backgroundColor: '#111111' }}>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-900/30 rounded-full blur-3xl" />

              <div className="flex-1 space-y-6 z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                  Siap Bawa Bisnis ke Level Berikutnya?
                </h2>
                <p className="text-lg text-zinc-400">
                  Ribuan pengusaha sudah beralih. Gratis 14 hari, tanpa kartu kredit, tanpa komitmen.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <a href="#" className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                    Mulai Sekarang
                  </a>
                  <Link to="/kontak" className="inline-flex items-center gap-2 px-6 py-3.5 border border-zinc-700 text-zinc-200 rounded-xl font-bold hover:bg-zinc-800 transition-all">
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    Hubungi Tim
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400 pt-2">
                  <span className="flex items-center gap-1 font-semibold"><span className="material-symbols-outlined text-[16px] text-green-400">check_circle</span> Bebas biaya setup</span>
                  <span className="flex items-center gap-1 font-semibold"><span className="material-symbols-outlined text-[16px] text-green-400">check_circle</span> Batal kapan saja</span>
                </div>
              </div>

              <div className="flex-1 w-full p-8 rounded-2xl shadow-sm border border-zinc-800 z-10 relative" style={{ backgroundColor: '#0a0a0a' }}>
                <span className="absolute -top-4 -left-4 text-5xl text-indigo-700 material-symbols-outlined">format_quote</span>
                <div className="flex gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-[18px]">star</span>)}
                </div>
                <p className="text-lg text-zinc-200 font-medium italic mb-6 leading-relaxed">
                  "Dulu saya pakai 3 aplikasi berbeda untuk kasir, stok, dan laporan. Sekarang cukup satu. 
                  Yang paling saya suka adalah laporan keuangannya — siap audit, tinggal print."
                </p>
                <div className="flex items-center gap-4">
                  <img src="https://i.pravatar.cc/100?img=11" alt="Reviewer" className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-bold text-indigo-400">Sari Dewi</p>
                    <p className="text-sm text-zinc-400">Owner, Warung Seger</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
