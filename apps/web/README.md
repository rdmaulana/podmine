# @podmine/web 🎨

A premium Spotify-inspired (Dark & Orange theme) Single Page Application (SPA) dashboard for listening, searching, and generating AI podcasts on the **PODMINE** platform. Built with React, Vite, Bun, and TanStack Query.

## ⚡ Key Features

* **Spotify-Inspired Aesthetics**: Premium dark-mode layout with vibrant orange brand accents (`#FF5500`), subtle glassmorphism blur, responsive grid alignments, and smooth micro-animations.
* **Persistent Bottom Audio Player**: A sticky media player at the bottom that remains playing during page navigation, connected to audio streams asynchronously.
* **Fullscreen Expanded Player**: Toggles a full-screen playing overlay on mobile and desktop showing large album art, descriptive prompts, progress sliders, and large controls.
* **Authentication & Generation**: Email & password forms with validation. Podcast generation forms are securely restricted to authenticated users.
* **Automatic Progress Polling**: TanStack Query automatically polls task endpoints every 3 seconds to update progress bars for active `QUEUED` or `PROCESSING` jobs.

## 📐 Clean Architecture Directory

* `src/domain/`: TypeScript interfaces and model entities (Podcast, Job, User).
* `src/infrastructure/`: API Client (fetch wrapper with automatic JWT injection) and React Query custom hooks (`usePodcasts`, `useGeneratePodcast`, etc.).
* `src/presentation/`:
  * `styles/`: CSS layout grids, theme tokens, and custom styles.
  * `App.tsx`: Main entrypoint for rendering and UI state coordinates.

## 🚫 useEffect Ban Policy

To keep the UI clean, predictable, and performant:
* **Zero useEffect hooks are used**.
* Playback states and media timing are handled via native **Event Handlers** registered directly on the `<audio>` element.
* Loading, pending, and error states are synchronized using **TanStack Query status variables** (`isLoading`, `isPending`, `isSuccess`).
* Secondary computations are processed as **Derived States** during renders.

## 🏃 Commands

* **Local Development**:
  ```bash
  bun run dev
  ```
* **Production Build**:
  ```bash
  bun run build
  bun run preview
  ```
