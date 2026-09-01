$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runDir = Join-Path $root ".run"

function Stop-FromPidFile($path) {
  if (Test-Path $path) {
    $pid = Get-Content $path
    if ($pid) {
      $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
      if ($process) {
        Stop-Process -Id $pid
        Write-Host "Stopped process $pid"
      }
    }
    Remove-Item $path -Force
  }
}

Stop-FromPidFile (Join-Path $runDir "backend.pid")
Stop-FromPidFile (Join-Path $runDir "frontend.pid")

Write-Host "Stop script completed."
