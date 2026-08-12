# Threat Model — Avalon Agentique Platform-Core V1

**Classification:** Internal engineering  
**Scope:** Local Windows desktop Core (Tauri + Rust Kernel + Python agents)  
**Assumption:** Single interactive user profile (V1)

Likelihood / impact scale: Low / Medium / High / Critical.

---

## 1. Assets

| Asset | Sensitivity |
|---|---|
| Root keys / KEKs / DEKs | Critical |
| Vault secrets (API keys, tokens) | Critical |
| Encrypted core DB | High |
| Audit ledger integrity | High |
| Agent workspaces / datasets | Medium–High |
| Permission grants | High |
| Local LLM prompts / agent memory | Medium |
| UI session / IPC tokens | High |

---

## 2. Trust Boundaries

1. WebView / React UI ↔ Tauri command layer  
2. Kernel ↔ Agent processes  
3. Agents ↔ Privilege / Network / Vault brokers  
4. Host OS user session ↔ Avalon data directories  
5. Network egress via NetworkBroker only  

---

## 3. Threat Catalog

### T01 — Malicious document / prompt injection

| | |
|---|---|
| **Likelihood** | High |
| **Impact** | Medium–High (unsafe tool requests) |
| **Mitigation** | Deterministic PermissionEngine + PrivilegeBroker; no raw shell; structured tool schemas; approval policies for risk ≥ 2 |
| **Residual** | User may still approve a dangerous scoped action |

### T02 — Malicious or buggy agent

| | |
|---|---|
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation** | Manifest validation; deny-by-default permissions; workspace sandbox; process isolation; untrusted plugin status |
| **Residual** | Bugs inside granted scope |

### T03 — Compromised plugin

| | |
|---|---|
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation** | Hash/publisher checks; UNTRUSTED default; no inherited permissions; future signatures |
| **Residual** | User-approved malicious plugin within its grants |

### T04 — Stolen `avalon_core.db` file

| | |
|---|---|
| **Likelihood** | Medium |
| **Impact** | Critical if plaintext |
| **Mitigation** | SQLCipher or AES-256-GCM sealed DB; DB key from vault/KEK; automated plaintext-absence tests |
| **Residual** | Offline brute force against wrapped keys if DPAPI/user secret weak |

### T05 — Local unprivileged malware (same user)

| | |
|---|---|
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation** | DPAPI user-scope; ACL on secure store; secrets not in UI; short-lived IPC tokens; minimal secret lifetime |
| **Residual** | Same-user malware can often abuse user DPAPI / inject into processes — **not fully preventable** |

### T06 — Administrator / kernel compromise

| | |
|---|---|
| **Likelihood** | Low–Medium |
| **Impact** | Critical |
| **Mitigation** | Defense in depth reduces casual access; **no claim of protection** against full admin/kernel malware |
| **Residual** | Full compromise possible |

### T07 — Disk theft

| | |
|---|---|
| **Likelihood** | Low–Medium |
| **Impact** | High |
| **Mitigation** | Encrypted DB + vault; root key bound to Windows user via DPAPI; recovery docs explain account-binding limits |
| **Residual** | If attacker also has user credentials / DPAPI backup, data recoverable |

### T08 — Credential / secret theft via logs or UI

| | |
|---|---|
| **Likelihood** | Medium without controls |
| **Impact** | Critical |
| **Mitigation** | Secret wrappers; no secret logging; frontend receives only `secret_id` metadata; export filters |
| **Residual** | Memory scraping by privileged malware |

### T09 — Network interception

| | |
|---|---|
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Mitigation** | TLS to external APIs via broker; offline lock; allowlists; prefer provider broker over handing raw keys to agents |
| **Residual** | Compromised CA / endpoint still possible |

### T10 — Supply-chain package attack

| | |
|---|---|
| **Likelihood** | Medium |
| **Impact** | Critical |
| **Mitigation** | Lockfiles; pin majors; prefer mature crates; SBOM generation; dependency review docs |
| **Residual** | Compromised popular package may still enter before detection |

### T11 — Privilege escalation via agent-requested shell

| | |
|---|---|
| **Likelihood** | High if API existed |
| **Impact** | Critical |
| **Mitigation** | **No** raw admin shell APIs; typed PrivilegeBroker ops only; adversarial tests |
| **Residual** | New typed op bugs — mitigate with schema validation + audit |

### T12 — Path traversal / workspace escape

| | |
|---|---|
| **Likelihood** | Medium |
| **Impact** | High |
| **Mitigation** | Canonical path checks; explicit external FS permissions; security tests |
| **Residual** | OS symlink races — reduce with careful open flags where available |

### T13 — Audit log tampering

| | |
|---|---|
| **Likelihood** | Medium |
| **Impact** | Medium (evidence integrity) |
| **Mitigation** | Hash-chained ledger; startup verification; fail-closed on privileged ops if audit critical failure |
| **Residual** | Local admin can delete files; presented as **tamper-evident**, not tamper-proof |

### T14 — Silent insecure update

| | |
|---|---|
| **Likelihood** | Medium if naive updater |
| **Impact** | Critical |
| **Mitigation** | V1 updater disabled/manual; future signed manifests required |
| **Residual** | User-installed unsigned package |

---

## 4. Security Status Semantics

UI may show: `SECURE` | `DEGRADED` | `LOCKED` | `COMPROMISED_SUSPECTED` | `UNKNOWN`.

`SECURE` requires healthy vault, DB encryption active, permission engine online, audit chain valid — **not** mere process start.

---

## 5. Explicit Non-Goals

- Protecting secrets from a fully compromised Windows administrator or kernel-mode malware  
- Mathematical impossibility of audit deletion on a controlled disk  
- Presenting base64/XOR/hidden files as cryptography  

---

## 6. Review Cadence

Full trust-boundary review after Phase 10 → `docs/SECURITY_REVIEW_1.md` before expanding LLM/UI feature surface.
