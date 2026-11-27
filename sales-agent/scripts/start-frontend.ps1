param(
    [int]$Port = 3001
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontend "package.json"))) {
    throw "No existe sales-agent/frontend/package.json. Ejecutá primero el scaffold de la Fase 1."
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw "No se encontró 'pnpm'. Instalá pnpm y volvé a intentar."
}

Push-Location $frontend
try {
    Write-Host "Iniciando frontend en http://localhost:$Port ..."
    pnpm dev
}
finally {
    Pop-Location
}
