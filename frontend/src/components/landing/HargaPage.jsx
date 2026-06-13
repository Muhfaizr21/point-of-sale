import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoSentrakas from '../../assets/Sentrakas.png';
import { PublicFooter } from './PublicFooter';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Cocok untuk UMKM dan toko baru',
    monthly: 150000,
    yearly: 1500000,
    badge: null,
    features: [
      { name: 'Outlet', basic: '1', pro: 'Hingga 5', enterprise: 'Tak terbatas' },
      { name: 'Transaksi per bulan', basic: '1.000', pro: '5.000', enterprise: 'Tak terbatas' },
      { name: 'Laporan keuangan', basic: 'Standar', pro: 'Lanjutan + Laba-rugi', enterprise: 'Konsolidasi multi-cabang' },
      { name: 'Manajemen stok', basic: 'Dasar', pro: 'Lanjutan + alert', enterprise: 'Prediktif (AI)' },
      { name: 'Metode pembayaran', basic: 'Tunai & QRIS', pro: '15+ metode + split', enterprise: 'Semua + kustom' },
      { name: 'Integrasi marketplace', basic: false, pro: true, enterprise: true },
      { name: 'Multi-cabang', basic: false, pro: 'Hingga 5', enterprise: 'Tak terbatas' },
      { name: 'Dukungan', basic: 'Email 1×24 jam', pro: 'Prioritas 24/7', enterprise: 'CS khusus + SLA' },
      { name: 'API akses', basic: false, pro: true, enterprise: true },
      { name: 'Migrasi data', basic: false, pro: true, enterprise: 'Gratis penuh' },
    ],
    cta: 'Mulai Basic',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Untuk bisnis berkembang pesat',
    monthly: 350000,
    yearly: 3500000,
    badge: 'Paling Populer',
    features: [
      { name: 'Outlet', basic: '1', pro: 'Hingga 5', enterprise: 'Tak terbatas' },
      { name: 'Transaksi per bulan', basic: '1.000', pro: '5.000', enterprise: 'Tak terbatas' },
      { name: 'Laporan keuangan', basic: 'Standar', pro: 'Lanjutan + Laba-rugi', enterprise: 'Konsolidasi multi-cabang' },
      { name: 'Manajemen stok', basic: 'Dasar', pro: 'Lanjutan + alert', enterprise: 'Prediktif (AI)' },
      { name: 'Metode pembayaran', basic: 'Tunai & QRIS', pro: '15+ metode + split', enterprise: 'Semua + kustom' },
      { name: 'Integrasi marketplace', basic: false, pro: true, enterprise: true },
      { name: 'Multi-cabang', basic: false, pro: 'Hingga 5', enterprise: 'Tak terbatas' },
      { name: 'Dukungan', basic: 'Email 1×24 jam', pro: 'Prioritas 24/7', enterprise: 'CS khusus + SLA' },
      { name: 'API akses', basic: false, pro: true, enterprise: true },
      { name: 'Migrasi data', basic: false, pro: true, enterprise: 'Gratis penuh' },
    ],
    cta: 'Pilih Pro',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Untuk korporasi & rantai toko besar',
    monthly: null,
    yearly: null,
    badge: 'Hubungi Tim',
    features: [
      { name: 'Outlet', basic: '1', pro: 'Hingga 5', enterprise: 'Tak terbatas' },
      { name: 'Transaksi per bulan', basic: '1.000', pro: '5.000', enterprise: 'Tak terbatas' },
      { name: 'Laporan keuangan', basic: 'Standar', pro: 'Lanjutan + Laba-rugi', enterprise: 'Konsolidasi multi-cabang' },
      { name: 'Manajemen stok', basic: 'Dasar', pro: 'Lanjutan + alert', enterprise: 'Prediktif (AI)' },
      { name: 'Metode pembayaran', basic: 'Tunai & QRIS', pro: '15+ metode + split', enterprise: 'Semua + kustom' },
      { name: 'Integrasi marketplace', basic: false, pro: true, enterprise: true },
      { name: 'Multi-cabang', basic: false, pro: 'Hingga 5', enterprise: 'Tak terbatas' },
      { name: 'Dukungan', basic: 'Email 1×24 jam', pro: 'Prioritas 24/7', enterprise: 'CS khusus + SLA' },
      { name: 'API akses', basic: false, pro: true, enterprise: true },
      { name: 'Migrasi data', basic: false, pro: true, enterprise: 'Gratis penuh' },
    ],
    cta: 'Hubungi Tim',
    highlighted: false,
  },
]

