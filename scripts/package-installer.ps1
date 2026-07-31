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
  $bundle = "apps/desktop/src-tauri/target/release/bundle"
  if (-not (Test-Path $bundle)) {
    throw "Bundle not found at $bundle — run build.ps1 -Installer first"
  }
  Get-ChildItem -Recurse $bundle -Include *.exe, *.msi | ForEach-Object {
    Copy-Item $_.FullName ("release/" + $_.Name) -Force
  }
  $nsis = Get-ChildItem release -Filter "*Setup*.exe" | Select-Object -First 1
  if ($nsis) { Copy-Item $nsis.FullName "release/Avalon-Agentique-Platform-Setup.exe" -Force }
  $msi = Get-ChildItem release -Filter "*.msi" | Select-Object -First 1
  if ($msi) { Copy-Item $msi.FullName "release/Avalon-Agentique-Platform.msi" -Force }
  Write-Host "Packaged into release/"
}
