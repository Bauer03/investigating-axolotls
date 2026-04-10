#!/bin/bash
# setup-python-runtime.sh
# Creates a self-contained Python venv in resources/python-runtime/
# Run this ONCE before your first build, and again whenever requirements.txt changes.
# Requires Python 3 and internet access.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$SCRIPT_DIR/resources/python-runtime"
REQ_FILE="$SCRIPT_DIR/src/backend/requirements.txt"

echo "=== Python runtime setup (macOS) ==="

if [ ! -f "$RUNTIME_DIR/bin/python3" ]; then
    echo "Creating venv at $RUNTIME_DIR ..."
    python3 -m venv "$RUNTIME_DIR"
    echo "Venv created."
else
    echo "Venv already present, skipping creation."
fi

echo "Installing requirements (this may take several minutes - PyTorch/ultralytics are large)..."
"$RUNTIME_DIR/bin/pip" install -r "$REQ_FILE"

echo ""
echo "=== Done! Runtime ready at: $RUNTIME_DIR ==="
echo "You can now run: npm run build:mac"
