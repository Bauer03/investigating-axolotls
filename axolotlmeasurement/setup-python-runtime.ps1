# setup-python-runtime.ps1
# Creates a self-contained embedded Python runtime in resources/python-runtime/
# Run this ONCE before your first build, and again whenever requirements.txt changes.
# Requires internet access.

param([string]$PythonVersion = "3.12.6")

$ErrorActionPreference = "Stop"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$RuntimeDir = Join-Path $ScriptDir "resources\python-runtime"
$ReqFile    = Join-Path $ScriptDir "src\backend\requirements.txt"
$EmbedUrl   = "https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip"

Write-Host "=== Python $PythonVersion embedded runtime setup ==="

# 1. Download + extract embedded Python
if (-not (Test-Path (Join-Path $RuntimeDir "python.exe"))) {
    $TempZip = Join-Path $env:TEMP "python-embed.zip"
    Write-Host "Downloading $EmbedUrl ..."
    Invoke-WebRequest -Uri $EmbedUrl -OutFile $TempZip
    if (Test-Path $RuntimeDir) { Remove-Item $RuntimeDir -Recurse -Force }
    New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null
    Expand-Archive -Path $TempZip -DestinationPath $RuntimeDir -Force
    Remove-Item $TempZip
    Write-Host "Extracted."
} else {
    Write-Host "Python already present, skipping download."
}

# 2. Patch ._pth to enable site-packages (required for pip-installed packages)
$PthFile = Get-ChildItem $RuntimeDir -Filter "python*._pth" | Select-Object -First 1
if ($PthFile) {
    $Content = Get-Content $PthFile.FullName
    $Patched = $Content | ForEach-Object { $_ -replace '^#?import site', 'import site' }
    Set-Content $PthFile.FullName $Patched
    if (-not (Get-Content $PthFile.FullName | Where-Object { $_ -eq 'import site' })) {
        throw "Failed to patch $($PthFile.Name) - 'import site' not found after patch"
    }
    Write-Host "Patched $($PthFile.Name) for site-packages."
}

# 3. Bootstrap pip
$PipExe = Join-Path $RuntimeDir "Scripts\pip.exe"
if (-not (Test-Path $PipExe)) {
    Write-Host "Installing pip..."
    $GetPip = Join-Path $env:TEMP "get-pip.py"
    Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile $GetPip
    & (Join-Path $RuntimeDir "python.exe") $GetPip --no-warn-script-location
    Remove-Item $GetPip
    Write-Host "pip installed."
}

# 4. Install project requirements
Write-Host "Installing requirements (this may take several minutes — PyTorch alone is ~2 GB)..."
& (Join-Path $RuntimeDir "python.exe") -m pip install `
    -r $ReqFile `
    --no-warn-script-location `
    --progress-bar on

Write-Host ""
Write-Host "=== Done! Runtime ready at: $RuntimeDir ==="
Write-Host "You can now run: npm run build:win"
Write-Host "If this doesn't work, please contact Paul :)"
