import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoSentrakas from '../../assets/Sentrakas.png';
import { PublicFooter } from './PublicFooter';

const milestones = [
  { year: '2023', title: 'Rilis Perdana', desc: 'Versi awal digunakan oleh 50 merchant di Jabodetabek sebagai POS modern berbasis web.' },
  { year: '2024', title: 'Skala & Fitur', desc: 'Meluncurkan fitur multi-outlet, analitik, dan integrasi pembayaran. Tumbuh menjadi 500+ pengguna aktif.' },
  { year: '2025', title: 'Market Leader', desc: 'Dipercaya 2.000+ pengusaha ritel dan F&B. Mendukung 15+ metode pembayaran dan laporan keuangan siap audit.' },
  { year: '2026', title: 'Ekosistem Terbuka', desc: 'Integrasi marketplace, API publik, dan fitur AI untuk prediksi stok & rekomendasi produk.' },
]

const values = [
  { icon: 'speed', title: 'Kinerja Tanpa Kompromi', desc: 'Transaksi diproses dalam milidetik. Sistem tetap stabil meski ribuan transaksi terjadi bersamaan.' },
  { icon: 'verified', title: 'Akurasi Data Terjamin', desc: 'Setiap transaksi tercatat otomatis. Tidak ada selisih antara stok fisik dan catatan sistem.' },
  { icon: 'headset_mic', title: 'Dukungan Manusia', desc: 'Tim support teknis siap membantu dalam 5 menit. Bukan chatbot — manusia sungguhan yang paham bisnis Anda.' },
  { icon: 'security', title: 'Keamanan 24/7', desc: 'Enkripsi data end-to-end, backup otomatis, dan server dengan SLA 99,9% uptime terjamin.' },
]

const team = [
  { name: 'Arief Wicaksono', role: 'CEO & Founder', img: 'https://i.pravatar.cc/150?img=11' },
  { name: 'Dian Permatasari', role: 'CTO', img: 'https://i.pravatar.cc/150?img=5' },
  { name: 'Rizky Hidayat', role: 'Head of Product', img: 'https://i.pravatar.cc/150?img=12' },
  { name: 'Sari Indah', role: 'Head of Customer', img: 'https://i.pravatar.cc/150?img=9' },
]

