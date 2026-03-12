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

# Build — IMPORTANT: compile the Python backend first (see below), then run:
npm run build:win           # Windows installer
npm run build:mac           # macOS app
npm run build:linux         # Linux AppImage + deb
```

## Versioning

**Always increment the patch version in `axolotlmeasurement/package.json` before running any build.** This makes it easy to verify which version is installed.

- The version field is at the top of `package.json`: `"version": "1.0.x"`
- Increment the patch number (last digit) by 1 each build: 1.0.0 → 1.0.1 → 1.0.2, etc.
- The version appears in the installer filename (`axolotlmeasurement-1.0.x-setup.exe`) and in the Windows Add/Remove Programs entry, so the user can always confirm which build is installed.

### Building the Python backend (required before any Electron build)

The FastAPI server must be compiled to `resources/axolotl-server/axolotl-server.exe` via PyInstaller **before** running `npm run build:*`. This file is gitignored and must be produced locally. Run this whenever `main.py` or `kp_est_01_results.py` change:

```bash
# From the axolotlmeasurement directory
src/backend/venv/Scripts/pip install pyinstaller
src/backend/venv/Scripts/pyinstaller --onedir --name axolotl-server --distpath build/backend-dist --noconfirm src/backend/main.py
robocopy build\backend-dist\axolotl-server resources\axolotl-server /E /NP
```

Use `--onedir` (not `--onefile`). The `--onefile` approach bundles everything into a single self-extracting exe that must decompress ~500MB of ML libraries to a temp folder on every launch — this routinely exceeds Electron's 30-second backend startup timeout, causing the backend to silently fail. `--onedir` pre-extracts everything so startup is near-instant.

Build to `build/backend-dist/` first, then use `robocopy` to merge into `resources/axolotl-server/` — this preserves the `models/` subfolder that PyInstaller would otherwise delete.

Place bundled `.pt` model files in `resources/axolotl-server/models/` before running the Electron build.

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

**Critical — model path resolution**: The `spawn()` call in `src/main/index.ts` sets `cwd` to the `axolotl-server/` directory so the backend's working directory is correct. `main.py` uses `get_base_dir()` (which checks `sys.frozen` / `sys.executable`) to resolve the `models/` folder relative to the exe, not the process CWD. Both must stay consistent — never use `os.path.abspath(".")` or relative paths for model lookups in the backend.

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
