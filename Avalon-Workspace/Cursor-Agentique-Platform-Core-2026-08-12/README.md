# README — Avalon Workspace (export Cursor)

Dossier à placer dans ton Dropbox :

```text
Dropbox/
  avalon workspace/                          ← dossier déjà existant
    Cursor-Agentique-Platform-Core-2026-08-12/   ← CE dossier
```

## Contenu

| Dossier | Rôle |
|---|---|
| `01-bilan/` | Bilan complet + plan de conciliation |
| `02-source-platform-core/` | Snapshot source Platform-Core (agents, core, desktop, services…) |
| `03-agents-macro-x/` | Macro-X `0.3.4-codex` prêt à lire |
| `04-docs/` | Documentation plateforme |
| `05-scripts-install/` | Scripts Windows / installers |
| `06-liens-artefacts/` | PR, CI, Setup.exe |
| `07-historique-git/` | 25 commits vs `main` |

## Source de vérité

- **Agents / OS local / Macro-X** → ce package + branche GitHub `cursor/avalon-agentique-platform-core-14e5`
- **SaaS web Avalon Capital (Next.js)** → repo `main` (non dupliqué ici)

## Installation rapide PC

1. Télécharger Setup.exe : voir `06-liens-artefacts/LIENS.md`
2. Python 3 (`py -3`)
3. Ouvrir Avalon → Macro-X doit être **EN COURS** (`0.3.4-codex`)
