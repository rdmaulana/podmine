# PODMINE
> Open Source AI Podcast Generation Platform

![License](https://img.shields.io/badge/license-MIT-blue)
![Bun](https://img.shields.io/badge/runtime-Bun-black)
![NestJS](https://img.shields.io/badge/framework-NestJS-red)
![Open Source](https://img.shields.io/badge/Open%20Source-❤️-green)

---

# Vision

PODMINE adalah platform open-source untuk membangun aplikasi AI Podcast modern.

Tujuan utama PODMINE **bukan menjadi AI provider**, melainkan menjadi backend platform yang mengorkestrasi berbagai AI Provider sehingga developer dapat membangun aplikasi podcast berbasis AI tanpa terikat pada vendor tertentu.

PODMINE berfokus pada:

- AI Orchestration
- Podcast Generation
- Audio Processing
- Streaming
- Content Management
- Provider Agnostic Architecture

---

# Philosophy

> Bring Your Own AI.

Developer bebas menggunakan provider AI favoritnya.

PODMINE tidak menyediakan API Key.

Developer cukup mengisi konfigurasi provider yang dimiliki.

Contoh:

- Gemini
- OpenAI
- Anthropic
- Ollama
- OpenRouter
- Groq
- ElevenLabs
- Piper
- Kokoro

Semua dapat digunakan tanpa mengubah business logic.

---

# Goals

Project ini dibuat sebagai showcase production-ready backend menggunakan modern TypeScript ecosystem.

Fokus pembelajaran:

- Bun Runtime
- NestJS
- Clean Architecture
- Modular Design
- Queue
- Object Storage
- Streaming
- AI Integration
- Docker
- OpenAPI
- Open Source Architecture

---

# Core Features

## Authentication

- Register
- Login
- Refresh Token
- JWT Authentication

---

## AI Podcast Generation

Generate podcast dari prompt.

Contoh

```
"Buat podcast berdurasi 3 menit tentang Bun vs Node.js."
```

Flow

```
Prompt

↓

Script Generation

↓

Text To Speech

↓

Audio Processing

↓

Upload Storage

↓

Ready
```

---

## AI Script Generation

Provider dapat dipilih melalui konfigurasi.

Contoh

- Gemini
- OpenAI
- Anthropic
- Ollama
- OpenRouter

---

## AI Text To Speech

Provider juga dapat dipilih.

Contoh

- ElevenLabs
- Piper
- Kokoro
- Azure Speech

---

## Background Processing

Semua proses AI berjalan secara asynchronous.

```
API

↓

Redis Queue

↓

Worker

↓

Generate

↓

Upload

↓

Completed
```

---

## Podcast Library

- List Podcast
- Pagination
- Search
- Filter
- Delete

---

## Audio Streaming

Support

- HTTP Range Request
- Resume
- Seek

Endpoint

```
GET /podcasts/:id/stream
```

---

## Download

```
GET /podcasts/:id/download
```

---

## Job Tracking

```
QUEUED

PROCESSING

COMPLETED

FAILED
```

---

# Architecture

```
                        Client

                          │

                     REST API

                          │

                  Bun + NestJS

                          │

        ┌─────────────────┼─────────────────┐

        │                 │                 │

      MySQL            Redis           Swagger

        │                 │

        └─────────────────┘

                 BullMQ Worker

                        │

         ┌──────────────┴──────────────┐

         │                             │

    LLM Provider                 TTS Provider

         │                             │

         └──────────────┬──────────────┘

                        │

                   FFmpeg Service

                        │

                Cloudflare R2

                        │

          Stream / Download API
```

---

# Provider Agnostic

Semua provider menggunakan abstraction layer.

Business logic tidak boleh bergantung pada vendor tertentu.

```
PodcastService

↓

LLMProvider

↓

GeminiProvider
```

atau

```
PodcastService

↓

LLMProvider

↓

OpenAIProvider
```

Tanpa perubahan business logic.

Hal yang sama berlaku untuk TTS dan Storage.

---

# Driver Architecture

Menggunakan konsep Driver seperti Laravel.

```
AI_SCRIPT_DRIVER

↓

GeminiDriver
```

```
AI_TTS_DRIVER

↓

ElevenLabsDriver
```

```
STORAGE_DRIVER

↓

CloudflareR2Driver
```

Semua driver dapat diganti melalui environment variable.

---

# Configuration

Contoh

```env
AI_SCRIPT_DRIVER=gemini

AI_TTS_DRIVER=elevenlabs

STORAGE_DRIVER=r2

QUEUE_DRIVER=redis

DATABASE_DRIVER=mysql

AUTH_DRIVER=jwt
```

API Key

```env
GEMINI_API_KEY=

OPENAI_API_KEY=

ELEVENLABS_API_KEY=
```

Jika menggunakan Ollama

```env
AI_SCRIPT_DRIVER=ollama

OLLAMA_HOST=http://localhost:11434
```

---

# Storage

Menggunakan Cloudflare R2.

Alasan:

- S3 Compatible
- Free Tier
- Zero Egress Fee
- Cocok untuk media streaming

Bucket bersifat private.

Audio diakses melalui Signed URL.

Flow

```
Client

↓

JWT Validation

↓

Authorization

↓

Generate Signed URL

↓

Cloudflare R2
```

---

# Supported Providers

## LLM

| Provider | Status |
|----------|--------|
| Gemini | ✅ |
| OpenAI | ⏳ |
| Anthropic | ⏳ |
| OpenRouter | ⏳ |
| Ollama | ⏳ |
| Groq | ⏳ |

---

## Text To Speech

| Provider | Status |
|----------|--------|
| ElevenLabs | ✅ |
| Piper | ⏳ |
| Kokoro | ⏳ |
| Azure Speech | ⏳ |

---

## Storage

| Provider | Status |
|----------|--------|
| Cloudflare R2 | ✅ |
| Amazon S3 | ⏳ |
| Google Cloud Storage | ⏳ |

---

## Database

| Database | Status |
|----------|--------|
| MySQL | ✅ |
| PostgreSQL | ⏳ |

---

# Tech Stack

## Backend

- Bun
- NestJS
- TypeScript

---

## Database

- MySQL

---

## Cache

- Redis

---

## Queue

- BullMQ

---

## Storage

- Cloudflare R2

---

## Authentication

- JWT
- Refresh Token
- bcrypt

---

## Documentation

- Swagger / OpenAPI

---

## Audio

- FFmpeg

---

## Container

- Docker Compose

---

# Monorepo

```
podmine/

apps/
├── api/
├── web/
└── worker/

packages/
├── sdk/
├── ui/
├── types/
└── config/

docs/

docker/
```

---

# Future Roadmap

## V1

- Authentication
- Podcast Generation
- Streaming
- Download
- Queue
- Cloudflare R2
- Swagger

---

## V2

- Podcast Cover AI
- Listening History
- Continue Listening
- Playlist
- Favorite
- Analytics
- Public Share

---

## V3

- Multiple Voice
- AI Conversation Podcast
- Multi Speaker
- Background Music
- Chapters
- AI Summary

---

## V4

- HLS Streaming
- CDN Support
- Subscription
- Billing
- Creator Dashboard
- Team Workspace

---

# Open Source Principles

PODMINE dibangun dengan prinsip:

- Provider Agnostic
- Modular
- Extensible
- Clean Architecture
- Community Driven

Menambahkan provider baru seharusnya cukup dengan membuat Driver baru tanpa mengubah business logic.

---

# Target Users

- Indie Hackers
- AI Developers
- Podcast Creators
- Startup
- SaaS Builder
- Learning Project
- Backend Engineers

---

# Why PODMINE?

Banyak project AI hanya menunjukkan cara memanggil API.

PODMINE bertujuan menunjukkan bagaimana membangun **backend production-ready** untuk aplikasi audio modern dengan arsitektur yang modular, scalable, dan mudah diperluas.

Dengan pendekatan "Bring Your Own AI", developer memiliki kebebasan penuh untuk memilih provider AI, storage, dan layanan pendukung lainnya sesuai kebutuhan tanpa terikat pada satu vendor.
