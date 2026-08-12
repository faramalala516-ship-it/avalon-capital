# Avalon Agentique Platform — Authenticode signing (Windows)
#
# Signs staged release binaries with Avalon Capital's real code-signing certificate.
# NEVER fabricates certificates. When credentials are absent, exits 0 with SKIP
# unless -RequireSigning is set.
#
# Credential sources (first match wins):
#   1) -PfxPath + -PfxPassword parameters
#   2) Env AVALON_WINDOWS_CODESIGN_PFX_PATH + AVALON_WINDOWS_CODESIGN_PFX_PASSWORD
#   3) Env AVALON_WINDOWS_CODESIGN_PFX_BASE64 + AVALON_WINDOWS_CODESIGN_PFX_PASSWORD
#
# Optional:
#   AVALON_WINDOWS_CODESIGN_TIMESTAMP_URL  (default DigiCert)
#   AVALON_WINDOWS_CODESIGN_SUBJECT       (optional subject substring check)

param(
  [string]$ReleaseDir = "release",
  [string]$PfxPath = "",
  [string]$PfxPassword = "",
  [string]$TimestampUrl = "",
  [string]$SubjectContains = "",
  [switch]$RequireSigning,
  [switch]$VerifyOnly
)

$ErrorActionPreference = "Stop"

function Write-SignStatus {
  param([string]$Status, [string]$Detail)
  Write-Host ("[sign-windows] {0}: {1}" -f $Status, $Detail)
}

function Find-SignTool {
  $roots = @(
    "${env:ProgramFiles(x86)}\Windows Kits\10\bin",
    "${env:ProgramFiles}\Windows Kits\10\bin"
  )
  foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    $candidate = Get-ChildItem -Path $root -Recurse -Filter signtool.exe -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match '\\x64\\signtool\.exe$' } |
      Sort-Object FullName -Descending |
      Select-Object -First 1
    if ($candidate) { return $candidate.FullName }
  }
  $cmd = Get-Command signtool.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Resolve-Credentials {
  param(
    [string]$PfxPathIn,
    [string]$PfxPasswordIn
  )

  $password = $PfxPasswordIn
  if ([string]::IsNullOrWhiteSpace($password)) {
    $password = $env:AVALON_WINDOWS_CODESIGN_PFX_PASSWORD
  }

  $path = $PfxPathIn
  if ([string]::IsNullOrWhiteSpace($path)) {
    $path = $env:AVALON_WINDOWS_CODESIGN_PFX_PATH
  }

  $tempPfx = $null
  if ([string]::IsNullOrWhiteSpace($path) -and -not [string]::IsNullOrWhiteSpace($env:AVALON_WINDOWS_CODESIGN_PFX_BASE64)) {
    $tempPfx = Join-Path $env:TEMP ("avalon-codesign-" + [guid]::NewGuid().ToString("N") + ".pfx")
    $bytes = [Convert]::FromBase64String($env:AVALON_WINDOWS_CODESIGN_PFX_BASE64.Trim())
    [IO.File]::WriteAllBytes($tempPfx, $bytes)
    $path = $tempPfx
  }

  $present = (-not [string]::IsNullOrWhiteSpace($path)) -and (-not [string]::IsNullOrWhiteSpace($password))
  return [pscustomobject]@{
    Present = $present
    PfxPath = $path
    Password = $password
    TempPfx = $tempPfx
  }
}

function Get-SignTargets {
  param([string]$Dir)
  $names = @(
    "Avalon-Agentique-Platform-Setup.exe",
    "Avalon-Agentique-Platform.msi",
    "avalon-desktop.exe",
    "avalon-core.exe"
  )
  $targets = @()
  foreach ($name in $names) {
    $full = Join-Path $Dir $name
    if (Test-Path $full) { $targets += (Get-Item $full) }
  }
  # Also sign any remaining staged Setup/MSI variants (Tauri original names)
  Get-ChildItem -Path $Dir -File -ErrorAction SilentlyContinue |
    Where-Object {
      ($_.Extension -in ".exe", ".msi") -and
      ($targets.FullName -notcontains $_.FullName) -and
      (
        $_.Name -match '-setup\.exe$' -or
        $_.Name -match 'Setup\.exe$' -or
        $_.Extension -eq ".msi"
      )
    } | ForEach-Object { $targets += $_ }
  return $targets
}

function Test-FileSignature {
  param(
    [System.IO.FileInfo]$File,
    [string]$SubjectContains
  )
  $sig = Get-AuthenticodeSignature -FilePath $File.FullName
  $ok = $sig.Status -eq "Valid"
  $subject = ""
  if ($sig.SignerCertificate) {
    $subject = $sig.SignerCertificate.Subject
  }
  if ($ok -and -not [string]::IsNullOrWhiteSpace($SubjectContains)) {
    if ($subject -notlike "*$SubjectContains*") {
      $ok = $false
    }
  }
  return [pscustomobject]@{
    File = $File.Name
    Status = [string]$sig.Status
    StatusMessage = $sig.StatusMessage
    Subject = $subject
    Thumbprint = if ($sig.SignerCertificate) { $sig.SignerCertificate.Thumbprint } else { "" }
    Ok = $ok
  }
}

