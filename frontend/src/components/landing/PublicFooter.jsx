import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoSentrakas from '../../assets/Sentrakas.png';

export const PublicFooter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }, 800);
  };

  return (
    <footer className="w-full bg-[#09090b] border-t border-white/5 py-16 px-6 md:px-12 mt-auto pb-28 md:pb-16 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top accent border line with ambient highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 via-indigo-500/20 via-zinc-800 to-transparent"></div>

      <div className="w-full max-w-[1200px] mx-auto relative z-10" style={{ width: '100%' }}>
        {/* Main Columns: Brand, Links, Newsletter */}
        <div className="w-full flex flex-col md:flex-row justify-between gap-10 pb-12 border-b border-white/5" style={{ width: '100%' }}>
          
          {/* Left Column: Brand & Logo */}
          <div className="w-full text-center md:text-left space-y-6" style={{ flex: '1 1 30%', minWidth: '260px', maxWidth: '380px' }}>
            <div className="h-9 flex justify-center md:justify-start">
              <img
                src={logoSentrakas}
                alt="SentraKas Logo"
                className="h-full w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed" style={{ width: '100%' }}>
              SentraKas menghadirkan solusi kasir cerdas untuk pertumbuhan usaha retail dan F&B Anda tanpa batas. Kelola transaksi, stok, dan laporan dalam satu ketukan.
            </p>
            
            {/* Status Live Terminal Badge */}
            <div className="flex justify-center md:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/10 text-zinc-400 text-xs backdrop-blur-sm shadow-inner">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="font-mono text-[11px] tracking-wide text-zinc-300">Terminal SentraKas Terkoneksi</span>
              </div>
            </div>
          </div>

          {/* Middle Column: Links */}
          <div className="w-full grid grid-cols-2 gap-6 text-center md:text-left pt-2" style={{ flex: '1 1 35%', minWidth: '260px' }}>
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest">Navigasi</h4>
              <ul className="space-y-3 text-zinc-400 text-sm">
                <li>
                  <Link to="/" className="group relative inline-block hover:text-white transition-colors duration-300">
                    Beranda
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
                <li>
                  <Link to="/tentang" className="group relative inline-block hover:text-white transition-colors duration-300">
                    Tentang Kami
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
                <li>
                  <Link to="/harga" className="group relative inline-block hover:text-white transition-colors duration-300">
                    Daftar Harga
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
                <li>
                  <Link to="/kontak" className="group relative inline-block hover:text-white transition-colors duration-300">
                    Hubungi Kami
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest">Bantuan</h4>
              <ul className="space-y-3 text-zinc-400 text-sm">
                <li>
                  <a href="#" className="group relative inline-block hover:text-white transition-colors duration-300">
                    Pusat Bantuan
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </li>
                <li>
                  <a href="#" className="group relative inline-block hover:text-white transition-colors duration-300">
                    Dokumentasi API
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </li>
                <li>
                  <a href="#" className="group relative inline-block hover:text-white transition-colors duration-300">
                    Syarat Ketentuan
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </li>
                <li>
                  <a href="#" className="group relative inline-block hover:text-white transition-colors duration-300">
                    Kebijakan Privasi
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-indigo-400 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Newsletter Signup */}
          <div className="w-full space-y-4 text-center md:text-left" style={{ flex: '1 1 30%', minWidth: '260px', maxWidth: '380px' }}>
            <h4 className="text-xs font-semibold text-white uppercase tracking-widest">Dapatkan Pembaruan</h4>
            <p className="text-zinc-400 text-sm leading-relaxed" style={{ width: '100%' }}>
              Dapatkan info update fitur kasir, tip manajemen bisnis, dan promosi eksklusif langsung di email Anda.
            </p>
            <div className="flex justify-center md:justify-start w-full">
              <form onSubmit={handleSubscribe} className="space-y-2" style={{ width: '100%' }}>
                <div className="relative w-full" style={{ width: '100%' }}>
                  <input
                    type="email"
                    required
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || subscribed}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-lg py-2.5 pl-4 pr-28 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 disabled:opacity-50"
                    style={{ width: '100%' }}
                  />
                  <button
                    type="submit"
                    disabled={loading || subscribed}
                    className="absolute right-1 top-1 bottom-1 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-md hover:shadow-indigo-500/20 transition-all duration-300 disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center cursor-pointer"
                  >
                    {loading ? '...' : subscribed ? 'Terkirim' : 'Langganan'}
                  </button>
                </div>
                {subscribed && (
                  <p className="text-indigo-400 text-xs animate-fade-in font-medium pl-1 text-left">
                    ✓ Terima kasih! Alamat email Anda telah terdaftar.
                  </p>
                )}
              </form>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Trust Indicators, Social Media & Copyright */}
        <div className="pt-8 flex flex-col lg:flex-row items-center justify-between gap-6" style={{ width: '100%' }}>
          
          {/* Trust and Payment Security Badges */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <div className="px-2.5 py-1 bg-white/5 border border-white/15 hover:border-indigo-500/30 rounded text-[9px] font-bold text-zinc-400 tracking-wider transition-all duration-300">
              QRIS
            </div>
            <div className="px-2.5 py-1 bg-white/5 border border-white/15 hover:border-indigo-500/30 rounded text-[9px] font-bold text-zinc-400 tracking-wider transition-all duration-300">
              GPN
            </div>
            <div className="px-2.5 py-1 bg-white/5 border border-white/15 hover:border-indigo-500/30 rounded text-[9px] font-bold text-zinc-400 tracking-wider transition-all duration-300">
              DEBIT / KREDIT
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/15 hover:border-indigo-500/30 rounded text-[9px] font-bold text-indigo-400 tracking-wider transition-all duration-300">
              <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>256-BIT SSL SECURED</span>
            </div>
            <div className="px-2.5 py-1 bg-white/5 border border-white/15 hover:border-indigo-500/30 rounded text-[9px] font-bold text-zinc-400 tracking-wider transition-all duration-300">
              PCI DSS COMPLIANT
            </div>
          </div>

          {/* Right Side: Social Medias & Copyright */}
          <div className="flex flex-col items-center lg:items-end gap-3">
            <div className="flex gap-3">
              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram SentraKas"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white text-zinc-400 hover:text-black border border-white/10 hover:border-white flex items-center justify-center transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051c-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a3.838 3.838 0 110-7.676A3.838 3.838 0 0112 16zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              {/* Twitter/X */}
              <a
                href="#"
                aria-label="Twitter X SentraKas"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white text-zinc-400 hover:text-black border border-white/10 hover:border-white flex items-center justify-center transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn SentraKas"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white text-zinc-400 hover:text-black border border-white/10 hover:border-white flex items-center justify-center transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
            <p className="text-zinc-500 text-xs">
              © {new Date().getFullYear()} SentraKas POS. Hak Cipta Dilindungi.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};
