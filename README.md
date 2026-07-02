# PODMINE 🎙️
> Open Source AI Podcast Generation Platform built with a clean, driver-based Monorepo architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Runtime-Bun-black?logo=bun)](https://bun.sh/)
[![NestJS](https://img.shields.io/badge/Framework-NestJS-red?logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Container-Docker-blue?logo=docker)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)

PODMINE is a modern, open-source platform designed for building AI-powered podcast generator applications. Following the **"Bring Your Own AI"** philosophy (Provider Agnostic), this platform abstracts integrations with AI providers (LLM, TTS, Storage) so that developers can switch models or providers (like local Piper TTS vs ElevenLabs) at any time through simple `.env` configurations without modifying any core business logic.

---

## 📐 Architecture & Flow

PODMINE implements **Clean Architecture** patterns, strictly separating core business use cases from external infrastructure drivers.

```mermaid
graph TD
    Client[React Frontend: apps/web] -->|1. REST API| API[API Gateway: apps/api]
    API -->|2. Create Record & Queue Job| DB[(MySQL: Prisma)]
    API -->|3. Push Task| Redis[(Redis: BullMQ)]
    
    subgraph Background Worker [apps/worker]
        Worker[Job Processor] <-->|4. Polls Jobs| Redis
        Worker -->|5. Request Script| LLM[LLM Driver: Gemini]
        Worker -->|6. Synth Host A| PiperA[Piper Host A: 5001]
        Worker -->|7. Synth Host B| PiperB[Piper Host B: 5002]
        Worker -->|8. WAV Dynamic Merger| WM[WAV byte-level merger]
        Worker -->|9. Upload Combined Audio| ST[Storage Driver: Cloudflare R2]
        Worker -->|10. Update Status & Key| DB
    end

    Client -->|11. Request Stream / Download| API
    API -->|12. Generate Presigned URL| ST
    API -->|13. Stream Audio Chunk 206| Client
```

---

## 📂 Project Structure (Monorepo)

The monorepo is managed using **Bun Workspaces** for fast dependency installation and workspace orchestration.

```
podmine/
├── apps/
│   ├── api/             # NestJS REST API Gateway (Auth, Public & Private Routes, Media Streaming)
│   ├── worker/          # BullMQ background worker (AI Pipeline, local WAV byte-level merger)
│   └── web/             # React + Vite + TanStack Query Frontend (Spotify-like dark-orange SPA UI)
├── packages/
│   ├── config/          # Centralized configuration schema & validation via Zod (safeguards envs)
│   ├── database/        # Shared Prisma schema, migrations, and DB client singleton
│   ├── drivers/         # Extensible driver manager (Gemini, Piper, ElevenLabs, Cloudflare R2)
│   └── types/           # Shared TypeScript interfaces & declarations
├── docker-compose.yml   # Multi-container local environment (MySQL, Redis, Piper TTS A & B, Nginx Web)
├── Dockerfile           # Multi-stage build for Node/NestJS backend apps
├── Dockerfile.web       # Multi-stage build for React Vite assets served via Nginx
└── package.json         # Workspace root package definition
```

---

## ⚡ Core Features

* **Dual-Host Dialogue Pipeline**: Structured script generation (Host A & Host B dialogue) powered by Gemini (`gemini-2.5-flash`).
* **Local Neural TTS (Piper)**: Dockerized local HTTP Piper speech synthesis (Lessac and Joe voices) running offline without API fees.
* **Dynamic WAV Header Merger**: Custom byte-level audio parser that merges headers, calculates combined size offsets, and outputs clean Linear PCM wave streams.
* **Public & Private API Boundaries**:
  * **Public**: Listing and streaming media endpoints are publicly accessible to support anonymous listeners.
  * **Private**: Generation is securely guarded by JWT auth.
* **Spotify-Style Web App**: Premium Dark-Orange React SPA featuring a persistent sticky audio player, full-screen playback expander, prompting form, and real-time generation trackers.

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your machine:
* [Bun Runtime](https://bun.sh/) (v1.x or later)
* [Docker Desktop](https://www.docker.com/) or [OrbStack](https://orbstack.dev/)
* Google AI Studio API Key (Gemini)
* Cloudflare R2 Credentials (S3-compatible)

---

### 🛠️ Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/podmine.git
   cd podmine
   ```

2. **Download Piper TTS Voice Models**:
   ```bash
   chmod +x download-models.sh
   ./download-models.sh
   ```

3. **Install Workspace Dependencies**:
   ```bash
   bun install
   ```

4. **Environment Setup**:
   Create a `.env` file at the root:
   ```env
   DATABASE_URL="mysql://root:root@localhost:3306/podmine"
   REDIS_HOST="localhost"
   REDIS_PORT=6380
   JWT_SECRET="podmine-super-secret-key-change-me"
   
   # AI Script Driver
   AI_SCRIPT_DRIVER="gemini"
   GEMINI_API_KEY="AIzaSy..."

   # AI TTS Driver
   AI_TTS_DRIVER="piper"
   PIPER_HOST_A_URL="http://localhost:5001"
   PIPER_HOST_B_URL="http://localhost:5002"

   # Storage Driver
   STORAGE_DRIVER="r2"
   R2_ACCESS_KEY_ID="your-r2-access-key-id"
   R2_SECRET_ACCESS_KEY="your-r2-secret-access"
   R2_BUCKET_NAME="podmine-bucket"
   R2_ENDPOINT="https://<your-account-id>.r2.cloudflarestorage.com"
   R2_PUBLIC_URL="https://cdn.podmine.xyz"
   ```

5. **Run DB Migrations**:
   ```bash
   bun db:migrate
   ```

---

## 🏃 Running the Application

### Local Development Mode
Start the development server for all services concurrently:
* Run MySQL, Redis, and Piper Speech services:
  ```bash
  docker compose up -d db redis piper-host-a piper-host-b
  ```
* Start backend and frontend apps locally:
  * API Gateway: `bun dev:api` (available at `http://localhost:3000`)
  * Background Worker: `bun dev:worker`
  * Frontend Web: `bun dev:web` (available at `http://localhost:5173`)

### Production Docker Compose Mode
Run the entire production deployment stack (including API, background workers, and Nginx frontend web server):
```bash
docker compose up --build -d
```
* **API Swagger Docs**: `http://localhost:3000/docs`
* **Frontend Dashboard**: `http://localhost:8081` (pillaged with Spotify dark/orange aesthetics)

---

## 📡 API Endpoints

### 🔐 Auth Module
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register a new user with Email | No |
| `POST` | `/api/v1/auth/login` | Log in and receive tokens | No |

### 🎙️ Podcast Module
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/podcasts/generate` | Queue a new AI podcast generation task | Yes |
| `GET` | `/api/v1/podcasts` | List podcasts (public feed or owner filtered) | No / Optional |
| `GET` | `/api/v1/podcasts/:id` | Check podcast generation logs & status | No |
| `GET` | `/api/v1/podcasts/:id/download` | Redirect to Cloudflare R2 download URL | No |
| `GET` | `/api/v1/podcasts/:id/stream` | Stream audio supporting HTTP Range Requests | No |

---

## 📜 License

This project is licensed under the **[MIT License](LICENSE)**.
