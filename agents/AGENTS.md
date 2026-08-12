# Avalon Agents — instructions pour Codex / contributeurs

> Travaillez dans **`avalon-capital`** (racine = `Cargo.toml`).  
> Si vous êtes dans un dossier AGENTIQUE sans ce monorepo : changez de workspace.  
> Voir `CODEX.md`.

## Rôle

Avalon Agentique Platform-Core héberge des **agents indépendants**.  
Le Kernel gère vault, permissions, network broker, audit, workspaces.  
**Vous codez l’agent** (ex. Macro-X), pas le Kernel.

## Macro-X (chemin Codex)

Le squelette existe déjà : `agents/codex-drop/macro-x/` (SDK réel).

1. Étendre `run_macro_cycle()` dans `main.py`
2. Garder `avalon-agent.json` (`agent_id: "macro-x"`)
3. Setup / validation (sans cargo si besoin) :
   ```bash
   ./scripts/codex-setup.sh
   python3 scripts/validate-agent-package.py agents/codex-drop/macro-x
   ```
4. Installer (cargo requis) :
   ```bash
   cargo run -p avalon-kernel -- --data-dir /tmp/avalon-dev agents install agents/codex-drop/macro-x
   ```
5. Démarrer depuis l’UI **Agents** ou API `POST /v1/agents/macro-x/start`

## Contrat manifeste

Référence mock : `agents/templates/macro-x-mock/avalon-agent.json`

Permissions typiques Macro-X :

- `filesystem.read.workspace` / `filesystem.write.workspace`
- `network.api.fred` / `network.api.bls` (via NetworkBroker)
- `application.excel.open` / `application.excel.write` (via PrivilegeBroker — Excel COM encore partiel)
- `memory.read.self` / `memory.write.self`

**Jamais** `shell.raw`.

## Variables d’environnement injectées au start

| Variable | Rôle |
|---|---|
| `AVALON_AGENT_ID` | id agent |
| `AVALON_WORKSPACE` | sandbox workspace |
| `AVALON_API_BASE` | API locale Core |
| `AVALON_API_TOKEN_FILE` | chemin du token API |
| `AVALON_PYTHONPATH` | optionnel, pour trouver le SDK |

## Packaging

```bash
./scripts/package-agent.sh agents/codex-drop/macro-x
# produit release/agents/macro-x-<version>.avalon-agent (zip + HASHES)
```

## Tests minimaux attendus

- Install refuse `shell.raw`
- Workspace isolé (pas de traversal)
- Start/stop sans planter le Core
- Offline lock : pas d’appel réseau arbitraire
