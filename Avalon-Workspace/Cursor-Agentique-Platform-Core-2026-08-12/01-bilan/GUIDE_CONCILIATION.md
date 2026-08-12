# GUIDE — Conciliation Dropbox × Git × PC

## Sur ton PC (Windows)

### 1. Copier dans Dropbox
Copie le dossier `Cursor-Agentique-Platform-Core-2026-08-12` vers :

```text
%USERPROFILE%\Dropbox\avalon workspace\Cursor-Agentique-Platform-Core-2026-08-12
```

(ou le chemin exact de ton Dropbox s’il est ailleurs)

### 2. Inventaire anti-doublons (5 minutes)
Dans `avalon workspace`, pour chaque dossier existant, décide :

| Tag | Critère |
|---|---|
| `KEEP-TRUTH` | = ce package Cursor / clone Git de la branche |
| `MERGE-CANDIDATE` | Codex WIP avec code Macro-X plus riche (classifier, Excel…) |
| `ARCHIVE` | Anciens zips, screenshots, essais |
| `DELETE-SAFE` | Copies Macro-X < 0.3.4 sans `lifecycle: daemon` |

### 3. Diff Macro-X si Codex WIP existe
```powershell
# Adapter les chemins
$Cursor = "$env:USERPROFILE\Dropbox\avalon workspace\Cursor-Agentique-Platform-Core-2026-08-12\03-agents-macro-x\macro-x-0.3.4-codex"
$Codex  = "C:\Users\PC\Documents\Codex\...\macro-x"   # ton chemin réel
Compare-Object (Get-ChildItem -Recurse $Cursor | % FullName) (Get-ChildItem -Recurse $Codex | % FullName)
fc.exe $Cursor\main.py $Codex\main.py
```

### 4. Runtime
1. Désinstaller ancienne Avalon
2. Installer Setup.exe (lien dans `06-liens-artefacts/LIENS.md`)
3. Vérifier version UI = `0.3.4-codex` EN COURS

### 5. Git
Travaille toujours depuis le clone GitHub de la branche PR #3, pas depuis une copie Dropbox du source (Dropbox = archive/export).
