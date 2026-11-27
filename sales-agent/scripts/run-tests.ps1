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

Push-Location $backend
try {
    uv run ruff check .
    uv run ruff format --check .
    uv run pytest
}
finally {
    Pop-Location
}

Push-Location $frontend
try {
    pnpm typecheck
    pnpm test
    pnpm build
}
finally {
    Pop-Location
}

Write-Host "Tests del Sales Agent completados."
