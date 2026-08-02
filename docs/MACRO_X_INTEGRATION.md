# Macro-X Integration

Macro-X est un **agent indépendant**. Le Core Avalon n’embarque **jamais** sa logique métier.

## Contrat

| Élément | Emplacement |
|---|---|
| Manifeste de référence (mock) | `agents/templates/macro-x-mock/avalon-agent.json` |
| Prompt seed Core | `agents/templates/macro-x-mock/SYSTEM_PROMPT.md` |
| Livraison Codex | `agents/codex-drop/macro-x/` |
| Paquet réel (optionnel) | `agents/macro-x/` |
| Incoming runtime | `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\agents\incoming\macro-x` |

## Priorité d’installation (desktop)

1. `agents/codex-drop/macro-x`
2. `agents/macro-x`
3. `agents/templates/macro-x-mock`
4. `agents/incoming/macro-x` (LocalAppData)

## Capacités prévues (médiées)

- Register / start / stop / health
- Workspace isolé
- Events (`macro.release.published`, `macro.regime.changed`, `prediction.created`)
- Outils Excel (PrivilegeBroker — COM encore partiel V1)
- Séries macro via Data Service + NetworkBroker (FRED, BLS, …)
- LLM local via LLM Gateway
- Actions Windows **typées** uniquement

## Brancher le vrai Macro-X (Codex)

```bash
# 1. Codex écrit agents/codex-drop/macro-x/{avalon-agent.json,main.py,...}
# 2. Installer
cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x
# 3. UI → Agents → Démarrer
# ou réinstaller depuis le bouton « Installer / mettre à jour »
```

Acceptance J (contrat) reste valable : start/stop, permissions réseau accordées explicitement, pas de shell brut.

## Ce que le mock prouve

`agents/templates/macro-x-mock/main.py` valide uniquement le **contrat d’intégration** (register, event, workspace artifact, intent réseau). Ce n’est pas l’intelligence macro de production.
