# Bootstrap Codex/dev on Windows inside avalon-capital (root = Cargo.toml).
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "== Avalon Codex setup (Windows) =="
Write-Host "repo: $Root"

if (-not (Test-Path (Join-Path $Root "Cargo.toml"))) {
  throw "Cargo.toml introuvable. Ouvre avalon-capital, pas un dossier AGENTIQUE isolé."
}

$sdk = Join-Path $Root "packages\python-sdk"
Write-Host "-- Python SDK --"
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { throw "Python introuvable (python ou py)." }
& $py.Source -m pip install -e $sdk -q
& $py.Source -c "from avalon_agent_sdk import AvalonAgentClient; print('avalon_agent_sdk OK')"

Write-Host "-- Validate Macro-X package --"
& $py.Source (Join-Path $Root "scripts\validate-agent-package.py") (Join-Path $Root "agents\codex-drop\macro-x")

if (Get-Command cargo -ErrorAction SilentlyContinue) {
  Write-Host "-- cargo available --"
  Write-Host "Install: cargo run -p avalon-kernel -- agents install agents/codex-drop/macro-x"
} else {
  Write-Host "WARN: cargo absent — utilise scripts/install-agent-windows.ps1 (copie incoming + UI)"
}

Write-Host "DONE. Voir CODEX.md"
