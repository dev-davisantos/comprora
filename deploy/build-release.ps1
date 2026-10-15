$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$releaseDirectory = Join-Path $repositoryRoot 'release'
$runtimeCacheDirectory = Join-Path $releaseDirectory '.cache'
$packageName = 'Sistema-de-Compras-Setup-win-x64.zip'
$temporaryRoot = Join-Path $env:TEMP ("sistema-compras-release-" + [guid]::NewGuid())
$packageDirectory = Join-Path $temporaryRoot 'package'
$appDirectory = Join-Path $packageDirectory 'app'
$backendDirectory = Join-Path $appDirectory 'backend'
$frontendDirectory = Join-Path $appDirectory 'frontend'
$runtimeDirectory = Join-Path $appDirectory 'runtime'
$nodeVersion = 'v24.21.0'
$nodeArchive = Join-Path $runtimeCacheDirectory "node-$nodeVersion-win-x64.zip"
$nodeExtractDirectory = Join-Path $temporaryRoot 'node-runtime'
$nodeDownloadUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"

function Invoke-NpmBuild {
  param(
    [Parameter(Mandatory = $true)][string]$WorkingDirectory
  )

  Push-Location $WorkingDirectory
  try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
      throw "Build failed in $WorkingDirectory (exit code $LASTEXITCODE)."
    }
  } finally {
    Pop-Location
  }
}

try {
  if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'Node.js/npm are required on the build machine. Install Node.js 24 or later, then retry.'
  }

  New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $runtimeCacheDirectory -Force | Out-Null
  New-Item -ItemType Directory -Path $backendDirectory, $frontendDirectory, $runtimeDirectory -Force | Out-Null

  Write-Host 'Building the frontend...'
  Invoke-NpmBuild -WorkingDirectory (Join-Path $repositoryRoot 'frontend')

  Write-Host 'Building the backend...'
  Invoke-NpmBuild -WorkingDirectory (Join-Path $repositoryRoot 'backend')

  $nodeDistribution = Join-Path $nodeExtractDirectory "node-$nodeVersion-win-x64"
  $nodeExecutable = Join-Path $nodeDistribution 'node.exe'
  $npmCli = Join-Path $nodeDistribution 'node_modules\npm\bin\npm-cli.js'
  $nodeLicense = Join-Path $nodeDistribution 'LICENSE'
  if (-not (Test-Path $nodeArchive)) {
    Write-Host "Downloading the portable Node.js $nodeVersion runtime..."
    Invoke-WebRequest -Uri $nodeDownloadUrl -OutFile $nodeArchive
  }
  if (-not (Test-Path $nodeExecutable)) {
    Expand-Archive -LiteralPath $nodeArchive -DestinationPath $nodeExtractDirectory
  }

  if (
    -not (Test-Path $nodeExecutable) -or
    -not (Test-Path $npmCli) -or
    -not (Test-Path $nodeLicense)
  ) {
    throw "Could not prepare the portable Node.js $nodeVersion runtime."
  }

  Copy-Item -Path (Join-Path $repositoryRoot 'backend\package.json') -Destination $backendDirectory
  Copy-Item -Path (Join-Path $repositoryRoot 'backend\package-lock.json') -Destination $backendDirectory
  Copy-Item -Path (Join-Path $repositoryRoot 'backend\dist') -Destination $backendDirectory -Recurse
  Copy-Item -Path (Join-Path $repositoryRoot 'frontend\dist') -Destination $frontendDirectory -Recurse
  Copy-Item -Path $nodeExecutable -Destination $runtimeDirectory
  Copy-Item -Path $nodeLicense -Destination $runtimeDirectory
  Get-ChildItem -Path $nodeDistribution -Filter '*.dll' | Copy-Item -Destination $runtimeDirectory
  Copy-Item -Path (Join-Path $PSScriptRoot 'run.bat') -Destination $appDirectory
  Copy-Item -Path (Join-Path $PSScriptRoot 'install.bat') -Destination $packageDirectory

  Write-Host 'Installing production backend dependencies with the bundled Node.js runtime...'
  Push-Location $backendDirectory
  try {
    & $nodeExecutable $npmCli ci --omit=dev
    if ($LASTEXITCODE -ne 0) {
      throw "Production dependency installation failed (exit code $LASTEXITCODE)."
    }
  } finally {
    Pop-Location
  }

  $sqliteNativeAddon = Join-Path $backendDirectory 'node_modules\sqlite3\build\Release\node_sqlite3.node'
  if (-not (Test-Path $sqliteNativeAddon)) {
    throw 'The SQLite native addon was not built. Confirm sqlite3 is allowed to run its install script.'
  }

  New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
  $packageArchive = Join-Path $releaseDirectory $packageName
  if (Test-Path $packageArchive) {
    Remove-Item -LiteralPath $packageArchive -Force
  }

  Write-Host 'Creating the Windows installation package...'
  if (-not (Get-Command tar.exe -ErrorAction SilentlyContinue)) {
    throw 'Windows tar.exe is required to create the installation archive.'
  }
  & tar.exe -a -c -f $packageArchive -C $packageDirectory .
  if ($LASTEXITCODE -ne 0) {
    throw "Could not create the installation archive (exit code $LASTEXITCODE)."
  }
  Write-Host "Installation package created: $packageArchive"
} finally {
  if (Test-Path $temporaryRoot) {
    Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
  }
}
