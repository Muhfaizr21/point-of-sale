import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoSentrakas from '../../assets/Sentrakas.png';
import { PublicFooter } from './PublicFooter';

const channels = [
  { icon: 'chat', label: 'WhatsApp', detail: '+62 811-9999-8888', desc: 'Senin–Jumat, 08:00–20.00' },
  { icon: 'mail', label: 'Email', detail: 'support@sentrakas.co.id', desc: 'Respon maksimal 2 jam' },
  { icon: 'phone_in_talk', label: 'Telepon', detail: '(021) 3049-8888', desc: 'Senin–Jumat, 09:00–17.00' },
  { icon: 'live_help', label: 'Knowledge Base', detail: 'help.sentrakas.co.id', desc: 'Self-service 24/7' },
]

export const KontakPage = () => {
  useEffect(() => {
    document.title = 'Hubungi Kami - SentraKas POS';
    window.scrollTo(0, 0);
  }, []);

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotif(null);
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      // Import apiClient lazily or use fetch if apiClient isn't imported.
      // We will use standard fetch since this is a public page.
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Gagal mengirim pesan');
      
      setNotif({ type: 'success', msg: 'Pesan Anda telah terkirim. Tim kami akan menghubungi Anda dalam 1×24 jam.' });
      e.target.reset();
    } catch (err) {
      setNotif({ type: 'error', msg: 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setLoading(false);
      setTimeout(() => setNotif(null), 5000);
    }
  };

  return (
    <div className="antialiased min-h-screen overflow-x-hidden w-full h-screen overflow-y-auto relative" style={{ backgroundColor: '#000000', color: '#fafafa' }}>
      {/* Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1100px] bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-lg rounded-full z-50 hidden md:flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-4"><Link to="/"><img alt="SentraKas Logo" className="h-12 object-contain brightness-0 invert" src={logoSentrakas} /></Link></div>
        <div className="flex items-center gap-8">
          <Link className="text-zinc-400 hover:text-white transition-colors text-xs tracking-widest font-semibold" to="/">BERANDA</Link>
          <Link className="text-zinc-400 hover:text-white transition-colors text-xs tracking-widest font-semibold" to="/tentang">TENTANG</Link>
          <Link className="text-zinc-400 hover:text-white transition-colors text-xs tracking-widest font-semibold" to="/harga">HARGA</Link>
          <Link className="text-white font-bold text-xs tracking-widest" to="/kontak">KONTAK</Link>
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
          { to: '/', label: 'Beranda', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
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

      <main className="w-full max-w-[1200px] mx-auto px-6 md:px-12 py-24 md:py-32 flex flex-col gap-16 md:gap-24">
        {/* ===== HEADER ===== */}
        <section className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-5">
            <span className="material-symbols-outlined text-[16px]">headset_mic</span>
            Kami Siap Membantu
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-4">
            Ada yang Bisa Kami Bantu?
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Tim support teknis kami siap merespon dalam maksimal 2 jam. 
            Senin–Jumat, pukul 08.00–20.00 WIB.
          </p>
        </section>

        {/* ===== CHANNELS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
          {channels.map((ch, i) => (
            <div key={i} className="rounded-2xl p-5 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-1 transition-all duration-200 text-center" style={{ backgroundColor: '#0a0a0a' }}>
              <div className="w-10 h-10 rounded-xl bg-indigo-900/40 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-indigo-400 text-[22px]">{ch.icon}</span>
              </div>
              <h3 className="text-white font-bold text-sm mb-0.5">{ch.label}</h3>
              <p className="text-indigo-400 text-xs font-semibold">{ch.detail}</p>
              <p className="text-zinc-500 text-[10px] mt-1">{ch.desc}</p>
            </div>
          ))}
        </div>

        {/* ===== FORM + INFO ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-7 rounded-2xl p-6 md:p-8 border border-zinc-800" style={{ backgroundColor: '#0a0a0a' }}>
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]">edit_note</span>
              Kirim Pesan Langsung
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-1.5" htmlFor="name">Nama Lengkap</label>
                  <input id="name" name="name" type="text" required placeholder="Masukkan nama"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-1.5" htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" required placeholder="nama@perusahaan.com"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-1.5" htmlFor="subject">Kategori</label>
                <select id="subject" name="subject"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all">
                  <option value="sales">Pertanyaan Penjualan & Harga</option>
                  <option value="support">Dukungan Teknis</option>
                  <option value="billing">Tagihan & Pembayaran</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-1.5" htmlFor="message">Pesan</label>
                <textarea id="message" name="message" required placeholder="Jelaskan kebutuhan atau kendala Anda..."
                  rows={5} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">send</span>
                )}
                {loading ? 'Mengirim...' : 'Kirim Pesan'}
              </button>
            </form>
            {notif && (
              <div className={`mt-4 p-4 rounded-xl text-sm ${notif.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20'}`}>
                {notif.msg}
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            {/* Office */}
            <div className="rounded-2xl p-6 border border-zinc-800" style={{ backgroundColor: '#0a0a0a' }}>
              <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">location_on</span>
                Kantor Pusat
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Gedung Sentra Utama, Lantai 15<br />
                Jl. Jend. Sudirman Kav. 21<br />
                Jakarta Selatan 12920, Indonesia
              </p>
            </div>

            {/* Response time */}
            <div className="rounded-2xl p-6 border border-zinc-800" style={{ backgroundColor: '#0a0a0a' }}>
              <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">timer</span>
                Waktu Respon
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between"><span className="text-zinc-400">Email & Contact Form</span><span className="text-green-400 font-semibold">&lt; 2 jam</span></li>
                <li className="flex items-center justify-between"><span className="text-zinc-400">WhatsApp</span><span className="text-green-400 font-semibold">&lt; 30 menit</span></li>
                <li className="flex items-center justify-between"><span className="text-zinc-400">Telepon</span><span className="text-green-400 font-semibold">Langsung</span></li>
              </ul>
            </div>

            {/* Social */}
            <div className="rounded-2xl p-6 border border-zinc-800" style={{ backgroundColor: '#0a0a0a' }}>
              <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">share</span>
                Ikuti Kami
              </h3>
              <div className="flex gap-3">
                {[
                  { label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                  { label: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                  { label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                ].map((s, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-indigo-400 hover:border-indigo-700 transition-all" title={s.label}>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d={s.icon} /></svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== MAP ===== */}
        <div className="rounded-2xl overflow-hidden h-56 md:h-72 border border-zinc-800 relative group cursor-pointer">
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-zinc-600 text-[48px]">map</span>
              <p className="text-zinc-500 text-sm mt-2 font-medium">Gedung Sentra Utama, Jakarta Selatan</p>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-3 rounded-xl flex items-center justify-between shadow-lg">
            <span className="text-xs text-white font-bold">Lihat petunjuk arah di Google Maps</span>
            <span className="material-symbols-outlined text-white text-sm">open_in_new</span>
          </div>
        </div>

        {/* ===== BOTTOM CTA ===== */}
        <section className="rounded-3xl p-8 md:p-12 text-center border border-zinc-800" style={{ backgroundColor: '#0a0a0a' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-900/40 border border-indigo-700/50 rounded-full text-indigo-300 text-sm font-bold mb-4">
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            Mulai Sekarang
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">Belum Siap Chat?</h2>
          <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed mb-8">
            Anda bisa mencoba SentraKas secara gratis selama 14 hari tanpa kartu kredit. 
            Setup instan, langsung bisa transaksi dalam 5 menit.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/harga" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg">
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Mulai Trial Gratis
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-200 rounded-xl font-bold hover:bg-zinc-800 transition-all">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali ke Beranda
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
