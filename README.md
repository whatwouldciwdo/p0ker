# 🃏 P0ker — Texas Hold'em Web Game

Game Texas Hold'em Poker multiplayer real-time berbasis web. Dibangun dengan arsitektur **Authoritative Server**, evaluasi kartu server-side dengan `pokersolver`, shuffle kriptografis CSPRNG, dan UI modern bercita rasa kasino.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

---

## ✨ Fitur Utama

- 🔒 **Authoritative Server & Anti-Cheat:** Semua logika kartu, pot, dan giliran dikontrol oleh server. Kartu hole lawan **disanitasi** sebelum dikirim ke client (tidak dapat di-inspect melalui browser DevTools).
- 🍪 **Autentikasi Aman:** Registrasi & Login dengan password hashing `bcrypt`. Sesi disimpan dalam **HTTP-only Cookie** (`sid`), otomatis expire 7 hari.
- 🎲 **Pengocokan Kriptografis:** Menggunakan Fisher-Yates dengan CSPRNG (`crypto.randomBytes`).
- ⏱️ **Turn Timer Server-Side:** Timer 30 detik otomatis auto-check/auto-fold jika pemain AFK/tidak merespon.
- 💰 **Kustomisasi Meja Dinamis:** Buat meja sendiri dengan custom Small Blind, Big Blind, Maksimal Pemain (2–9), dan Min Buy-In.
- 🎨 **Casino-Grade UI:** Desain meja oval felt hijau gelap, posisi kursi dinamis, cincin animasi countdown SVG, kartu realistis, dan Action Dock interaktif.
- 💬 **Live Table Chat:** Fitur kirim pesan langsung antar pemain di meja yang sama.
- 🌐 **Cloudflared Ready:** Konfigurasi proxy Vite memungkinkan akses publik hanya dengan 1 URL tunnel.

---

## 🏗️ Tech Stack

- **Monorepo:** npm workspaces (`packages/*`)
- **Frontend (`packages/client`):** React 19, Vite 8, Zustand, Socket.io-client, Axios, CSS3 Glassmorphism
- **Backend (`packages/server`):** Node.js, Express, Socket.io, `pokersolver`, `pg`, `bcryptjs`, TypeScript
- **Shared (`packages/shared`):** Kontrak tipe data TypeScript untuk Client dan Server
- **Database:** PostgreSQL (dengan fallback in-memory untuk dev instan)

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js v20+ atau v24+
- npm v10+

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/whatwouldciwdo/p0ker.git
cd p0ker
npm install
```

### 2. Konfigurasi Environment

Copy file `.env.example` di server:
```bash
cp packages/server/.env.example packages/server/.env
```

Isi konfigurasi database PostgreSQL:
```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/poker_db
COOKIE_SECRET=p0ker_super_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

*(Catatan: Jika database PostgreSQL belum aktif, server secara cerdas akan mengaktifkan in-memory fallback agar tetap bisa dimainkan tanpa setup database tambahan).*

### 3. Build & Run

Jalankan backend dan frontend secara bersamaan:
```bash
npm run dev
```

Atau jalankan terpisah:
- **Backend:** `npm run dev:server` (berjalan di port `3001`)
- **Frontend:** `npm run dev:client` (berjalan di port `5173`)

Buka browser di **`http://localhost:5173`**.

---

## 🌐 Akses Publik via Cloudflared Tunnel

Karena Vite sudah dikonfigurasi mem-proxy REST API (`/api`) dan WebSocket (`/socket.io`) ke server, Anda cukup membuka **1 tunnel** ke port frontend:

```bash
cloudflared tunnel --url http://localhost:5173
```

Buka dan bagikan URL HTTPS yang dihasilkan (contoh: `https://xxxx.trycloudflare.com`) ke teman Anda untuk bermain bersama secara online!

---

## 📜 Lisensi

MIT License © 2026