const faqs = [
  { q: 'Apakah ada biaya instalasi atau setup?', a: 'Tidak ada. Semua paket sudah termasuk setup dan aktivasi gratis. Tim kami akan membantu migrasi data dari sistem lama Anda tanpa biaya tambahan.' },
  { q: 'Bisakah saya upgrade atau downgrade paket?', a: 'Tentu. Upgrade atau downgrade dapat dilakukan kapan saja dari dashboard. Perubahan biaya akan disesuaikan secara proporsional di siklus penagihan berikutnya.' },
  { q: 'Apakah data saya aman?', a: 'Kami menggunakan enkripsi SSL 256-bit untuk semua data. Server tersertifikasi ISO 27001 dengan backup harian otomatis dan SLA 99,9% uptime.' },
  { q: 'Bagaimana jika saya melebihi batas transaksi?', a: 'Anda akan mendapat notifikasi otomatis. Kelebihan transaksi dikenakan biaya per transaksi sesuai kebijakan fair-use, atau Anda bisa upgrade ke paket yang lebih tinggi.' },
  { q: 'Apakah ada uji coba gratis?', a: 'Ya, semua paket bisa dicoba gratis selama 14 hari tanpa kartu kredit. Akses semua fitur, tidak ada batasan.' },
]

const CheckIcon = () => <span className="material-symbols-outlined text-indigo-400 text-[16px]">check</span>
const DashIcon = () => <span className="material-symbols-outlined text-zinc-600 text-[16px]">remove</span>
const FeatureCell = ({ val }) => {
  if (val === true) return <CheckIcon />
  if (val === false) return <DashIcon />
  return <span className="text-zinc-200 text-sm font-medium">{val}</span>
}