if (-not (Test-Path $ReleaseDir)) {
  throw "ReleaseDir not found: $ReleaseDir"
}

$subjectHint = $SubjectContains
if ([string]::IsNullOrWhiteSpace($subjectHint)) {
  $subjectHint = $env:AVALON_WINDOWS_CODESIGN_SUBJECT
}

$ts = $TimestampUrl
if ([string]::IsNullOrWhiteSpace($ts)) {
  $ts = $env:AVALON_WINDOWS_CODESIGN_TIMESTAMP_URL
}
if ([string]::IsNullOrWhiteSpace($ts)) {
  $ts = "http://timestamp.digicert.com"
}

$reportDir = Join-Path $ReleaseDir "signing"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$reportPath = Join-Path $reportDir "report.json"
$targets = @(Get-SignTargets -Dir $ReleaseDir)

if ($targets.Count -eq 0) {
  throw "No signable EXE/MSI artifacts found in $ReleaseDir"
}

if ($VerifyOnly) {
  $results = @()
  $allOk = $true
  foreach ($t in $targets) {
    $r = Test-FileSignature -File $t -SubjectContains $subjectHint
    $results += $r
    if (-not $r.Ok) { $allOk = $false }
    Write-SignStatus "VERIFY" ("{0} => {1}" -f $r.File, $r.Status)
  }
  $report = @{
    mode = "verify-only"
    signed = $allOk
    timestamp_url = $ts
    results = $results
  }
  $report | ConvertTo-Json -Depth 6 | Set-Content -Path $reportPath -Encoding utf8
  if (-not $allOk) { throw "Authenticode verification failed — see $reportPath" }
  Write-SignStatus "PASS" "All staged artifacts have Valid Authenticode signatures"
  return
}

$creds = Resolve-Credentials -PfxPathIn $PfxPath -PfxPasswordIn $PfxPassword
try {
  if (-not $creds.Present) {
    $msg = "No Avalon code-signing secrets present (PFX + password). Skipping Authenticode."
    if ($RequireSigning) {
      throw $msg
    }
    Write-SignStatus "SKIP" $msg
    $report = @{
      mode = "sign"
      signed = $false
      skipped = $true
      reason = "missing_secrets"
      targets = @($targets | ForEach-Object { $_.Name })
    }
    $report | ConvertTo-Json -Depth 6 | Set-Content -Path $reportPath -Encoding utf8
    # Marker for CI / manifest writers
    Set-Content -Path (Join-Path $reportDir "status.txt") -Value "SKIP" -NoNewline
    return
  }

  $signtool = Find-SignTool
  if (-not $signtool) {
    throw "signtool.exe not found. Install Windows SDK Signing Tools on this host."
  }
  Write-SignStatus "TOOL" $signtool

  if (-not (Test-Path $creds.PfxPath)) {
    throw "PFX file not found: $($creds.PfxPath)"
  }

  $signResults = @()
  foreach ($t in $targets) {
    Write-SignStatus "SIGN" $t.Name
    $args = @(
      "sign",
      "/fd", "SHA256",
      "/td", "SHA256",
      "/tr", $ts,
      "/f", $creds.PfxPath,
      "/p", $creds.Password,
      "/d", "Avalon Agentique Platform",
      $t.FullName
    )
    & $signtool @args
    if ($LASTEXITCODE -ne 0) {
      throw "signtool failed for $($t.Name) with exit code $LASTEXITCODE"
    }
    $vr = Test-FileSignature -File $t -SubjectContains $subjectHint
    $signResults += $vr
    if (-not $vr.Ok) {
      throw "Post-sign verification failed for $($t.Name): $($vr.Status) $($vr.StatusMessage)"
    }
    Write-SignStatus "OK" ("{0} subject={1}" -f $t.Name, $vr.Subject)
  }

  $report = @{
    mode = "sign"
    signed = $true
    skipped = $false
    timestamp_url = $ts
    signtool = $signtool
    results = $signResults
  }
  $report | ConvertTo-Json -Depth 6 | Set-Content -Path $reportPath -Encoding utf8
  Set-Content -Path (Join-Path $reportDir "status.txt") -Value "SIGNED" -NoNewline
  Write-SignStatus "PASS" ("Signed {0} artifact(s)" -f $signResults.Count)
}
finally {
  if ($creds.TempPfx -and (Test-Path $creds.TempPfx)) {
    Remove-Item -Force $creds.TempPfx -ErrorAction SilentlyContinue
  }
}
