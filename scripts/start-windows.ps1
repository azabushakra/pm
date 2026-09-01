$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runDir = Join-Path $root ".run"
New-Item -ItemType Directory -Path $runDir -Force | Out-Null

if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) {
  Write-Host "Port 8000 is already in use."
  exit 1
}
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
  Write-Host "Port 3000 is already in use."
  exit 1
}

$backendLog = Join-Path $runDir "backend.log"
$frontendLog = Join-Path $runDir "frontend.log"
$backendPidFile = Join-Path $runDir "backend.pid"
$frontendPidFile = Join-Path $runDir "frontend.pid"

$uvCmd = Get-Command uv -ErrorAction SilentlyContinue
if ($uvCmd) {
  $backendProcess = Start-Process -FilePath "uv" -ArgumentList "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -WorkingDirectory (Join-Path $root "backend") -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog -PassThru
} else {
  $backendProcess = Start-Process -FilePath "python" -ArgumentList "-m", "uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -WorkingDirectory (Join-Path $root "backend") -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog -PassThru
}
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000" -WorkingDirectory (Join-Path $root "frontend") -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendLog -PassThru

Set-Content -Path $backendPidFile -Value $backendProcess.Id
Set-Content -Path $frontendPidFile -Value $frontendProcess.Id

Write-Host "Started backend (PID $($backendProcess.Id)) and frontend (PID $($frontendProcess.Id))."
Write-Host "Logs: $backendLog and $frontendLog"
