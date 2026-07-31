# Installation (Windows)

1. Build with `scripts/build.ps1 -Release` on Windows (or CI Windows runners).
2. Installer outputs under `release/`: Setup.exe / MSI when NSIS/WiX available.
3. Binaries → `C:\Program Files\Avalon Capital\Avalon Agentique Platform\`
4. Data → `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\`
5. Secrets never beside EXE.
6. Offline WebView2 bootstrap: ship evergreen bootstrapper or require preinstalled WebView2.

Linux/macOS: Core CLI (`avalon-core`) is supported for development/tests.
