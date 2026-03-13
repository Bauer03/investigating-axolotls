### Running InvestigatingAxolotls locally

Before getting started:

Ensure you have python installed on your computer.
To check, run python --version (or python3 --version). If you have either installed, you'll get the version number.

Next, you need a model. Place your .pt model file(s) into `src/backend/models/`. You can have multiple models — the app lets you switch between them.
Now, we can run the app locally.

## Virtual Environment setup (allows local installation of python packages)

This only needs to be done once. If you have a venv folder in src/backend, move on to 'Starting app'.

1) Open a terminal, and navigate to src/backend

2) Create a virtual environment by running python -m venv venv (or python3 -m venv venv if you're using python3)
  This creates a virtual environment named 'venv'
  After you've run this for the fisrt time, as long as the venv folder is there, you don't need to run this command again.

3) Go back to the axolotlmeasurement directory. (running cd ../.. should take you there)

## Starting app: (Assuming you have the venv set up, according to above instructions)

1) Make sure you're in the axolotlmeasurement directory
2) Check your src/backend folder. If you have a venv folder, proceed. Otherwise, refer to above, then come back to step 3.
3) Run npm run start-backend (windows) or start-backend-mac (...mac), depending on OS. This will launch the FastAPI python server.
KEEP THIS TERMINAL TAB OPEN UNTIL YOU WANT TO SHUT DOWN THE PROGRAM

4) Open A SEPARATE terminal tab, and navigate to the axolotlmeasurement directory.
5) Run npm install
6) Run npm start. This will start the electron application (including main/renderer electron processes).
KEEP THIS TERMINAL TAB OPEN UNTIL YOU WANT TO SHUT DOWN THE PROGRAM

## Building a distributable Windows installer

This packages the app into a standalone `.exe` installer that can be installed on any Windows machine without needing Node, Python, or a dev environment.

The production backend uses an **embedded Python runtime** — a self-contained Python installation bundled inside the app. This avoids the DLL initialization issues that PyInstaller's frozen mode causes with PyTorch on Windows.

### Step 1 — Set up the embedded Python runtime (first time only)

Run this once from the `axolotlmeasurement` directory, or again whenever `requirements.txt` changes:

```
powershell -ExecutionPolicy Bypass -File setup-python-runtime.ps1
```

This script:
- Downloads the official Python 3.12 embeddable package from python.org
- Installs pip into it
- Installs all packages from `src/backend/requirements.txt`
- Places everything in `resources/python-runtime/`

This folder is gitignored (it's large). Any developer or CI environment needs to run this script once before building.

### Step 2 — Place model files

Place any `.pt` model files you want bundled into `resources/python-backend/models/`. These will be included in the installer. (`6kp.pt` and `best.pt` are already there.)

Note: model files are gitignored (`*.pt` in `.gitignore`), so they must be added manually to this folder on each machine.

### Step 3 — Build the Electron app

Make sure you are in the `axolotlmeasurement` directory and `npm install` has been run at least once.

```
npm run build:win
```

This will:
1. Type-check the TypeScript source
2. Compile the Electron main/preload/renderer bundles
3. Copy `resources/python-runtime/` (embedded Python), `resources/python-backend/` (models), and `src/backend/main.py` + `src/backend/kp_est_01_results.py` (backend scripts) into the app package
4. Package everything into `dist/axolotlmeasurement-x.x.x-setup.exe` (one-click NSIS installer)
5. Also produce `dist/InvestigatingAxolotls-x.x.x-win.zip` (portable zip, no installation needed)

Always increment the patch version in `package.json` before building so you can verify which version is installed.

Note: Windows SmartScreen may warn on first run because the executable is not code-signed. Click "More info → Run anyway" to proceed. This is expected when building without a code-signing certificate.

### How the production backend works

In production, Electron spawns:
```
resources/python-runtime/python.exe resources/python-backend/main.py
```
with `cwd` set to `resources/python-backend/`. The backend's `get_base_dir()` function returns that directory, so it finds models at `resources/python-backend/models/`. The backend log (useful for diagnosing startup failures) is written to:
```
%APPDATA%\axolotlmeasurement\backend.log
```
