# Bilan complet — Avalon Capital × Agents × Cursor

**Date :** 2026-08-12  
**Auteur export :** Cursor Cloud Agent (`bc-707c394a-9f88-4a27-a2c0-f721efa614e5`)  
**Branche :** `cursor/avalon-agentique-platform-core-14e5` @ `d10011a`  
**PR :** https://github.com/faramalala516-ship-it/avalon-capital/pull/3  

> **Note Dropbox :** depuis la VM cloud Cursor, le Dropbox de ton PC n’est **pas monté**.  
> Ce dossier est l’export à **copier** dans `Dropbox/avalon workspace/`.  
> L’analyse ci-dessous compare les sources connues (GitHub + historique Codex/PC). Une passe visuelle dans ton Dropbox local reste nécessaire pour valider d’éventuels fichiers hors-git.

---

## 1. Ce que nous avons construit (Cursor / cette branche)

### Produit
Un **OS local d’agents Avalon** (pas un chatbot) installable Windows :

- Kernel Rust (`core/*`) — vault AES-256-GCM, permissions deny-by-default, audit chain, network/privilege brokers
- Agent Host (`services/agent-host`) — install, start/stop, **daemon supervision / auto-restart**
- Desktop Tauri 2 FR (`apps/desktop`) — Command Center
- SDK Python (`packages/python-sdk` + vendor dans les agents)
- Pipeline Codex (`agents/codex-drop/macro-x`, `CODEX.md`, scripts Windows)
- CI Windows NSIS/MSI + smoke install PASS
- Macro-X **`0.3.4-codex`** : broker FRED, `INSUFFICIENT_EVIDENCE` sans data, heartbeat daemon, auto-install/start au boot

### Volume
- **+25 commits** vs `main`
- **~170 fichiers / +20 856 lignes** (diff branche)
- SaaS Next.js Avalon Capital **préservé** (non écrasé)

### Correctifs critiques livrés
1. Chemins ressources bundlées Windows (Macro-X introuvable → one-shot → ARRÊTÉ)
2. Daemon keep-alive + relance host
3. Python Windows (`py -3`) + SDK vendored
4. API locale desktop + token agents
5. Arrêt propre des daemons à la fermeture app
6. UI FR + messages d’erreur réels (plus de faux `Failed to fetch`)

---

## 2. Cartographie des « mondes » Avalon (doublons possibles)

