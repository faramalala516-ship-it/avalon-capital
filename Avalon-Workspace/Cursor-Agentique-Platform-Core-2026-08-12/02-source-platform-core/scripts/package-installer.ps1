# Package Avalon installers into release/ (assumes tauri build already ran or runs it)
param(
  [switch]$Build
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

if ($Build) {
  & "$PSScriptRoot\build.ps1" -Installer
} else {
  New-Item -ItemType Directory -Force release, release/checksums | Out-Null
  $found = $false
  foreach ($bundle in @("target/release/bundle", "apps/desktop/src-tauri/target/release/bundle")) {
    if (-not (Test-Path $bundle)) { continue }
    $found = $true
    Get-ChildItem -Path $bundle -Recurse -File -Include *.exe, *.msi | ForEach-Object {
      Copy-Item $_.FullName ("release/" + $_.Name) -Force
    }
  }
  if (-not $found) { throw "Bundle not found — run build.ps1 -Installer first" }
  $nsis = Get-ChildItem release -File -Filter "*-setup.exe" | Select-Object -First 1
  if ($nsis) { Copy-Item $nsis.FullName "release/Avalon-Agentique-Platform-Setup.exe" -Force }
  $msi = Get-ChildItem release -File -Filter "*.msi" | Select-Object -First 1
  if ($msi) { Copy-Item $msi.FullName "release/Avalon-Agentique-Platform.msi" -Force }
  Write-Host "Packaged into release/"
}
