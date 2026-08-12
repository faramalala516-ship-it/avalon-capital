# Macro-X — paquet Codex

**Repo requis :** `avalon-capital` (racine avec `Cargo.toml`).  
Pas le dossier AGENTIQUE isolé.

## Fichiers

- `avalon-agent.json` — contrat Avalon
- `main.py` — entrée agent (SDK) — **Codex étend `run_macro_cycle`**
- `requirements.txt` — pointe vers `packages/python-sdk`

## Valider / installer

### Windows (recommandé chez toi — pas besoin de cargo ni bash)

```powershell
cd C:\Users\PC\Documents\Codex\2026-07-31\automatiser-une-tache-spreadsheets-plugin-spreadsheets\work\avalon-capital
.\scripts\install-agent-windows.ps1 -StartUi
```

UI → **Agents** → **Installer / mettre à jour** → **Démarrer**.

### Avec cargo (Linux/CI)

```bash
./scripts/codex-setup.sh
cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x
```
