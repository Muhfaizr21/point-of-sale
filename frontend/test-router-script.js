import { matchRoutes } from 'react-router-dom';

const routes = [
  { path: '/' },
  { path: '/kasir' },
  { path: '/tentang' },
  { path: '/harga' },
  { path: '/kontak' },
  { path: '/login' },
  { path: '/produk' },
  { path: '/transaksi' },
  { path: '/dashboard' },
  { path: '/laporan' },
  { path: '/kategori' },
  { path: '/pengaturan' },
  { path: '*' }
];

const match = matchRoutes(routes, '/pengaturan');
console.log(match);
