# Acceptance Test A — Windows Install

**Status:** PASS  
**CI run:** `30631112571`  
**Date:** 2026-07-31  
**Environment:** two independent GitHub-hosted `windows-latest` VMs

## Packages tested

| Package | SHA-256 | Result |
|---|---|---|
| `Avalon-Agentique-Platform-Setup.exe` | `dbd913595a606f1880048c6b344ff50f4154789dcf03153c3ab7ca276505dc3c` | PASS |
| `Avalon-Agentique-Platform.msi` | `a360a5cb4415274f11660ad56f20f7b96a2bb52381039a46bab353e9ae73b2c8` | PASS |

## Assertions verified for each package

1. Release checksums validate before execution.
2. Silent install exits with code `0`.
3. Installed executable exists at
   `C:\Program Files\Avalon Agentique Platform\avalon-desktop.exe`.
4. Desktop process remains alive after a 15-second launch smoke period.
5. First launch creates:
   - `secure\root.key.sealed` (Windows DPAPI root protection)
   - `secure\vault.bin` (authenticated encrypted vault)
   - `avalon_core.db` (sealed database)
   - `identity.json`
   - `logs\audit.jsonl`
6. `avalon_core.db` does not begin with the plaintext SQLite header.
7. Silent uninstall exits with code `0`.
8. Application executable is removed.
9. Local user data remains available for recovery after uninstall.

## Automation

Workflow jobs:

- `Clean Windows install (nsis)`
- `Clean Windows install (msi)`

Reusable test script:

```powershell
.\scripts\test-windows-install.ps1 -PackageType nsis -ReleaseDir release
.\scripts\test-windows-install.ps1 -PackageType msi -ReleaseDir release
```

CI uploads machine-readable evidence:

- `avalon-install-test-nsis/nsis.json`
- `avalon-install-test-msi/msi.json`

## Scope limitation

This validates unattended installation, process launch, first-run secure
initialization, database-at-rest format, and uninstall behavior. It does not
replace manual visual UI inspection. When `manifest.signed=true`, CI also
enforces Authenticode verification (`scripts/sign-windows.ps1 -VerifyOnly`);
see `docs/CODE_SIGNING.md`.
