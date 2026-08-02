# Codex Agent Build Guide — Avalon Agentique

Avalon Core **n’embarque pas** la logique métier des agents. Codex livre un **paquet agent** ; Avalon l’installe, le sandboxe, et l’exécute sous permissions.

## Checklist Macro-X

1. Créer / remplir `agents/codex-drop/macro-x/`
2. Ajouter `avalon-agent.json` (`schema_version=1`, `agent_id=macro-x`)
3. Implémenter `main.py` avec `avalon_agent_sdk.AvalonAgentClient`
4. Déclarer permissions **étroites** (jamais `shell.raw`)
5. Publier des événements structurés (`macro.regime.changed`, etc.)
6. Utiliser workspace + tools + network via Core / SDK
7. Packager (optionnel) : `./scripts/package-agent.sh agents/codex-drop/macro-x`
8. Installer :
   ```bash
   cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x
   ```
9. Démarrer depuis UI **Agents** ou API `POST /v1/agents/macro-x/start`
10. Tests : permission denied, isolation workspace, offline lock, start/stop Core intact

## Structure paquet

```
agents/codex-drop/macro-x/
  avalon-agent.json
  main.py
  SYSTEM_PROMPT.md          # optionnel
  requirements.txt          # optionnel
  lib/ ...
```

## Manifeste (champs requis)

| Champ | Exemple |
|---|---|
| `schema_version` | `1` |
| `agent_id` | `macro-x` |
| `name` | `Macro-X` |
| `version` | `1.0.0` |
| `runtime` | `python` |
| `entrypoint` | `main.py` |
| `permissions` | liste string |
| `network.allowlist` | hôtes autorisés (médiés) |

Référence : `agents/templates/macro-x-mock/avalon-agent.json`

## Environnement runtime

Injecté par Agent Host au `start` :

- `AVALON_AGENT_ID`
- `AVALON_WORKSPACE`
- `AVALON_API_BASE` (défaut `http://127.0.0.1:8741`)
- `AVALON_API_TOKEN_FILE`

## API d’installation

- CLI : `avalon-core agents install <path>`
- HTTP : `POST /v1/agents/install` body `{"path":"..."}` (auth token)
- Desktop : `install_agent` / `install_agent_preferred` (bouton UI)

L’install :
1. valide le manifeste
2. refuse permissions interdites
3. copie vers `%LOCALAPPDATA%/.../agents/<id>/<version>/`
4. écrit `HASHES.sha256`
5. enregistre + accorde permissions déclarées (catalogue)
6. pointe `install_root`

## Interdits

- Logique Macro-X dans `core/`
- `shell.raw` / PowerShell / cmd
- Secrets en clair dans le paquet ou l’UI
- Appels réseau hors NetworkBroker

## Docs liées

- `agents/AGENTS.md`
- `agents/codex-drop/README.md`
- `docs/MACRO_X_INTEGRATION.md`
- `docs/AGENT_SDK.md`
