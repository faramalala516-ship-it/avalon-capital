# Codex — travailler ICI (pas dans AGENTIQUE)

Ce dépôt **`avalon-capital`** est le monorepo Avalon Agentique Platform-Core.

Il contient déjà :

| Élément | Chemin |
|---|---|
| Workspace Rust / `avalon-kernel` | `Cargo.toml`, `core/kernel` |
| SDK Python | `packages/python-sdk` (`avalon_agent_sdk`) |
| Zone de dépôt Macro-X | `agents/codex-drop/macro-x/` |
| Guide agents | `agents/AGENTS.md` |

Si ton environnement s’appelle **AGENTIQUE** et n’a pas de `Cargo.toml` à la racine : tu es dans le **mauvais dossier**. Ouvre / clone ce repo :

```text
https://github.com/faramalala516-ship-it/avalon-capital
branche: cursor/avalon-agentique-platform-core-14e5
```

## Setup en 30 secondes

### Linux / macOS / cloud

```bash
# Depuis la racine du repo (là où est Cargo.toml)
./scripts/codex-setup.sh
python3 scripts/validate-agent-package.py agents/codex-drop/macro-x
cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x
```

### Windows (sans bash / sans cargo)

```powershell
# Depuis la racine du repo
.\scripts\codex-setup.ps1
.\scripts\install-agent-windows.ps1 -StartUi
```

Puis dans l’UI : **Agents → Installer / mettre à jour → Démarrer**.

Ça copie le paquet vers :

`%LOCALAPPDATA%\Avalon Capital\Agentique Platform\agents\incoming\macro-x`

## Mission Codex Macro-X

1. Compléter / remplacer le code dans `agents/codex-drop/macro-x/`
2. Garder `agent_id: "macro-x"` et le contrat SDK
3. **Ne jamais** mettre la logique métier dans `core/`
4. Interdit : `shell.raw`
5. Lancer `python3 scripts/validate-agent-package.py agents/codex-drop/macro-x`
6. Si cargo dispo : `cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x`

Le squelette actuel est un agent SDK réel (pas un mock vide) — étends-le.
