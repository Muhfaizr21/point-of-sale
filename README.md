<div align="center">
  <img src="frontend/src/assets/Sentrakas.png" alt="Sentrakas Logo" width="200" />
</div>

# 🛒 Point of Sale (POS) System

Sistem Point of Sale (Kasir) modern yang dibangun menggunakan arsitektur **Clean Code** dengan pemisahan tanggung jawab (*Separation of Concerns*) yang teratur. Terinspirasi dari pola desain arsitektur Laravel dan dikombinasikan dengan performa tangguh Golang di backend serta kedinamisan React.js di frontend.

---

## 🚀 Tech Stack

### Backend
- **Language**: Go (Golang 1.26+)
- **Router**: Standard Library `net/http` (Modern Pattern Matching)
- **Database ORM**: GORM
- **Database Driver**: PostgreSQL
- **Environment Utility**: GoDotEnv

### Frontend
- **Framework**: React.js (v19)
- **Scaffolding Tool**: Vite
- **Development Language**: JavaScript (ES6+)
- **Linting**: ESLint

---

## 📂 Project Structure

```text
point-of-sale/
├── backend/                  # Golang REST API Service
│   ├── .env                  # Environment configurations
│   ├── go.mod                # Go module definitions
│   └── main.go               # Backend entrypoint
├── frontend/                 # React Vite Client
│   ├── public/               # Static public assets
│   ├── src/                  # React source files
│   ├── package.json          # Node dependencies & scripts
│   └── vite.config.js        # Vite configurations
└── README.md                 # Project documentation
```

---

## 🛠️ Setup & Installation

### Prasyarat
Pastikan Anda sudah menginstal:
- Go (versi 1.22 ke atas)
- Node.js (versi 18 ke atas) & npm
- PostgreSQL yang berjalan secara lokal/cloud

---

### 1. Konfigurasi Backend (Golang)

1. Masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Buat file `.env` (jika belum ada) dan sesuaikan kredensial PostgreSQL Anda:
   ```env
   DB_HOST=localhost
   DB_USER=muhfaiizr
   DB_PASSWORD=admin
   DB_NAME=pos
   DB_PORT=5432
   PORT=8081
   APP_ENV=development
   ```
3. Jalankan server backend:
   ```bash
   go run main.go
   ```
   Server akan berjalan di `http://localhost:8081`. Anda bisa mengakses endpoint pengecekan kesehatan database di `http://localhost:8081/api/health`.

---

### 2. Konfigurasi Frontend (React.js)

1. Masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Instal semua dependensi Node.js:
   ```bash
   npm install
   ```
3. Jalankan server development React:
   ```bash
   npm run dev
   ```
   Aplikasi frontend Anda sekarang berjalan dan siap diakses.

---

## 🧹 Arsitektur & Pola Desain (Clean Code)

Proyek ini mengikuti aturan arsitektur bersih yang terdokumentasi lengkap di file [skill.md](./skill.md), antara lain:
- **Service Layer Pattern**: Memisahkan logika bisnis dari HTTP controller/handler.
- **Repository Pattern**: Mengabstraksi interaksi database agar kode backend mudah diuji (*testable*).
- **Dependency Injection**: Memasukkan dependensi secara dinamis melalui constructor fungsi `New...`.
- **Validation Layer**: Penanganan validasi input user sebelum diproses oleh sistem.
- **Security Best Practices**: Proteksi terhadap SQL Injection, hashing password yang aman, penanganan CORS, serta sanitasi input.
