# Macro-X — paquet Codex

**Repo requis :** `avalon-capital` (racine avec `Cargo.toml`).  
Pas le dossier AGENTIQUE isolé.

## Fichiers

- `avalon-agent.json` — contrat Avalon
- `main.py` — entrée agent (SDK) — **Codex étend `run_macro_cycle`**
- `requirements.txt` — pointe vers `packages/python-sdk`

## Valider sans Rust

```bash
# depuis la racine avalon-capital
./scripts/codex-setup.sh
# ou
python3 scripts/validate-agent-package.py agents/codex-drop/macro-x
```

## Installer dans le Core

```bash
cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x
```

Puis UI Agents → Démarrer.
