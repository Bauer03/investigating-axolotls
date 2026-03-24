// Verifies that the embedded Python runtime exists before electron-builder runs.
// If missing, prints a clear error and exits non-zero so the build fails immediately.

const { existsSync } = require('fs')
const { join } = require('path')

const runtimePython = join(__dirname, '..', 'resources', 'python-runtime', 'python.exe')

if (!existsSync(runtimePython)) {
  console.error('\n❌  Python runtime not found.')
  console.error('    Expected: ' + runtimePython)
  console.error('\n    Run the setup script first, then rebuild:')
  console.error('      powershell -ExecutionPolicy Bypass -File setup-python-runtime.ps1')
  console.error('      npm run build:win\n')
  process.exit(1)
}

console.log('✔  Python runtime found.')
