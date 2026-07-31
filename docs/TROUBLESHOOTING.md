# Troubleshooting

| Symptom | Check |
|---|---|
| Vault locked | Root key provider / profile |
| DB won't open | Wrong machine key / corrupt seal |
| Agent FAILED | Logs + restart; Core should stay up |
| Network denied | Mode OFFLINE_LOCK or allowlist |
| API 401 | `x-avalon-token` / `api.token` file |
| SAFE MODE | Audit chain integrity |
