# PODMINE 🎙️
> Open Source AI Podcast Generation Platform built with a clean, driver-based Monorepo architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Runtime-Bun-black?logo=bun)](https://bun.sh/)
[![NestJS](https://img.shields.io/badge/Framework-NestJS-red?logo=nestjs)](https://nestjs.com/)
[![Docker](https://img.shields.io/badge/Container-Docker-blue?logo=docker)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)

PODMINE adalah platform backend open-source modern untuk membangun aplikasi generator podcast berbasis AI. Dengan prinsip **"Bring Your Own AI"** (Provider Agnostic), platform ini mengabstraksikan integrasi penyedia AI (LLM, TTS, Storage) sehingga developer dapat mengganti model atau provider kapan saja melalui file konfigurasi `.env` tanpa harus memodifikasi kode business logic.

---

## 📐 Architecture & Flow

PODMINE menggunakan **Clean Architecture** yang terbagi secara ketat antara domain bisnis dan implementasi infrastruktur eksternal.

```mermaid
graph TD
    Client[Client / Swagger UI] -->|REST API| API[API Gateway: apps/api]
    API -->|1. Create Record & Queue Job| DB[(MySQL: Prisma)]
    API -->|2. Push Task| Redis[(Redis: BullMQ)]
    
    subgraph Background Worker [apps/worker]
        Worker[Job Processor] <-->|3. Polls Jobs| Redis
        Worker -->|4. Request Script| LLM[LLM Driver: Gemini]
        Worker -->|5. Request Voice| TTS[TTS Driver: ElevenLabs]
        Worker -->|6. Upload MP3| ST[Storage Driver: Cloudflare R2]
        Worker -->|7. Update Status & Key| DB
    end

    Client -->|8. Request Stream / Download| API
    API -->|9. Generate Presigned URL| ST
    API -->|10. Stream Audio Chunk 206| Client
```

---

## 📂 Project Structure (Monorepo)

Monorepo ini dikelola menggunakan **Bun Workspaces** untuk performa instalasi dependensi yang maksimal.

```
podmine/
├── apps/
│   ├── api/             # NestJS REST API Gateway (Auth, Routes, Media Streaming)
│   └── worker/          # BullMQ background worker (Orkestrator AI Pipeline)
├── packages/
│   ├── config/          # Centralized configuration schema & validation via Zod
│   ├── database/        # Shared Prisma schema, migrations, and DB client singleton
│   ├── drivers/         # Extensible driver manager (Gemini, ElevenLabs, Cloudflare R2)
│   └── types/           # Shared TypeScript interfaces & declarations
├── docker-compose.yml   # Local environment setup (MySQL & Redis)
└── package.json         # Workspace root package definition
```

---

## ⚡ Core Features

* **JWT Authentication**: Pendaftaran pengguna, login, dan rotasi token refresh yang aman.
* **Driver-Based AI Integration**:
  * **LLM**: Pembuatan naskah podcast terstruktur menggunakan Gemini (`gemini-2.0-flash`).
  * **TTS**: Konversi teks naskah menjadi audio alami berkualitas tinggi menggunakan ElevenLabs API.
  * **Storage**: Upload media yang aman ke Cloudflare R2 (S3 compatible) dengan presigned URL.
* **HTTP Range Requests**: Endpoint `/api/v1/podcasts/:id/stream` mendukung streaming audio chunk-by-chunk secara asinkron dengan status `206 Partial Content`.
* **BullMQ Queue Management**: Semua proses kalkulasi AI berjalan di background worker untuk menghindari kelebihan beban pada server API utama.

---

## 🚀 Getting Started

### 📋 Prerequisites

Pastikan Anda sudah menginstal aplikasi berikut pada mesin lokal Anda:
* [Bun Runtime](https://bun.sh/) (v1.x atau lebih baru)
* [Docker Desktop](https://www.docker.com/) atau [OrbStack](https://orbstack.dev/)
* Akun penyedia AI & Storage:
  * Google AI Studio (Gemini API Key)
  * ElevenLabs (API Key)
  * Cloudflare R2 (Bucket Name, Access Key, Secret Key, Endpoint)

---

### 🛠️ Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/podmine.git
   cd podmine
   ```

2. **Install Dependencies**:
   Bun akan otomatis melacak workspaces dan memasang seluruh paket yang diperlukan:
   ```bash
   bun install
   ```

3. **Start Local Services (Docker)**:
   Nyalakan container MySQL dan Redis di latar belakang:
   ```bash
   docker compose up -d
   ```
   * *Catatan: Redis berjalan di port `6380` agar tidak bentrok dengan Redis lokal di sistem Anda.*

4. **Environment Setup**:
   Salin file template `.env` pada root direktori:
   ```bash
   cp .env.example .env
   ```
   Lalu sesuaikan konfigurasi sesuai dengan kunci kredensial Anda:
   ```env
   DATABASE_URL="mysql://root:root@localhost:3306/podmine"
   REDIS_HOST="localhost"
   REDIS_PORT=6380
   JWT_SECRET="podmine-super-secret-key-change-me"
   
   # AI Script Driver
   AI_SCRIPT_DRIVER="gemini"
   GEMINI_API_KEY="AIzaSy..."

   # AI TTS Driver
   AI_TTS_DRIVER="elevenlabs"
   ELEVENLABS_API_KEY="your-elevenlabs-key"
   ELEVENLABS_VOICE_ID="21m00Tcm4TlvDq8ikWAM" # Optional Voice ID (Rachel)

   # Storage Driver
   STORAGE_DRIVER="r2"
   R2_ACCESS_KEY_ID="your-r2-access-key-id"
   R2_SECRET_ACCESS_KEY="your-r2-secret-access"
   R2_BUCKET_NAME="podmine-bucket"
   R2_ENDPOINT="https://<your-account-id>.r2.cloudflarestorage.com"
   ```

5. **Run Database Migrations**:
   Sinkronisasikan skema Prisma ke database MySQL lokal:
   ```bash
   DATABASE_URL="mysql://root:root@localhost:3306/podmine" bun --cwd packages/database prisma migrate dev --name init
   ```

---

## 🏃 Running the Application

Jalankan API Gateway dan Background Worker secara paralel untuk memulai proses development:

* **Menjalankan API Gateway (apps/api)**:
  ```bash
  bun dev:api
  ```
  * API Gateway akan berjalan pada: `http://localhost:3000/api/v1`
  * Dokumentasi Swagger UI interaktif tersedia di: `http://localhost:3000/docs`

* **Menjalankan Background Worker (apps/worker)**:
  ```bash
  bun dev:worker
  ```

---

## 📡 API Endpoints

### 🔐 Auth Module
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Mendaftarkan pengguna baru | No |
| `POST` | `/api/v1/auth/login` | Login dan mengeluarkan token JWT | No |
| `POST` | `/api/v1/auth/refresh` | Memperbarui token akses kadaluarsa | No |

### 🎙️ Podcast Module
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/podcasts/generate` | Memicu generator podcast AI (antrean) | Yes |
| `GET` | `/api/v1/podcasts` | Mendapatkan seluruh daftar podcast milik pengguna | Yes |
| `GET` | `/api/v1/podcasts/:id` | Memeriksa detail status progres pekerjaan podcast | Yes |
| `GET` | `/api/v1/podcasts/:id/download` | Mengunduh file audio via redirect signed R2 URL | Yes |
| `GET` | `/api/v1/podcasts/:id/stream` | Streaming audio langsung (Range Request 206) | Yes* |

> \* *Endpoint `/stream` mendukung pengiriman token JWT lewat header `Authorization: Bearer <token>` maupun query parameter `?token=<token>` demi mendukung pemutaran langsung menggunakan tag `<audio>` bawaan browser.*

---

## 🔌 Extensibility: Adding a New Driver

Karena PODMINE menggunakan pendekatan modular, menambahkan driver baru (misalnya, penyedia LLM baru seperti OpenAI) dapat dilakukan dengan mudah tanpa merusak business logic utama:

1. **Definisikan Interface** (jika belum ada) di `packages/types`.
2. **Buat File Driver** di `packages/drivers/src/llm/openai.driver.ts` yang mengimplementasikan interface `LLMDriver`.
3. **Ekspos Driver** lewat file index paket driver.
4. Tambahkan validasi tipe driver pada `packages/config` dan inisialisasikan driver tersebut secara kondisional pada `apps/worker` atau `apps/api`.

---

## 📜 License

Project ini dilisensikan di bawah **[MIT License](LICENSE)**.
