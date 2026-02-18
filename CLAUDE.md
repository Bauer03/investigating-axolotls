# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electron desktop app for analyzing and measuring axolotl images using machine learning. A Vue 3 + TypeScript frontend sends images to a Python FastAPI backend running a YOLOv8 model to detect anatomical keypoints and bounding boxes.

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Pinia, Vue Router, Vite
- **Desktop**: Electron 35, electron-vite, electron-builder
- **Backend**: Python 3, FastAPI, Uvicorn, Ultralytics (YOLOv8)
- **Storage**: JSON-based file storage (`src/main/jsonStorage.ts`), persisted to Electron's `userData` directory

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

## Architecture

### Image Lifecycle

Images flow through three states tracked by `processed` and `verified` flags on `ImageFile`:

1. **Input** (`processed: false`) — user-selected files, stored in DB but not yet run through ML
2. **Validation** (`processed: true, verified: false`) — ML results available, user reviews keypoints
3. **Gallery** (`processed: true, verified: true`) — user-confirmed, exported with embedded PNG metadata

The Pinia store (`imageStore`) is the single source of truth in the renderer. All mutations update both the in-memory store and the JSON database atomically via `window.api`.

### IPC / API Layer

All renderer↔main communication goes through `window.api` (typed as `AxolotlAPI` in `src/types.ts`, exposed by `src/preload/index.ts`). Full channel list:

| Channel | Direction | Purpose |
|---|---|---|
| `file-upload-request` | renderer→main | Open file/folder dialog |
| `db:get-all-images` | renderer→main | Load all images from JSON DB |
| `db:add-image` | renderer→main | Add new image record |
| `db:delete-image` | renderer→main | Delete single image by path |
| `db:delete-images-where` | renderer→main | Bulk delete by `{processed?, verified?}` criteria |
| `db:update-image` | renderer→main | Partial update of an image record |
| `fs:readFile` | renderer→main | Read file as base64 |
| `fs:embed-png-metadata` | renderer→main | Embed tEXt chunks into PNG buffer |
| `process-images` | renderer→main | POST to FastAPI `/process-images` |
| `models:list` | renderer→main | GET FastAPI `/models` |
| `models:open-folder` | renderer→main | Open models folder in OS explorer |
| `download-all-images` | renderer→main | Save dialog + write PNG files to disk |
| `debug:dump-db` | renderer→main | Log DB contents to console |

### Backend: Dev vs Production

- **Dev**: Backend is started manually with `npm run start-backend`. The Electron main process does NOT auto-start it (`if (!is.dev)` guard in `src/main/index.ts`).
- **Production**: The Python backend is compiled to `axolotl-server.exe` via PyInstaller and bundled at `resources/axolotl-server/`. Electron auto-starts it at `app.whenReady()` and kills it on `before-quit`.

### Custom Protocol

The renderer loads local image files via a custom `axolotl-file://` protocol (registered in main) to avoid Electron's `file://` restrictions. Usage in templates: `<img src="axolotl-file:///C:/path/to/image.jpg" />`.

### 6-Keypoint Model

`kp_est_01_results.py` reads raw YOLOv8 keypoints at indices: `[0]=Tail, [1]=Head, [2]=midU, [3]=midL, [4]=leg1, [5]=leg2`. The two leg points are collapsed into a single `legs_midpoint`. The 5 display keypoints are `[Head, midU, midL, legs_midpoint, Tail]` and measurements (SVL proxy) are pixel distances between consecutive points.

## Key Patterns

- Type-safe IPC via `AxolotlAPI` interface in `src/types.ts`
- Debounced JSON storage saves (500ms) with atomic writes (temp file → rename)
- Lazy-loaded Vue routes (except `InputView` which is eagerly loaded)
- Backend runs on `http://localhost:8001`
- ML model files placed in `src/backend/models/` (supports multiple, switchable via UI)
- Renderer can import types directly from `src/types` (configured in tsconfig); use `@renderer` alias for `src/renderer/src/`
- To avoid Vue reactive proxy issues when sending data over IPC, serialize with `JSON.parse(JSON.stringify(data))` before calling `window.api`

## Backend Setup

1. Python must be installed
2. Place YOLOv8 `.pt` model file(s) in `src/backend/models/`
3. Virtual environment created at `src/backend/venv/`
4. `npm run start-backend` activates venv and starts FastAPI server
5. App UI allows switching between available models via dropdown on Input page
