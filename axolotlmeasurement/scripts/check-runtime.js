// Verifies that the embedded Python runtime exists before electron-builder runs.
// If missing, prints a clear error and exits non-zero so the build fails immediately.

const { existsSync } = require('fs')
const { join } = require('path')

const isWin = process.platform === 'win32'
const pythonBin = isWin ? 'python.exe' : join('bin', 'python3')
const runtimePython = join(__dirname, '..', 'resources', 'python-runtime', pythonBin)

if (!existsSync(runtimePython)) {
  const setupCmd = isWin
    ? 'powershell -ExecutionPolicy Bypass -File setup-python-runtime.ps1'
    : 'bash setup-python-runtime.sh'
  const buildCmd = isWin ? 'npm run build:win' : 'npm run build:mac'
  console.error('\n❌  Python runtime not found.')
  console.error('    Expected: ' + runtimePython)
  console.error('\n    Run the setup script first, then rebuild:')
  console.error('      ' + setupCmd)
  console.error('      ' + buildCmd + '\n')
  process.exit(1)
}

console.log('✔  Python runtime found.')
