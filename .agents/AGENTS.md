# PODMINE Development Rules & Guidelines

Daftar aturan dan pedoman pengembangan untuk memastikan codebase tetap **Clean**, **DRY (Don't Repeat Yourself)**, dan konsisten.

---

## 1. Project Architecture & Monorepo

* **Structure**: Menggunakan Bun Workspaces.
  * `apps/api`: Aplikasi NestJS utama penyedia REST API.
  * `apps/worker`: Aplikasi background worker untuk pemrosesan BullMQ.
  * `packages/types`: Tempat definisi type/interface TypeScript global.
  * `packages/config`: Modul validasi environment variable terpusat.
  * `packages/database`: Modul Prisma database client terpusat.
  * `packages/drivers`: Tempat implementasi driver (LLM, TTS, Storage) secara modular.

* **Clean Architecture**:
  * Pisahkan dengan tegas antara business logic (Domain/Use Cases) dengan external framework/drivers (Infrastructure).
  * Layer aplikasi (Use Cases) tidak boleh mengimpor langsung driver eksternal atau dependensi framework selain interfaces/ports yang didefinisikan.

---

## 2. Database Guidelines

* **Table Names**: Semua nama tabel di database wajib menggunakan format **lowercase snake_case** (singular) dan dipetakan menggunakan `@@map("table_name")` pada skema Prisma.
* **Column Names**: Semua nama kolom di database wajib menggunakan format **lowercase snake_case** dan dipetakan menggunakan `@map("column_name")` pada skema Prisma, sehingga variabel di TypeScript tetap menggunakan camelCase.

---

## 3. API Guidelines

* **Versioning**: Seluruh endpoint REST API wajib menggunakan prefix `/api/v1/` (contoh: `/api/v1/auth/login`, `/api/v1/podcasts/generate`).
* **HTTP Standards**:
  * Gunakan standard HTTP status codes yang sesuai (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).
  * Response body harus konsisten strukturnya.
* **Response Formatting**: Seluruh response JSON API wajib dikonversi otomatis ke format **snake_case** menggunakan Interceptor global (`SnakeCaseInterceptor`) di layer presentasi.
* **OpenAPI**: Wajib mendokumentasikan setiap route baru menggunakan decorators `@nestjs/swagger` agar sinkron dengan Swagger UI `/docs`.

---

## 4. Code Standards & TypeScript

* **Type Safety**:
  * Hindari penggunaan tipe `any`. Selalu definisikan tipe/interface atau biarkan TypeScript menginferensinya.
  * Gunakan strict mode di `tsconfig.json`.
* **DRY & Reusability**:
  * Abstraksi fungsionalitas yang dipakai di banyak modul (seperti integrasi API luar) menjadi Driver di bawah `packages/drivers` dengan Interface/Abstract class yang jelas.
* **Error Handling**:
  * Selalu tangkap error pada operasi async/I/O (database, external API, file system) dan gunakan custom exception yang informatif.
  * Jangan menelan error tanpa logging (`console.error` or Logger NestJS).
