# Windows CI & Packaging

## Workflow

`.github/workflows/avalon-platform-core.yml`

| Job | Runner | Output |
|---|---|---|
| `core-linux` | ubuntu-latest | `avalon-core` binary + checksums |
| `desktop-ui` | ubuntu-latest | Vite `dist/` |
| `windows-installer` | windows-latest | NSIS Setup.exe, MSI (when produced), staged `release/` |

Trigger: changes under Core/desktop/agents/packages/scripts/installer, or `workflow_dispatch`.

## Local Windows

```powershell
.\scripts\build.ps1 -Test
.\scripts\build.ps1 -Installer
.\scripts\package-installer.ps1
```

## Signing

Artifacts are **unsigned** in V1 CI (`signed: false`). Attach Authenticode in a future secrets-backed job — never commit private keys or fake certs.

## Offline WebView2

See `INSTALLATION.md`. Tauri uses `downloadBootstrapper` silent mode; air-gapped media should vendor the Evergreen Standalone installer.