export const AboutPage = () => {
  useEffect(() => {
    document.title = 'Tentang Kami - SentraKas POS';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="antialiased min-h-screen overflow-x-hidden w-full h-screen overflow-y-auto relative" style={{ backgroundColor: '#000000', color: '#fafafa' }}>
      {/* Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1100px] bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-lg rounded-full z-50 hidden md:flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-4"><Link to="/"><img alt="SentraKas Logo" className="h-12 object-contain brightness-0 invert" src={logoSentrakas} /></Link></div>
        <div className="flex items-center gap-8">
          <Link className="text-zinc-400 hover:text-white transition-colors text-xs tracking-widest font-semibold" to="/">HOME</Link>
          <Link className="text-white font-bold text-xs tracking-widest" to="/tentang">TENTANG</Link>
          <Link className="text-zinc-400 hover:text-white transition-colors text-xs tracking-widest font-semibold" to="/harga">HARGA</Link>
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
        <Link to="/" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors py-1 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
          <span className="text-[9px] font-bold tracking-wide">Home</span>
        </Link>
        <Link to="/tentang" className="flex flex-col items-center gap-1 text-white transition-colors py-1 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.083.985l-.04.02a.75.75 0 01-1.083-.985zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-[9px] font-bold tracking-wide">Tentang</span>
        </Link>
        <Link to="/harga" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors py-1 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.44 1.44 0 002.037 0l4.723-4.723a1.44 1.44 0 000-2.037l-9.58-9.58A2.25 2.25 0 009.568 3z" /></svg>
          <span className="text-[9px] font-bold tracking-wide">Harga</span>
        </Link>
        <Link to="/kontak" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors py-1 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
          <span className="text-[9px] font-bold tracking-wide">Kontak</span>
        </Link>
        <Link to="/login" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors py-1 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
          <span className="text-[9px] font-bold tracking-wide">Masuk</span>
        </Link>
      </nav>

      <main className="w-full max-w-[1200px] mx-auto px-6 md:px-12 py-24 md:py-32 flex flex-col gap-20 md:gap-28">
        {/* ===== HERO ===== */}
        <section className="flex flex-col lg:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold w-fit">
              <span className="material-symbols-outlined text-[16px]">business</span>
              Perusahaan Teknologi Ritel Indonesia
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Membangun Infrastruktur Digital untuk 2.000+ Gerai Ritel & F&amp;B
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed">
              SentraKas didirikan dengan satu misi: membuat operasional bisnis ritel dan F&amp;B 
              Indonesia lebih efisien, transparan, dan terukur — melalui platform POS yang andal, 
              laporan yang akurat, dan dukungan yang cepat.
            </p>
            <div className="flex items-center gap-8 pt-2">
              <div>
                <p className="text-3xl font-black text-indigo-400">2.000+</p>
                <p className="text-sm text-zinc-400 font-medium">Pengusaha Aktif</p>
              </div>
              <div className="w-px h-12 bg-zinc-800" />
              <div>
                <p className="text-3xl font-black text-indigo-400">15+</p>
                <p className="text-sm text-zinc-400 font-medium">Metode Pembayaran</p>
              </div>
              <div className="w-px h-12 bg-zinc-800" />
              <div>
                <p className="text-3xl font-black text-indigo-400">99,9%</p>
                <p className="text-sm text-zinc-400 font-medium">Uptime Server</p>
              </div>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="flex-1 w-full relative group">
            <div className="w-full rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <div className="mx-auto bg-zinc-800 rounded-lg px-6 py-1 text-xs text-zinc-400">sentrakas.id/dashboard</div>
              </div>
              <div className="relative w-full overflow-hidden" style={{ backgroundColor: '#050505' }}>
                <img alt="SentraKas Dashboard" className="w-full h-auto object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-500" src="https://lh3.googleusercontent.com/aida/AP1WRLtN0YKD_isqAnYzgPMYzvnIIHiK7AmEc6khN8eSndTyvy56-Pf46LcPpfJdc7766bachyHuJlTzjZLo--ljyI8DT8D11_palduRUhwxcBSJJw45OOTqouKOXrtdYbkwED_a-QHUgfQSffbuOcvZl-1bimwdc28OtDQ2akdSUjsl2BQ6hh-lk4kosSzE1_XLKZI3rq2O5HrawnEo15guekQzV5vMeJu6pbgbiHaiMFfA3YuDPw93_tGz" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== VALUES ===== */}
        <section>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-4">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Standar Operasional
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Empat Pilar yang Menjadi Fondasi Kami</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="rounded-2xl p-6 border border-zinc-800 hover:border-indigo-800 transition-all duration-300" style={{ backgroundColor: '#0a0a0a' }}>
                <div className="w-11 h-11 rounded-xl bg-indigo-900/40 flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-indigo-400 text-[24px]">{v.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== MILESTONE ===== */}
        <section>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-4">
              <span className="material-symbols-outlined text-[16px]">timeline</span>
              Perjalanan Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Dari Startup Menjadi Platform Ritel Nasional</h2>
          </div>
          <div className="relative">
            <div className="absolute left-[18px] md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-800 -translate-x-1/2" />
            <div className="space-y-10">
              {milestones.map((m, i) => (
                <div key={i} className={`relative flex flex-col md:flex-row items-start gap-6 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="hidden md:block flex-1" />
                  <div className="absolute left-0 md:left-1/2 w-9 h-9 rounded-full bg-indigo-900/60 border-2 border-indigo-500 flex items-center justify-center -translate-x-[14px] md:-translate-x-[18px] z-10">
                    <span className="text-[10px] font-black text-indigo-300">{m.year.slice(2)}</span>
                  </div>
                  <div className="flex-1 pl-14 md:pl-0">
                    <div className="rounded-2xl p-6 border border-zinc-800" style={{ backgroundColor: '#0a0a0a' }}>
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-900/30 px-3 py-1 rounded-full">{m.year}</span>
                      <h3 className="text-lg font-bold text-white mt-2 mb-1">{m.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TEAM ===== */}
        <section>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-4">
              <span className="material-symbols-outlined text-[16px]">groups</span>
              Tim Inti
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Orang di Balik SentraKas</h2>
            <p className="text-lg text-zinc-400 mt-3 max-w-xl mx-auto">Tim kecil dengan pengalaman puluhan tahun di teknologi ritel, fintech, dan produk digital.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((t, i) => (
              <div key={i} className="rounded-2xl p-6 border border-zinc-800 text-center hover:border-zinc-700 transition-all" style={{ backgroundColor: '#0a0a0a' }}>
                <img src={t.img} alt={t.name} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-zinc-700" />
                <h3 className="text-white font-bold text-sm">{t.name}</h3>
                <p className="text-zinc-400 text-xs mt-1">{t.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="rounded-3xl p-8 md:p-16 text-center border border-zinc-800 shadow-sm" style={{ backgroundColor: '#0a0a0a' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-4">
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            Mulai Sekarang
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-4">Gabung dengan 2.000+ Pengusaha yang Sudah Beralih</h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Anda dapat mencoba SentraKas secara gratis selama 14 hari. Tanpa kartu kredit, tanpa komitmen, tanpa biaya setup. Tim kami siap membantu migrasi data dari sistem lama Anda.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/harga" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg">
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Mulai Gratis 14 Hari
            </Link>
            <Link to="/kontak" className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-200 rounded-xl font-bold hover:bg-zinc-800 transition-all">
              <span className="material-symbols-outlined text-[18px]">chat</span>
              Jadwalkan Demo
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
