# CLAUDE.md

## Project Overview

Electron desktop app for analyzing and measuring axolotl images using machine learning. A Vue 3 + TypeScript frontend sends images to a Python FastAPI backend running a YOLOv8 model to detect anatomical keypoints and bounding boxes.

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Pinia, Vue Router, Vite
- **Desktop**: Electron 35, electron-vite, electron-builder
- **Backend**: Python 3, FastAPI, Uvicorn, Ultralytics (YOLOv8)
- **Storage**: JSON-based file storage (jsonStorage.ts)

## Project Structure

```
axolotlmeasurement/
├── src/
│   ├── backend/        # Python FastAPI server (main.py, ML model)
│   ├── main/           # Electron main process (index.ts, jsonStorage.ts)
│   ├── preload/        # Electron preload / IPC bridge
│   ├── renderer/src/   # Vue 3 app
│   │   ├── components/ # Reusable components (Header, KeypointDisplay)
│   │   ├── views/      # Page views (InputView, ValidateView, GalleryView)
│   │   ├── stores/     # Pinia stores (imageStore)
│   │   └── router/     # Vue Router config
│   └── types.ts        # Shared TypeScript interfaces
├── build/              # Build resources (icons, certificates)
└── resources/          # App resources
```

## Commands

```bash
# Install dependencies
npm install

# Run dev (start backend first, then Electron)
npm run start-backend       # Windows
npm run start-backend-mac   # macOS
npm run dev                 # Electron + Vue dev server

# Code quality
npm run format              # Prettier
npm run lint                # ESLint
npm run typecheck           # Both node and web
npm run typecheck:node      # Main/preload only
npm run typecheck:web       # Renderer only

# Build
npm run build:win           # Windows installer
npm run build:mac           # macOS app
npm run build:linux         # Linux AppImage + deb
```

## Code Style

- **Prettier**: single quotes, no semicolons, 100-char line width, no trailing commas, 2-space indent
- **ESLint**: electron-toolkit TypeScript config + Vue plugin, single-word component names allowed
- **Naming**: camelCase for functions/variables, PascalCase for components/interfaces
- **IPC channels**: prefixed by domain — `db:`, `fs:`, `debug:`, `models:`

## Key Patterns

- Type-safe IPC via `AxolotlAPI` interface in `src/types.ts`
- Debounced JSON storage saves (500ms) with atomic writes (temp file → rename)
- Lazy-loaded Vue route components
- Backend runs on `http://localhost:8001`
- ML model files placed in `src/backend/models/` (supports multiple, switchable via UI)

## Backend Setup

1. Python must be installed
2. Place YOLOv8 `.pt` model file(s) in `src/backend/models/`
3. Virtual environment created at `src/backend/venv/`
4. `npm run start-backend` activates venv and starts FastAPI server
5. App UI allows switching between available models via dropdown on Input page
