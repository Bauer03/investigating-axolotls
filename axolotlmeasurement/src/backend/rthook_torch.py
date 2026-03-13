"""
Runtime hook for PyInstaller + PyTorch on Windows.

PyInstaller patches ctypes.CDLL so that DLLs not in its internal registry
(collected during the build) raise "was not found when the application was frozen"
even when the file physically exists in _internal/. This blocks pre-loading of
torch's DLLs (shm.dll, c10.dll, torch_cpu.dll, torch_python.dll).

Fix: bypass ctypes.CDLL entirely and call kernel32.LoadLibraryW directly via
a WinDLL handle to kernel32. Once a DLL is in the process module list by any
means, subsequent LoadLibraryExW / LoadLibraryW calls for the same path just
increment the refcount and succeed immediately.

torch/__init__.py is also patched (with_load_library_flags = False when frozen)
so it uses LoadLibraryW (PATH-based) as a fallback. Both _internal/ and
_internal/torch/lib/ are added to PATH so transitive dependencies are found.
"""
import ctypes
import os
import sys


def _log(msg):
    print(f'[rthook] {msg}', file=sys.stderr, flush=True)


if sys.platform == 'win32' and hasattr(sys, '_MEIPASS'):
    _internal = sys._MEIPASS
    _torch_lib = os.path.join(_internal, 'torch', 'lib')

    _log(f'_MEIPASS = {_internal}')
    _log(f'torch lib dir exists: {os.path.isdir(_torch_lib)}')

    # Add _internal/ and _internal/torch/lib/ to PATH so transitive deps are found
    # by any LoadLibraryW call (which searches PATH for dependencies)
    os.environ['PATH'] = (
        _internal + os.pathsep + _torch_lib + os.pathsep + os.environ.get('PATH', '')
    )

    if os.path.isdir(_torch_lib):
        # Also register via AddDllDirectory for loaders that use restricted flags
        if hasattr(os, 'add_dll_directory'):
            os.add_dll_directory(_internal)
            os.add_dll_directory(_torch_lib)

        # Call kernel32.LoadLibraryW directly to bypass PyInstaller's patched
        # ctypes.CDLL, which blocks DLLs not in its internal frozen-file registry.
        try:
            _k32 = ctypes.WinDLL('kernel32.dll', use_last_error=True)
            _k32.LoadLibraryW.restype = ctypes.c_void_p
            _k32.LoadLibraryW.argtypes = [ctypes.c_wchar_p]

            _load_order = [
                'libiomp5md.dll',
                'libiompstubs5md.dll',
                'uv.dll',
                'shm.dll',
                'c10.dll',
                'torch_global_deps.dll',
                'torch_cpu.dll',
                'torch.dll',
                'torch_python.dll',
            ]
            for _dll in _load_order:
                _dll_path = os.path.join(_torch_lib, _dll)
                if os.path.exists(_dll_path):
                    _res = _k32.LoadLibraryW(_dll_path)
                    if _res:
                        _log(f'loaded {_dll} OK')
                    else:
                        _code = ctypes.get_last_error()
                        _log(f'FAILED to load {_dll}: WinError {_code} ({ctypes.FormatError(_code)})')
        except Exception as _e:
            _log(f'Exception during pre-load: {_e}')