| Source | Nature | Avancement agents | Risque doublon |
|---|---|---|---|
| **A. GitHub `main`** | SaaS Next.js Avalon Capital | Faible / catalogue UI | Base web — **pas** l’OS agents |
| **B. Branche Cursor (ce package)** | Platform-Core + Macro-X daemon | **Le plus avancé** | Source de vérité agents |
| **C. Clone Codex local (PC)** | Travail Codex dans un sous-dossier Documents/Codex/…/avalon-capital | Peut contenir extensions Macro-X **non pushées** | Doublon partiel Macro-X |
| **D. Dropbox `avalon workspace`** | Archives / briefs / autres exports | Inconnu depuis cloud | À inventorier localement |
| **E. Install LocalAppData** | `%LOCALAPPDATA%\Avalon Capital\Agentique Platform\` | Runtime installé | Pas du source — ne pas traiter comme repo |

### Verdict évolution
**Ce dossier Cursor (B) est allé clairement plus loin** que `main` (A) sur tout le volet agentique :

- OS local sécurisé complet
- Installateur Windows réel
- Macro-X livrable daemon `0.3.4-codex`
- Supervision, UI agents, pipeline Codex

Les doublons probables ne sont **pas** « deux plateformes concurrentes dans Git », mais plutôt :
- plusieurs **copies Macro-X** (Codex local / Dropbox / incoming LocalAppData / ancienne version installée)
- éventuels **docs / specs** dupliqués entre Dropbox et `docs/` du repo

---

## 3. Analyse doublons — où ça se chevauche

### 3.1 Macro-X (zone chaude)
| Variante | Emplacement typique | Statut |
|---|---|---|
| Mock oneshot | `agents/templates/macro-x-mock` | Tests / debug seulement |
| Codex drop production | `agents/codex-drop/macro-x` **0.3.4-codex** | **Garder** |
| Codex local non pushé | clone Documents/Codex/… | Comparer fichier à fichier ; merger uniquement s’il y a du métier en avance |
| Incoming Windows | `%LOCALAPPDATA%\...\agents\incoming\macro-x` | Zone de drop — peut être stale |
| Installé | `%LOCALAPPDATA%\...\agents\macro-x\<version>\` | Runtime ; doit être `0.3.4-codex` |

**Règle :** une seule source source = `agents/codex-drop/macro-x` de la branche Cursor.  
Tout autre Macro-X plus vieux (`0.3.2`, sans `lifecycle: daemon`) = **obsolète**.

### 3.2 SDK Python
Tripliqué volontairement pour Windows-safe :
- `packages/python-sdk`
- `agents/sdk`
- `agents/codex-drop/macro-x/vendor`

→ Pas un doublon fonctionnel nocif ; le vendor est **requis** pour l’install PC.

### 3.3 SaaS vs Desktop
- `app/`, `components/` (Next.js) = produit web
- `apps/desktop/` = OS agents

→ **Pas un doublon** : deux surfaces, un monorepo.

---

## 4. Plan de conciliation (comment tout aligner)

### Étape 1 — Dropbox
1. Copier ce dossier dans :
   `Dropbox/avalon workspace/Cursor-Agentique-Platform-Core-2026-08-12/`
2. Dans `avalon workspace`, inventaire rapide :
   - lister les dossiers existants
   - taguer : `ARCHIVE`, `CODEx-WIP`, `SPECS`, `ANCIEN-MACRO-X`
3. Ne **pas** écraser un dossier Codex WIP : le mettre à côté et comparer.

### Étape 2 — Git (source de vérité code)
1. Merger / finaliser PR #3 vers `main` quand tu valides
2. Sur le PC : `git clone` ou `git fetch` la branche Cursor — **éviter** de travailler dans un clone Codex orphelin
3. Si Codex a du code Macro-X non pushé :
   ```text
   diff -ru Codex/.../macro-x  agents/codex-drop/macro-x
   ```
   Ne reprendre que les ajouts métier (classifier, Excel, séries) **par-dessus** `0.3.4-codex`.

### Étape 3 — Runtime PC
1. Désinstaller ancienne Avalon
2. Installer dernier Setup.exe (voir `06-liens-artefacts/LIENS.md`)
3. Vérifier Agents → Macro-X **EN COURS** `0.3.4-codex`
4. Supprimer/ignorer les paquets `incoming` stale

### Étape 4 — Convention workspace Dropbox (recommandée)
```text
avalon workspace/
  00-SOURCE-DE-VERITE.txt          ← pointe vers GitHub branche/PR
  Cursor-Agentique-Platform-Core-2026-08-12/   ← cet export
  Archives/                        ← anciens zips / essais
  Codex-WIP/                       ← uniquement travail non mergé
  Specs-Business/                  ← briefs métier hors code
```

---

## 5. Ce qui est fait vs reste

### Fait (côté Platform-Core / Macro-X)
- [x] Kernel sécurisé + tests acceptance
- [x] Desktop FR installable Windows
- [x] Macro-X daemon stable (CI + smoke)
- [x] Pipeline install Codex / incoming
- [x] Auto-install + auto-start + supervision

### Reste (produit)
- [ ] Merger PR #3 (encore **draft**)
- [ ] Authenticode avec vrai certificat Avalon
- [ ] FRED live (mode ONLINE + grants) — offline = `INSUFFICIENT_EVIDENCE` (voulu)
- [ ] Classifier macro réel (aujourd’hui DATA_PRESENT_UNCLASSIFIED)
- [ ] Agents Gem-Trade / MetaQuant (placeholders)
- [ ] Excel COM / DuckDB / SQLCipher natif (partiels ou scellés AES)
- [ ] Inventaire local Dropbox + merge éventuel Codex WIP

### Action immédiate recommandée
1. Copier ce package dans Dropbox `avalon workspace`
2. Réinstaller Setup.exe `0.3.4`
3. Comparer tout Macro-X Dropbox/Codex vs `03-agents-macro-x/macro-x-0.3.4-codex`
4. Merger PR quand le PC est validé

---

## 6. Conclusion

| Question | Réponse |
|---|---|
| Y a-t-il eu du doublon de travail ? | Oui, **surtout autour de Macro-X** (Codex local / installs / anciennes versions), pas sur le Kernel. |
| Ce dossier est-il plus avancé ? | **Oui** — c’est l’évolution la plus complète de l’OS agents + Macro-X daemon Windows. |
| Comment concilier ? | Git branche Cursor = vérité code agents ; Dropbox = archive + WIP nommé ; une seule version Macro-X (`0.3.4-codex`) ; SaaS Next.js reste sur `main`. |

**En une phrase :** garde ce package Cursor comme référence Platform-Core/agents, range le reste Dropbox/Codex en archive ou WIP, et ne merge vers Git que ce qui dépasse vraiment `0.3.4-codex`.
