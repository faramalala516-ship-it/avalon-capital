param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("nsis", "msi")]
  [string]$PackageType,

  [string]$ReleaseDir = "release",
  [int]$LaunchWaitSeconds = 15
)

$ErrorActionPreference = "Stop"
$ReleaseDir = (Resolve-Path $ReleaseDir).Path
$DataDir = Join-Path $env:LOCALAPPDATA "Avalon Capital\Agentique Platform"
$ReportDir = Join-Path $PWD "install-test-results"
$ReportPath = Join-Path $ReportDir "$PackageType.json"
New-Item -ItemType Directory -Force $ReportDir | Out-Null

function Find-AvalonUninstallEntry {
  $roots = @(
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
  )
  foreach ($root in $roots) {
    $entry = Get-ItemProperty $root -ErrorAction SilentlyContinue |
      Where-Object { $_.DisplayName -eq "Avalon Agentique Platform" } |
      Select-Object -First 1
    if ($entry) { return $entry }
  }
  return $null
}

function Resolve-InstalledExecutable($entry) {
  $candidates = @()
  if ($entry.InstallLocation) {
    $candidates += Get-ChildItem $entry.InstallLocation -Recurse -Filter "*.exe" -ErrorAction SilentlyContinue |
      Where-Object { -not $_.PSIsContainer }
  }
  if ($entry.DisplayIcon) {
    $iconPath = ($entry.DisplayIcon -replace '",\d+$', '"' -replace '^"|"$', "")
    if (Test-Path $iconPath) { $candidates += Get-Item $iconPath }
  }
  return $candidates |
    Where-Object {
      $_.Name -notmatch "uninstall|setup|webview" -and
      ($_.Name -match "avalon-desktop|Avalon Agentique Platform")
    } |
    Select-Object -First 1
}

if (Test-Path $DataDir) {
  Remove-Item -Recurse -Force $DataDir
}

$installer = if ($PackageType -eq "nsis") {
  Join-Path $ReleaseDir "Avalon-Agentique-Platform-Setup.exe"
} else {
  Join-Path $ReleaseDir "Avalon-Agentique-Platform.msi"
}
if (-not (Test-Path $installer)) {
  throw "Installer not found: $installer"
}

$installerHash = (Get-FileHash $installer -Algorithm SHA256).Hash.ToLower()
Write-Host "Testing $PackageType installer: $installer"
Write-Host "SHA256: $installerHash"

try {
  if ($PackageType -eq "nsis") {
    $install = Start-Process -FilePath $installer -ArgumentList "/S" -Wait -PassThru
  } else {
    $install = Start-Process -FilePath "msiexec.exe" `
      -ArgumentList "/i", "`"$installer`"", "/qn", "/norestart" `
      -Wait -PassThru
  }
} catch {
  Write-Error ($_ | Format-List * -Force | Out-String)
  throw
}
if ($install.ExitCode -ne 0) {
  throw "$PackageType installer exited $($install.ExitCode)"
}

$entry = Find-AvalonUninstallEntry
if (-not $entry) {
  throw "Avalon uninstall registry entry not found after installation"
}

$app = Resolve-InstalledExecutable $entry
if (-not $app) {
  throw "Installed Avalon desktop executable not found"
}
Write-Host "Installed executable: $($app.FullName)"

$process = Start-Process -FilePath $app.FullName -PassThru
Start-Sleep -Seconds $LaunchWaitSeconds
if ($process.HasExited) {
  throw "Avalon desktop exited during smoke launch with code $($process.ExitCode)"
}

$required = @(
  (Join-Path $DataDir "secure\root.key.sealed"),
  (Join-Path $DataDir "secure\vault.bin"),
  (Join-Path $DataDir "avalon_core.db"),
  (Join-Path $DataDir "identity.json"),
  (Join-Path $DataDir "logs\audit.jsonl")
)
foreach ($path in $required) {
  if (-not (Test-Path $path)) {
    throw "First-run artifact missing: $path"
  }
}

$dbBytes = [System.IO.File]::ReadAllBytes((Join-Path $DataDir "avalon_core.db"))
$sqliteHeader = [System.Text.Encoding]::ASCII.GetBytes("SQLite format 3")
$isPlaintextSqlite = $true
for ($i = 0; $i -lt $sqliteHeader.Length; $i++) {
  if ($dbBytes[$i] -ne $sqliteHeader[$i]) {
    $isPlaintextSqlite = $false
    break
  }
}
if ($isPlaintextSqlite) {
  throw "Installed avalon_core.db has a plaintext SQLite header"
}

Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
try { $process.WaitForExit(15000) } catch {}

# Auto-started agent daemons (Python) can outlive the desktop process — reclaim locks.
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object {
    $_.CommandLine -and (
      $_.CommandLine -match 'macro-x' -or
      $_.CommandLine -match 'AVALON_AGENT_ID' -or
      $_.CommandLine -match 'Avalon Capital\\Agentique Platform\\agents'
    )
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }
Get-Process -Name "avalon-desktop","python","python3","py" -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -and $_.Path -match 'Avalon|Python' } |
  Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

if ($PackageType -eq "msi") {
  if (-not $entry.PSChildName) { throw "MSI product code missing from uninstall registry" }
  $uninstall = Start-Process -FilePath "msiexec.exe" `
    -ArgumentList "/x", $entry.PSChildName, "/qn", "/norestart" `
    -Wait -PassThru
} else {
  $uninstallCommand = $entry.UninstallString
  if (-not $uninstallCommand) { throw "NSIS uninstall command missing" }
  $uninstaller = ($uninstallCommand -replace '^"|"$', "")
  $uninstall = Start-Process -FilePath $uninstaller -ArgumentList "/S" -Wait -PassThru
}
if ($uninstall.ExitCode -ne 0) {
  throw "$PackageType uninstaller exited $($uninstall.ExitCode)"
}

Start-Sleep -Seconds 3
if (Test-Path $app.FullName) {
  throw "Application executable remains after uninstall: $($app.FullName)"
}
if (-not (Test-Path $DataDir)) {
  throw "User data was unexpectedly deleted by uninstall"
}

$report = [ordered]@{
  package_type = $PackageType
  installer = [System.IO.Path]::GetFileName($installer)
  installer_sha256 = $installerHash
  install_exit_code = $install.ExitCode
  installed_executable = $app.FullName
  launch_alive_after_seconds = $LaunchWaitSeconds
  root_key_sealed = $true
  vault_created = $true
  database_plaintext_sqlite = $false
  audit_created = $true
  uninstall_exit_code = $uninstall.ExitCode
  executable_removed = $true
  user_data_retained = $true
  status = "PASS"
  tested_at_utc = [DateTime]::UtcNow.ToString("o")
}
$report | ConvertTo-Json | Set-Content $ReportPath
$report | Format-List

# CI cleanup only, after retention behavior was verified.
$removed = $false
for ($i = 0; $i -lt 8; $i++) {
  try {
    if (Test-Path $DataDir) {
      Remove-Item -Recurse -Force $DataDir -ErrorAction Stop
    }
    $removed = -not (Test-Path $DataDir)
    if ($removed) { break }
  } catch {
    Start-Sleep -Seconds 2
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -and $_.CommandLine -match 'macro-x' } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  }
}
if (-not $removed -and (Test-Path $DataDir)) {
  Write-Warning "DataDir cleanup deferred (locked); acceptance already PASS"
} else {
  Write-Host "DataDir cleaned"
}
Write-Host "ACCEPTANCE_TEST_A_PASS ($PackageType)"
