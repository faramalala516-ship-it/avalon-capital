# Package an Avalon agent directory into release/agents/<id>-<version>.avalon-agent.zip
param(
  [Parameter(Mandatory = $true)][string]$SourceDir
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Src = Resolve-Path $SourceDir
$manifestPath = Join-Path $Src "avalon-agent.json"
if (-not (Test-Path $manifestPath)) { throw "avalon-agent.json missing in $Src" }
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$outDir = Join-Path $Root "release/agents"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$stage = Join-Path $env:TEMP ("avalon-agent-pkg-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path (Join-Path $stage "package") | Out-Null
Get-ChildItem $Src -Recurse -File | Where-Object {
  $_.FullName -notmatch '\\.git\\' -and $_.Name -notmatch '\.pyc$' -and $_.FullName -notmatch '__pycache__'
} | ForEach-Object {
  $rel = $_.FullName.Substring($Src.Path.Length).TrimStart('\', '/')
  $dest = Join-Path $stage "package" $rel
  New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
  Copy-Item $_.FullName $dest -Force
}
$hashes = @()
Get-ChildItem (Join-Path $stage "package") -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring((Join-Path $stage "package").Length).TrimStart('\', '/').Replace('\', '/')
  if ($rel -eq "HASHES.sha256") { return }
  $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower()
  $hashes += "$hash  $rel"
}
$hashes | Set-Content (Join-Path $stage "package/HASHES.sha256")
$bundle = Join-Path $outDir ("{0}-{1}.avalon-agent.zip" -f $manifest.agent_id, $manifest.version)
if (Test-Path $bundle) { Remove-Item $bundle -Force }
Compress-Archive -Path (Join-Path $stage "package\*") -DestinationPath $bundle
Remove-Item $stage -Recurse -Force
Write-Host "Packed $bundle"
