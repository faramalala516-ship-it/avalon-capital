# Install an Avalon agent package on Windows WITHOUT cargo.
# Copies the package into LocalAppData incoming drop, then tells you to click Install in the UI.
#
# Usage:
#   .\scripts\install-agent-windows.ps1
#   .\scripts\install-agent-windows.ps1 -SourceDir "agents\codex-drop\macro-x"
#   .\scripts\install-agent-windows.ps1 -SourceDir "C:\path\to\macro-x" -StartUi

param(
  [string]$SourceDir = "",
  [string]$AgentId = "macro-x",
  [switch]$StartUi
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

if ([string]::IsNullOrWhiteSpace($SourceDir)) {
  $SourceDir = Join-Path $Root "agents\codex-drop\macro-x"
}
$SourceDir = (Resolve-Path $SourceDir).Path
$manifest = Join-Path $SourceDir "avalon-agent.json"
if (-not (Test-Path $manifest)) {
  throw "avalon-agent.json manquant dans $SourceDir"
}

$incoming = Join-Path $env:LOCALAPPDATA "Avalon Capital\Agentique Platform\agents\incoming\$AgentId"
if (Test-Path $incoming) {
  Remove-Item -Recurse -Force $incoming
}
New-Item -ItemType Directory -Force -Path $incoming | Out-Null

Write-Host "Copie $SourceDir -> $incoming"
Get-ChildItem $SourceDir -Recurse -File | Where-Object {
  $_.FullName -notmatch '\\.git\\' -and $_.Name -notmatch '\.pyc$' -and $_.FullName -notmatch '__pycache__'
} | ForEach-Object {
  $rel = $_.FullName.Substring($SourceDir.Length).TrimStart('\')
  $dest = Join-Path $incoming $rel
  New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
  Copy-Item $_.FullName $dest -Force
}

# Optional validate with Windows Python
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if ($py) {
  $validator = Join-Path $Root "scripts\validate-agent-package.py"
  if (Test-Path $validator) {
    Write-Host "Validation..."
    & $py.Source $validator $incoming
  }
}

Write-Host ""
Write-Host "OK — paquet prêt dans:"
Write-Host "  $incoming"
Write-Host ""
Write-Host "Ensuite:"
Write-Host "  1. Lance Avalon Agentique Platform (Centre de commande)"
Write-Host "  2. Menu Agents"
Write-Host "  3. Clique « Installer / mettre à jour » sur Macro-X"
Write-Host "  4. Clique « Démarrer »"
Write-Host ""
Write-Host "(Aucun cargo requis — l'UI appelle install_agent_preferred qui lit incoming/)"

if ($StartUi) {
  $exe = @(
    "${env:ProgramFiles}\Avalon Agentique Platform\avalon-desktop.exe",
    "${env:ProgramFiles}\Avalon Capital\Avalon Agentique Platform\Avalon Agentique Platform.exe"
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($exe) {
    Write-Host "Lancement $exe"
    Start-Process $exe
  } else {
    Write-Warning "Exécutable Avalon non trouvé — lance-le depuis le menu Démarrer."
  }
}
