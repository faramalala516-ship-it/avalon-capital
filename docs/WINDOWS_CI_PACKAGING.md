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

Authenticode is **secrets-gated** via `scripts/sign-windows.ps1`:

- Secrets present (`AVALON_WINDOWS_CODESIGN_PFX_BASE64` + `AVALON_WINDOWS_CODESIGN_PFX_PASSWORD`) → sign EXE/MSI, verify, set `manifest.signed=true` / `channel=SIGNED`
- Secrets absent → skip cleanly, `manifest.signed=false` / `channel=DEV`, CI stays green

Never invent certificates. Operator setup: `docs/CODE_SIGNING.md`.

## Offline WebView2

See `INSTALLATION.md`. Tauri uses `downloadBootstrapper` silent mode; air-gapped media should vendor the Evergreen Standalone installer.
