param(
    [int]$Port = 8001
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"

if (-not (Test-Path (Join-Path $backend "pyproject.toml"))) {
    throw "No existe sales-agent/backend/pyproject.toml. Ejecutá primero el scaffold de la Fase 1."
}
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    throw "No se encontró 'uv'. Instalá uv y volvé a intentar."
}

Push-Location $backend
try {
    Write-Host "Iniciando API en http://localhost:$Port ..."
    uv run uvicorn app.main:app --reload --port $Port
}
finally {
    Pop-Location
}
