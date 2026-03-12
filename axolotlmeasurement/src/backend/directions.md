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

### Step 1 — Compile the Python backend

The FastAPI backend must be compiled into a standalone executable using PyInstaller **before** running the Electron build. This step is required whenever `main.py` or `kp_est_01_results.py` have changed. The compiled exe is not tracked in git.

From the `axolotlmeasurement` directory:

```
src/backend/venv/Scripts/pip install pyinstaller
src/backend/venv/Scripts/pyinstaller --onedir --name axolotl-server --distpath build/backend-dist --noconfirm src/backend/main.py
robocopy build\backend-dist\axolotl-server resources\axolotl-server /E /NP
```

This builds to a temporary directory first, then merges the output into `resources/axolotl-server/` (preserving the `models/` folder). Electron expects the exe at `resources/axolotl-server/axolotl-server.exe`.

Note: `--onedir` is preferred over `--onefile`. With `--onefile`, PyInstaller must extract ~500MB of ML libraries to a temp folder on every launch, which can take longer than Electron's startup timeout and cause the backend to appear unresponsive.

### Step 2 — Place model files

Place any `.pt` model files you want bundled into `resources/axolotl-server/models/`. These will be included in the installer and available to the app out of the box. (The `6kp.pt` model is already there.)

### Step 3 — Build the Electron app

Make sure you are in the `axolotlmeasurement` directory and `npm install` has been run at least once.

```
npm run build:win
```

This will:
1. Type-check the TypeScript source
2. Compile the Electron main/preload/renderer bundles
3. Package everything into `dist/axolotlmeasurement-1.0.0-setup.exe` (one-click NSIS installer)
4. Also produce `dist/InvestigatingAxolotls-1.0.0-win.zip` (portable zip, no installation needed)

Note: Windows SmartScreen may warn on first run because the executable is not code-signed. Click "More info → Run anyway" to proceed. This is expected when building without a code-signing certificate.
