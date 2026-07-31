# Avalon Agentique Platform — Windows build script
param(
  [switch]$Dev,
  [switch]$Test,
  [switch]$Release,
  [switch]$Installer
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if ($Dev) {
  cargo run -p avalon-kernel -- --dev serve
}
if ($Test) {
  cargo test --workspace --exclude avalon-desktop
  cargo test -p avalon-kernel --test acceptance_security
}
if ($Release) {
  cargo build -p avalon-kernel --release
  Push-Location apps/desktop
  npm ci
  npm run build
  # Requires WebView2 + Tauri Windows toolchain:
  # npx tauri build
  Pop-Location
  New-Item -ItemType Directory -Force release, release/checksums | Out-Null
  Copy-Item target/release/avalon-core.exe release/ -ErrorAction SilentlyContinue
  "0.1.0" | Set-Content release/version.txt
}
if ($Installer) {
  Write-Host "Run NSIS/WiX via tauri build on Windows: cd apps/desktop; npx tauri build"
  Write-Host "Outputs expected: release/Avalon-Agentique-Platform-Setup.exe and .msi"
}