export const HargaPage = () => {
  const [yearly, setYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    document.title = 'Daftar Harga - SentraKas POS';
    window.scrollTo(0, 0);
  }, []);

  const formatPrice = (v) => v ? `Rp ${(v / 1000).toFixed(0)}`.replace('.', ',') : null

  return (
    <div className="antialiased min-h-screen overflow-x-hidden w-full h-screen overflow-y-auto relative" style={{ backgroundColor: '#000000', color: '#fafafa' }}>
      {/* Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1100px] bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-lg rounded-full z-50 hidden md:flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-4"><Link to="/"><img alt="SentraKas Logo" className="h-12 object-contain brightness-0 invert" src={logoSentrakas} /></Link></div>
        <div className="flex items-center gap-8">
          <Link className="text-zinc-400 hover:text-white transition-colors text-xs tracking-widest font-semibold" to="/">HOME</Link>
          <Link className="text-zinc-400 hover:text-white transition-colors text-xs tracking-widest font-semibold" to="/tentang">TENTANG</Link>
          <Link className="text-white font-bold text-xs tracking-widest" to="/harga">HARGA</Link>
          <Link className="text-zinc-400 hover:text-white transition-colors text-xs tracking-widest font-semibold" to="/kontak">KONTAK</Link>
        </div>
        <div><Link className="inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" to="/login">Masuk</Link></div>
      </nav>

      {/* Mobile branding */}
      <div className="fixed top-4 left-4 z-50 flex md:hidden items-center bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-4 py-2 shadow-lg">
        <Link to="/"><img alt="SentraKas Logo" className="h-9 object-contain brightness-0 invert" src={logoSentrakas} /></Link>
      </div>

      {/* Mobile nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[480px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-2xl z-50 flex md:hidden items-center justify-around py-2.5 px-3">
        {[
          { to: '/', label: 'Home', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
          { to: '/tentang', label: 'Tentang', icon: 'M11.25 11.25l.041-.02a.75.75 0 111.083.985l-.04.02a.75.75 0 01-1.083-.985zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { to: '/harga', label: 'Harga', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.44 1.44 0 002.037 0l4.723-4.723a1.44 1.44 0 000-2.037l-9.58-9.58A2.25 2.25 0 009.568 3z' },
          { to: '/kontak', label: 'Kontak', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
          { to: '/login', label: 'Masuk', icon: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75' },
        ].map((item, i) => (
          <Link key={i} to={item.to} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors py-1 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
            <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
          </Link>
        ))}
      </nav>

      <main className="w-full max-w-[1200px] mx-auto px-6 md:px-12 py-24 md:py-32 flex flex-col gap-20 md:gap-28">
        {/* ===== HEADER ===== */}
        <section className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-5">
            <span className="material-symbols-outlined text-[16px]">payments</span>
            Harga Transparan, Tanpa Biaya Tersembunyi
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-4">
            Investasi untuk Efisiensi Bisnis Anda
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Pilih paket yang paling sesuai dengan skala dan kebutuhan toko Anda. 
            Semua paket sudah termasuk support teknis, update fitur, dan enkripsi data.
          </p>
        </section>

        {/* ===== TOGGLE BULANAN/TAHUNAN ===== */}
        <div className="flex items-center justify-center gap-4 -mt-8">
          <span className={`text-sm font-bold ${!yearly ? 'text-white' : 'text-zinc-500'}`}>Bulanan</span>
          <button onClick={() => setYearly(!yearly)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${yearly ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${yearly ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-bold ${yearly ? 'text-white' : 'text-zinc-500'}`}>
            Tahunan <span className="text-green-400 text-xs font-bold">(irit 2 bulan)</span>
          </span>
        </div>

        {/* ===== PRICING CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative rounded-2xl flex flex-col transition-all duration-300 ${plan.highlighted ? 'border-2 border-indigo-500 shadow-lg shadow-indigo-900/20 scale-[1.02] md:scale-105 z-10' : 'border border-zinc-800 hover:border-zinc-600'}`}
              style={{ backgroundColor: plan.highlighted ? '#0f0f1a' : '#0a0a0a' }}>
              
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-lg">
                  {plan.badge}
                </div>
              )}
              {plan.id === 'enterprise' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  Kustom
                </div>
              )}

              <div className="p-6 md:p-8 flex flex-col h-full">
                {/* Card header */}
                <div className="mb-6">
                  <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-zinc-400">{plan.tagline}</p>
                </div>

                {/* Price */}
                {plan.monthly ? (
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">
                        {yearly ? formatPrice(plan.yearly) : formatPrice(plan.monthly)}
                      </span>
                      <span className="text-zinc-500 text-sm font-medium">/{yearly ? 'thn' : 'bln'}</span>
                    </div>
                    {yearly && <p className="text-xs text-green-400 font-semibold mt-1">Hemat Rp {((plan.monthly * 12 - plan.yearly) / 1000).toFixed(0)}rb/tahun</p>}
                  </div>
                ) : (
                  <div className="mb-6">
                    <span className="text-4xl font-black text-white">Kustom</span>
                    <p className="text-xs text-zinc-400 mt-1">Berdasarkan skala & kebutuhan</p>
                  </div>
                )}

                {/* Features for card */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <FeatureCell val={f[plan.id]} />
                      <span className="text-zinc-300 text-sm">{f.name}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.id === 'enterprise' ? (
                  <Link to="/kontak" className="block w-full text-center py-3.5 rounded-xl font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-all">Hubungi Tim</Link>
                ) : (
                  <button className={`w-full py-3.5 rounded-xl font-bold transition-all ${plan.highlighted ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg' : 'border border-zinc-700 text-zinc-200 hover:bg-zinc-800'}`}>
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ===== PERBANDINGAN FITUR ===== */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-4">
              <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
              Perbandingan Fitur
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Bandingkan Setiap Detail</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800" style={{ backgroundColor: '#0a0a0a' }}>
                  <th className="p-4 text-sm font-bold text-zinc-400 min-w-[160px]">Fitur</th>
                  {plans.map(p => (
                    <th key={p.id} className={`p-4 text-sm font-black min-w-[120px] ${p.highlighted ? 'text-indigo-400' : 'text-zinc-300'}`}>
                      {p.name}
                      {p.badge && <span className="block text-[10px] font-bold text-indigo-500 mt-0.5">{p.badge}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {plans[0].features.map((f, i) => (
                  <tr key={i} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 text-sm font-semibold text-zinc-200">{f.name}</td>
                    {plans.map(p => (
                      <td key={p.id} className="p-4"><FeatureCell val={f[p.id]} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== CALLOUT ===== */}
        <section className="rounded-3xl p-8 md:p-12 border border-zinc-800 text-center" style={{ backgroundColor: '#0a0a0a' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-4">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            Jaminan 14 Hari
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3">Tidak Puas? Uang Kembali</h2>
          <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed mb-8">
            Kami percaya dengan kualitas produk. Jika dalam 14 hari pertama Anda merasa SentraKas tidak sesuai, 
            kami akan mengembalikan 100% uang Anda. Tanpa syarat, tanpa ribet.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg">
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Mulai Trial Gratis
            </Link>
            <Link to="/kontak" className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-200 rounded-xl font-bold hover:bg-zinc-800 transition-all">
              <span className="material-symbols-outlined text-[18px]">chat</span>
              Konsultasi Gratis
            </Link>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Pertanyaan Umum</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 overflow-hidden transition-all duration-200" style={{ backgroundColor: '#0a0a0a' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-zinc-900/50 transition-colors">
                  <span className="text-white font-bold text-sm md:text-base pr-4">{faq.q}</span>
                  <span className={`material-symbols-outlined text-zinc-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
