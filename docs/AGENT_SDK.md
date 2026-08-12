# Agent SDK (Python)

Package : `packages/python-sdk` (`avalon_agent_sdk`) — copie miroir sous `agents/sdk/`.

## Client

```python
from avalon_agent_sdk import AvalonAgentClient
import os
from pathlib import Path

client = AvalonAgentClient(
    agent_id=os.environ["AVALON_AGENT_ID"],
    workspace=Path(os.environ["AVALON_WORKSPACE"]),
)
```

`AVALON_API_BASE` et `AVALON_API_TOKEN_FILE` sont lus automatiquement.

## APIs

| Méthode | Rôle |
|---|---|
| `register_agent` | métadonnées workspace |
| `publish_event` | journal local (+ futur bus Core) |
| `subscribe` | abonnements locaux |
| `request_tool` | tâche via Core `/v1/agents/{id}/tasks` |
| `request_permission` | refuse `shell.raw` localement |
| `get_workspace` | chemin sandbox |
| `get_dataset` | placeholder dataset |
| `get_secret_reference` | **jamais** la valeur secrète |
| `call_model` | stub / gateway |
| `report_health` | health.json |
| `create_artifact` | index artefacts |

## Install & run

Voir `docs/CODEX_AGENT_BUILD_GUIDE.md`.
