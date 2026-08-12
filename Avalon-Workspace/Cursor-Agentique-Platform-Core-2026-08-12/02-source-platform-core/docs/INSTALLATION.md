# Installation — Avalon Agentique Platform (Windows)

## Target

Windows 10/11 x64.

## Layout after install

| Kind | Path |
|---|---|
| Binaries (immutable) | `C:\Program Files\Avalon Agentique Platform\` |
| App data | `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\` |
| Secure vault / keys | `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\secure\` |
| Workspaces | `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\workspaces\` |
| Logs / audit | `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\logs\` |

Secrets are **never** stored beside the executable under Program Files.

## Build installers (Windows machine or CI)

```powershell
# Full release + Tauri NSIS/MSI
.\scripts\build.ps1 -Installer

# Or package after an existing tauri build
.\scripts\package-installer.ps1 -Build
```

GitHub Actions workflow `.github/workflows/avalon-platform-core.yml` job `windows-installer` uploads:

- `Avalon-Agentique-Platform-Setup.exe` (NSIS)
- `Avalon-Agentique-Platform.msi` (WiX via Tauri, when produced)
- `avalon-core.exe`
- `checksums/SHA256SUMS`
- `manifest.json` / `version.txt`

## Offline WebView2 strategy

Avalon uses the Microsoft Edge WebView2 runtime.

1. **Preferred (online first install):** Tauri `webviewInstallMode.downloadBootstrapper` silently installs Evergreen Runtime if missing.
2. **Offline media:** ship Microsoft’s Evergreen Standalone Installer on the install USB (`MicrosoftEdgeWebView2RuntimeInstallerX64.exe`) and run it before Avalon Setup when the target has no Internet.
3. **Enterprise:** preinstall WebView2 via Intune/WSUS; Avalon then installs without network.
4. `build.ps1` can bootstrap Evergreen during developer packaging (`Ensure-WebView2`). Use `-SkipWebViewBootstrap` on air-gapped packagers that already vendor the runtime.

Avalon Core (`avalon-core.exe`) itself does **not** require WebView2 — only the Command Center GUI shell does.

## Uninstall

The uninstaller removes Program Files binaries and shortcuts.  
**User data / vault under LocalAppData are retained** for recovery (see `SECURE_RECOVERY.md`).

## Code signing

CI signs Windows artifacts automatically when Avalon Capital Authenticode secrets are configured; otherwise packages ship unsigned (`manifest.signed=false`, `channel=DEV`).

Production releases must be signed. See `docs/CODE_SIGNING.md`. Do not invent or commit certificates.

## Acceptance (Install) — verified

Automated tests run on two independent clean Windows CI VMs:

1. Install Setup.exe and MSI silently
2. Launch Avalon Command Center and confirm it remains alive
3. Confirm DPAPI root, encrypted vault, sealed DB, local identity, and audit creation
4. Confirm the DB has no plaintext SQLite header
5. Uninstall successfully
6. Confirm binaries are removed and user data remains

Both packages pass. Evidence: `ACCEPTANCE_TEST_A_WINDOWS.md`.
