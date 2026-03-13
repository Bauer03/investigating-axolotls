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

# Build — IMPORTANT: run setup-python-runtime.ps1 first (see below), then:
npm run build:win           # Windows installer
npm run build:mac           # macOS app
npm run build:linux         # Linux AppImage + deb
```

## Versioning

**Always increment the patch version in `axolotlmeasurement/package.json` before running any build.** This makes it easy to verify which version is installed.

- The version field is at the top of `package.json`: `"version": "1.0.x"`
- Increment the patch number (last digit) by 1 each build: 1.0.0 → 1.0.1 → 1.0.2, etc.
- The version appears in the installer filename (`axolotlmeasurement-1.0.x-setup.exe`) and in the Windows Add/Remove Programs entry, so the user can always confirm which build is installed.

### Building the Python backend (required before first build)

The backend uses an **embedded Python runtime** (no PyInstaller). The runtime lives at `resources/python-runtime/` and is created by a one-time setup script. It is gitignored and must be produced locally.

```powershell
# From the axolotlmeasurement directory — run ONCE, or when requirements.txt changes
powershell -ExecutionPolicy Bypass -File setup-python-runtime.ps1
```

This downloads Python 3.12 embeddable, installs pip, and installs all packages from `src/backend/requirements.txt` into `resources/python-runtime/`. After it completes, run the Electron build normally:

```bash
npm run build:win
```

`electron-builder` automatically copies:
- `resources/python-runtime/` → embedded Python exe + all packages
- `resources/python-backend/` → model files
- `src/backend/main.py` and `src/backend/kp_est_01_results.py` → backend scripts

Place `.pt` model files in `resources/python-backend/models/` before building.

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
- **Production**: Electron spawns `resources/python-runtime/python.exe resources/python-backend/main.py` with `cwd` set to `resources/python-backend/`. `main.py`'s `get_base_dir()` returns `os.path.dirname(os.path.abspath(__file__))` = `python-backend/`, so models resolve to `python-backend/models/`. Never use `os.path.abspath(".")` or relative paths for model lookups in the backend.

### Custom Protocol

The renderer loads local image files via a custom `axolotl-file://` protocol (registered in main) to avoid Electron's `file://` restrictions. Usage in templates: `<img src="axolotl-file:///C:/path/to/image.jpg" />`.

### 6-Keypoint Model

`kp_est_01_results.py` reads raw YOLOv8 keypoints at indices: `[0]=Tail, [1]=Head, [2]=midU, [3]=midL, [4]=leg1, [5]=leg2`. The two leg points are collapsed into a single `legs_midpoint`. The 5 display keypoints are `[Head, midU, midL, legs_midpoint, Tail]` and measurements (SVL proxy) are pixel distances between consecutive points.

## Key Patterns

- Type-safe IPC via `AxolotlAPI` interface in `src/types.ts`
- Debounced JSON storage saves (500ms) with atomic writes (temp file → rename)
- Lazy-loaded Vue routes (except `InputView` which is eagerly loaded)
- Backend runs on `http://localhost:8001`
- ML model files placed in `resources/python-backend/models/` for production, `src/backend/models/` for dev
- Renderer can import types directly from `src/types` (configured in tsconfig); use `@renderer` alias for `src/renderer/src/`
- To avoid Vue reactive proxy issues when sending data over IPC, serialize with `JSON.parse(JSON.stringify(data))` before calling `window.api`

## Backend Setup

### Dev
1. Python must be installed
2. Create a venv: `cd src/backend && python -m venv venv`
3. Place `.pt` model file(s) in `src/backend/models/`
4. `npm run start-backend` activates the venv and starts the FastAPI server
5. App UI allows switching between models via dropdown on Input page

### Production build
1. Run `powershell -ExecutionPolicy Bypass -File setup-python-runtime.ps1` once (or after `requirements.txt` changes) — creates `resources/python-runtime/`
2. Place `.pt` model file(s) in `resources/python-backend/models/`
3. Run `npm run build:win`

**Why not PyInstaller?** PyTorch's DLL initialization (WinError 1114) is fundamentally broken in PyInstaller frozen mode on Windows — torch's `_load_dll_libraries()` calls `LoadLibraryExW` with restricted flags, and several core DLLs (c10.dll, torch_cpu.dll) fail to initialize in that context regardless of PATH or AddDllDirectory workarounds. The embedded Python approach runs Python normally (unfrozen), so torch DLL loading works exactly as in dev.
