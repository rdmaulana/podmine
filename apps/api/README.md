# @podmine/api 🚀

The NestJS REST API Gateway for the **PODMINE** Monorepo platform.

## ⚡ Core Responsibilities

* **Authentication & Security**: Manages user registration, login, password encryption via bcrypt, and issuing JWT access/refresh tokens.
* **API Entrypoint**: Provides structured routes with the `/api/v1/` prefix for both public and authenticated interfaces.
* **HTTP 206 Media Range Streaming**: The `/stream` endpoint supports byte range requests to stream audio asynchronously and smoothly in HTML5 media players.
* **Optional Authorization**: Utilizes `OptionalJwtAuthGuard` to separate public feeds from personal dashboards (My Podcasts) transparently.
* **Swagger Documentation**: Integrates automatic OpenAPI documentation hosted at `/docs`.

## 📂 Structure

* `src/auth/`: Registration, login, current user decorator (`@CurrentUser`), and JWT authentication filters (`JwtAuthGuard` & `OptionalJwtAuthGuard`).
* `src/podcast/`: Controller (`PodcastController`), validation DTOs for query parameters, and data retrieval/streaming services.
* `src/common/`: Global interceptors to standardize API response payloads into `snake_case`.

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
