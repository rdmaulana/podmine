# @podmine/worker ⚙️

Asynchronous Background Worker for the **PODMINE** monorepo using NestJS, BullMQ, and integrated driver modules.

## ⚡ Core Responsibilities

* **BullMQ Job Consumer**: Consumes tasks from the asynchronous `podcast-generation` queue to offload heavy processing from the API Gateway.
* **AI Orchestration Pipeline**:
  1. Requests Gemini AI Studio to generate structured, dual-host dialogue scripts (Host A & Host B) returned as JSON.
  2. Sends dialogue text lines to local neural Piper TTS speech servers (Host A: Lessac voice / Host B: Joe voice).
  3. Receives linear raw audio segments in WAV format.
* **Byte-Level WAV Merger**:
  - Automatically parses input WAV files and dynamically locates the `'data'` subchunk (`64 61 74 61`) to locate audio payloads.
  - Strips metadata headers and joins raw PCM audio buffers.
  - Recalculates and updates the final combined `RIFF` and `data` size offsets in the main 44-byte WAV header for clean combined playbacks.
* **Cloudflare R2 Upload**: Uploads combined podcast audio files to R2 storage and updates job completion status logs in the MySQL database.

## 🏃 Commands

* **Local Development**:
  ```bash
  bun run dev
  ```
* **Production Build**:
  ```bash
  bun run build
  bun run start:prod
  ```
