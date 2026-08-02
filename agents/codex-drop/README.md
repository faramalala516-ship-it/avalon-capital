# Zone de dépôt Codex → Avalon

Déposez ici les agents livrés par Codex. Avalon les **installe** (copie + validation + permissions), le Core ne contient **jamais** la logique métier.

## Macro-X

```
agents/codex-drop/macro-x/
  avalon-agent.json   # obligatoire
  main.py             # entrypoint (ou autre déclaré)
  ...                 # code, prompts, assets
```

### Installer

```bash
# CLI
cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x

# ou depuis le Centre de commande → Agents → Installer / mettre à jour
```

Priorité au démarrage desktop :

1. `agents/codex-drop/macro-x`
2. `agents/macro-x`
3. `agents/templates/macro-x-mock` (fallback contrat)
4. `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\agents\incoming\macro-x`

### Règles absolues

- `agent_id` doit être `macro-x`
- Interdit : `shell.raw`, PowerShell, cmd.exe
- Permissions déclarées narrowement dans le manifeste
- Secrets via Vault / références — jamais en clair dans le paquet
- Business logic Macro-X **hors** du Kernel Avalon

Voir `docs/CODEX_AGENT_BUILD_GUIDE.md` et `docs/MACRO_X_INTEGRATION.md`.
