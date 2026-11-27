$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $backend "pyproject.toml"))) {
    throw "No existe sales-agent/backend/pyproject.toml. Ejecutá primero el scaffold de la Fase 1."
}
if (-not (Test-Path (Join-Path $frontend "package.json"))) {
    throw "No existe sales-agent/frontend/package.json. Ejecutá primero el scaffold de la Fase 1."
}

$scripts = @(
    "start-backend.ps1",
    "start-frontend.ps1",
    "start-worker.ps1"
)

foreach ($script in $scripts) {
    $path = Join-Path $PSScriptRoot $script
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $path
    Write-Host "Abierto: $script"
    Start-Sleep -Milliseconds 700
}

Write-Host "API: http://localhost:8001"
Write-Host "Web: http://localhost:3001"
