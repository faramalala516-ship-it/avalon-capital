# Avalon Agentique Platform — Windows build / package script
param(
  [switch]$Dev,
  [switch]$Test,
  [switch]$Release,
  [switch]$Installer,
  [switch]$SkipWebViewBootstrap,
  [switch]$Sign,
  [switch]$RequireSigning
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Ensure-WebView2 {
  if ($SkipWebViewBootstrap) {
    Write-Host "Skipping WebView2 bootstrap (-SkipWebViewBootstrap)"
    return
  }
  $marker = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
  if (Test-Path $marker) {
    Write-Host "WebView2 runtime appears installed"
    return
  }
  Write-Host "Bootstrapping WebView2 Evergreen Runtime (offline-capable after cache)..."
  $bootstrap = Join-Path $env:TEMP "MicrosoftEdgeWebview2Setup.exe"
  Invoke-WebRequest -Uri "https://go.microsoft.com/fwlink/p/?LinkId=2124703" -OutFile $bootstrap
  Start-Process -FilePath $bootstrap -ArgumentList "/silent", "/install" -Wait -NoNewWindow
}

if ($Dev) {
  cargo run -p avalon-kernel -- --dev serve
}

if ($Test) {
  cargo test --workspace --exclude avalon-desktop
  cargo test -p avalon-kernel --test acceptance_security
  $tmp = New-Item -ItemType Directory -Force -Path (Join-Path $env:TEMP ("avalon-selftest-" + [guid]::NewGuid()))
  cargo run -p avalon-kernel -- --data-dir $tmp.FullName self-test
}

if ($Release -or $Installer) {
  Ensure-WebView2
  cargo build -p avalon-kernel --release

  Push-Location apps/desktop
  if (-not (Test-Path node_modules)) { npm ci }
  npm run build
  if ($Installer) {
    npm exec -- tauri build
  }
  Pop-Location

  New-Item -ItemType Directory -Force release, release/checksums | Out-Null
  if (Test-Path target/release/avalon-core.exe) {
    Copy-Item target/release/avalon-core.exe release/ -Force
  }

  $bundleCandidates = @(
    "target/release/bundle",
    "apps/desktop/src-tauri/target/release/bundle"
  )
  foreach ($bundle in $bundleCandidates) {
    if (-not (Test-Path $bundle)) { continue }
    Get-ChildItem -Path $bundle -Recurse -File -Include *.exe, *.msi -ErrorAction SilentlyContinue | ForEach-Object {
      Copy-Item $_.FullName ("release/" + $_.Name) -Force
      Write-Host "Staged $($_.Name)"
    }
  }
  $nsis = Get-ChildItem release -File -Filter "*-setup.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $nsis) { $nsis = Get-ChildItem release -File -Filter "*Setup*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 }
  if ($nsis) { Copy-Item $nsis.FullName "release/Avalon-Agentique-Platform-Setup.exe" -Force }
  $msi = Get-ChildItem release -File -Filter "*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($msi) { Copy-Item $msi.FullName "release/Avalon-Agentique-Platform.msi" -Force }

  $signed = $false
  if ($Sign -or $RequireSigning) {
    $signArgs = @{ ReleaseDir = "release" }
    if ($RequireSigning) { $signArgs.RequireSigning = $true }
    & "$PSScriptRoot\sign-windows.ps1" @signArgs
    $statusFile = "release/signing/status.txt"
    if ((Test-Path $statusFile) -and ((Get-Content $statusFile -Raw).Trim() -eq "SIGNED")) {
      $signed = $true
      & "$PSScriptRoot\sign-windows.ps1" -ReleaseDir release -VerifyOnly
    }
  }

  $channel = if ($signed) { "SIGNED" } else { "DEV" }
  $signing = if ($signed) { "authenticode" } else { "unsigned" }
  "0.1.0" | Set-Content release/version.txt -NoNewline
  $manifest = @{
    product = "Avalon Agentique Platform"
    version = "0.1.0"
    channel = $channel
    signed = $signed
    signing = $signing
    note = "Production signing requires Avalon Capital Authenticode secrets — never fabricate certificates"
  } | ConvertTo-Json
  Set-Content -Path release/manifest.json -Value $manifest

  if (Test-Path release/checksums/SHA256SUMS) { Remove-Item release/checksums/SHA256SUMS }
  Get-ChildItem release -File | ForEach-Object {
    $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower()
    "$hash  $($_.Name)" | Add-Content release/checksums/SHA256SUMS
  }

  Write-Host "Release folder (signed=$signed channel=$channel):"
  Get-ChildItem release -Recurse | Format-Table Name, Length
}

Write-Host "Done."
