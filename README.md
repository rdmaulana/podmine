# PODMINE 🎙️
> Open Source AI Podcast Generation Platform built with a clean, driver-based Monorepo architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Runtime-Bun-black?logo=bun)](https://bun.sh/)
[![NestJS](https://img.shields.io/badge/Framework-NestJS-red?logo=nestjs)](https://nestjs.com/)
[![Docker](https://img.shields.io/badge/Container-Docker-blue?logo=docker)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)

PODMINE is a modern, open-source backend platform designed for building AI-powered podcast generator applications. Following the **"Bring Your Own AI"** philosophy (Provider Agnostic), this platform abstracts integrations with AI providers (LLM, TTS, Storage) so that developers can switch models or providers at any time through simple `.env` configurations without modifying any core business logic.

---

## 📐 Architecture & Flow

PODMINE implements **Clean Architecture** patterns, strictly separating core business use cases from external infrastructure drivers.

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

The monorepo is managed using **Bun Workspaces** for fast dependency installation and workspace orchestration.

```
podmine/
├── apps/
│   ├── api/             # NestJS REST API Gateway (Auth, Routes, Media Streaming)
│   └── worker/          # BullMQ background worker (AI Processing Pipeline Orchestrator)
├── packages/
│   ├── config/          # Centralized configuration schema & validation via Zod
│   ├── database/        # Shared Prisma schema, migrations, and DB client singleton
│   ├── drivers/         # Extensible driver manager (Gemini, ElevenLabs, Cloudflare R2)
│   └── types/           # Shared TypeScript interfaces & declarations
├── docker-compose.yml   # Local environment services (MySQL & Redis)
└── package.json         # Workspace root package definition
```

---

## ⚡ Core Features

* **JWT Authentication**: Secure user registration, login, and refresh token rotation.
* **Driver-Based AI Integration**:
  * **LLM**: Structured podcast script generation using Gemini (`gemini-2.0-flash`).
  * **TTS**: High-quality natural voice synthesis via ElevenLabs API.
  * **Storage**: Secure media upload and download link generation via Cloudflare R2 (S3 compatible).
* **HTTP Range Requests**: The `/api/v1/podcasts/:id/stream` endpoint supports chunk-by-chunk asynchronous audio streaming with `206 Partial Content` status.
* **BullMQ Queue Management**: Offloads intensive AI generations to isolated worker nodes, keeping the REST API responsive.

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your machine:
* [Bun Runtime](https://bun.sh/) (v1.x or later)
* [Docker Desktop](https://www.docker.com/) or [OrbStack](https://orbstack.dev/)
* API credentials for your chosen providers:
  * Google AI Studio (Gemini API Key)
  * ElevenLabs (API Key)
  * Cloudflare R2 (Bucket Name, Access Key ID, Secret Access Key, Endpoint)

---

### 🛠️ Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/podmine.git
   cd podmine
   ```

2. **Install Dependencies**:
   Bun will automatically resolve workspaces and link packages:
   ```bash
   bun install
   ```

3. **Start Local Services (Docker)**:
   Launch the MySQL and Redis containers in the background:
   ```bash
   docker compose up -d
   ```
   * *Note: Redis runs on port `6380` to avoid conflicts with any local Redis instance on your machine.*

4. **Environment Setup**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in your provider credentials in the newly created `.env` file:
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
   Sync the Prisma schema to your local MySQL database:
   ```bash
   DATABASE_URL="mysql://root:root@localhost:3306/podmine" bun --cwd packages/database prisma migrate dev --name init
   ```

---

## 🏃 Running the Application

Start the API Gateway and Background Worker side-by-side:

* **Running the API Gateway (apps/api)**:
  ```bash
  bun dev:api
  ```
  * The API will be available at: `http://localhost:3000/api/v1`
  * Interactive Swagger UI documentation is hosted at: `http://localhost:3000/docs`

* **Running the Background Worker (apps/worker)**:
  ```bash
  bun dev:worker
  ```

---

## 📡 API Endpoints

### 🔐 Auth Module
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register a new user | No |
| `POST` | `/api/v1/auth/login` | Log in and receive tokens | No |
| `POST` | `/api/v1/auth/refresh` | Refresh an expired access token | No |

### 🎙️ Podcast Module
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/podcasts/generate` | Queue a new AI podcast generation task | Yes |
| `GET` | `/api/v1/podcasts` | List all podcasts owned by the user | Yes |
| `GET` | `/api/v1/podcasts/:id` | Check podcast generation logs & status | Yes |
| `GET` | `/api/v1/podcasts/:id/download` | Redirect to Cloudflare R2 presigned download URL | Yes |
| `GET` | `/api/v1/podcasts/:id/stream` | Stream audio supporting HTTP Range Requests | Yes* |

> \* *The `/stream` endpoint accepts token validation from either the header `Authorization: Bearer <token>` or the query parameter `?token=<token>` to easily support native HTML5 `<audio>` players.*

---

## 🔌 Extensibility: Adding a New Driver

PODMINE is designed with a pluggable driver layer. Adding a new driver (e.g. an OpenAI LLM driver) is extremely simple:

1. **Define the Interface** (if new) in `packages/types`.
2. **Create the Driver Class** in `packages/drivers/src/llm/openai.driver.ts` implementing the `LLMDriver` interface.
3. **Export the Driver** through the package entry point.
4. Add the driver type option to `packages/config` and conditionally initialize the class in the worker or API applications.

---

## 📜 License

This project is licensed under the **[MIT License](LICENSE)**.
