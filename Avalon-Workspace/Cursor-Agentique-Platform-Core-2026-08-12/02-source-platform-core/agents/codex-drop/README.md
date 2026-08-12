# Zone de dépôt Codex → Avalon

> **Important :** ouvrir le dépôt **`avalon-capital`** (celui avec `Cargo.toml` à la racine).  
> Un workspace nommé seulement « AGENTIQUE » sans ce monorepo ne peut pas installer via `avalon-kernel`.

Voir aussi `CODEX.md` à la racine.

## Macro-X

Paquet prêt à étendre :

```
agents/codex-drop/macro-x/
  avalon-agent.json
  main.py                 # étendre run_macro_cycle()
  requirements.txt
  README.md
```

### Sans cargo (validation Python)

```bash
./scripts/codex-setup.sh
python3 scripts/validate-agent-package.py agents/codex-drop/macro-x
```

### Avec cargo (install Core)

```bash
cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x
```

### Règles

- `agent_id` = `macro-x`
- Interdit : `shell.raw`
- Pas de logique métier dans `core/`
- SDK : `packages/python-sdk`
