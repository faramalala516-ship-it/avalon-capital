# Code Signing — Avalon Agentique Platform (Windows Authenticode)

## Policy

- Production Windows installers and binaries **must** be Authenticode-signed with Avalon Capital’s real code-signing certificate.
- **Never** invent, commit, or generate throwaway certificates for “green CI.”
- When signing secrets are absent, CI **skips** signing and ships `manifest.signed=false` (DEV channel). The job stays green.

## Pipeline

Script: `scripts/sign-windows.ps1`  
Workflow step: `Authenticode sign (secrets-gated)` in `.github/workflows/avalon-platform-core.yml`

Signed targets (when present under `release/`):

- `Avalon-Agentique-Platform-Setup.exe`
- `Avalon-Agentique-Platform.msi`
- `avalon-desktop.exe`
- `avalon-core.exe`
- plus any additional staged `*-setup.exe` / `.msi` variants

Flow: **stage → sign (optional) → verify (if signed) → checksums/manifest**.

## GitHub secrets (operators)

Repository → Settings → Secrets and variables → Actions.

| Name | Type | Required | Description |
|---|---|---|---|
| `AVALON_WINDOWS_CODESIGN_PFX_BASE64` | Secret | Yes (to sign) | Base64 of the Avalon Capital `.pfx` / `.p12` (no PEM conversion needed) |
| `AVALON_WINDOWS_CODESIGN_PFX_PASSWORD` | Secret | Yes (to sign) | PFX password |
| `AVALON_WINDOWS_CODESIGN_TIMESTAMP_URL` | Variable (optional) | No | RFC 3161 timestamp URL (default `http://timestamp.digicert.com`) |
| `AVALON_WINDOWS_CODESIGN_SUBJECT` | Variable (optional) | No | Substring that must appear in the signer subject (e.g. `Avalon Capital`) |

### Encode a PFX locally (operator workstation)

```powershell
# Never commit the PFX or this Base64 output into git.
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\secure\avalon-codesign.pfx")) |
  Set-Clipboard
```

Paste into the `AVALON_WINDOWS_CODESIGN_PFX_BASE64` secret. Store the password in `AVALON_WINDOWS_CODESIGN_PFX_PASSWORD`.

### Local sign after packaging

```powershell
$env:AVALON_WINDOWS_CODESIGN_PFX_PATH = "C:\secure\avalon-codesign.pfx"
$env:AVALON_WINDOWS_CODESIGN_PFX_PASSWORD = "<password>"
.\scripts\build.ps1 -Installer
.\scripts\sign-windows.ps1 -ReleaseDir release
.\scripts\sign-windows.ps1 -ReleaseDir release -VerifyOnly
```

Force failure if secrets are missing (release gates):

```powershell
.\scripts\sign-windows.ps1 -ReleaseDir release -RequireSigning
```

## Manifest fields

| Field | Unsigned DEV | Signed release |
|---|---|---|
| `signed` | `false` | `true` |
| `channel` | `DEV` | `SIGNED` |
| `signing` | `unsigned` | `authenticode` |

Evidence file: `release/signing/report.json` (+ `status.txt`: `SKIP` or `SIGNED`).

## Verification

```powershell
Get-AuthenticodeSignature .\release\Avalon-Agentique-Platform-Setup.exe
# Status should be Valid; Subject should identify Avalon Capital
```

CI runs `-VerifyOnly` automatically when status is `SIGNED`.

## What this agent / CI will not do

- Create self-signed or demo Authenticode certificates
- Commit PFX/PEM/private keys
- Mark `signed: true` without a Valid Authenticode signature
