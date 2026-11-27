# ARVOKTA

Espacio de trabajo de **ARVOKTA**, empresa de tecnología que desarrolla
productos SaaS. El repositorio agrupa los productos de la empresa y el sistema
comercial interno.

## Productos

| Producto | Carpeta | Estado |
|---|---|---|
| **DOVEXO** | `products/dovexo/` | Producto comercial en producción; gestión para empresas de servicios técnicos. |
| **ARVOKTA Sales Agent** | `sales-agent/` | Sistema interno de prospección, investigación y CRM; en desarrollo por fases. |

## Estructura

```text
ARVOKTA/
├── products/
│   └── dovexo/                 # producto DOVEXO
│       ├── apps/web
│       ├── apps/api
│       ├── apps/mobile
│       ├── docs/
│       └── scripts/
├── sales-agent/                # sistema interno ARVOKTA Sales Agent
│   ├── frontend/
│   ├── backend/
│   ├── docs/
│   └── scripts/
├── docs/                       # documentación de empresa
├── .github/                    # CI de los productos
├── .opencode/                  # agentes, skills y comandos
├── AGENTS.md
└── package.json
```

## Estado

- **DOVEXO:** desplegado en Vercel y Neon. La fuente de verdad es
  [`products/dovexo/docs/PROJECT_STATUS.md`](products/dovexo/docs/PROJECT_STATUS.md).
- **Sales Agent:** Fase 0 (estructura y especificación) y Fase 1 (núcleo) en
  construcción. La fuente de verdad es
  [`sales-agent/docs/IMPLEMENTATION_STATUS.md`](sales-agent/docs/IMPLEMENTATION_STATUS.md).
- **Empresa:** [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## DOVEXO — inicio rápido

```powershell
cd products/dovexo/apps/web
pnpm install
pnpm dev

cd ../api
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

La verificación integral de DOVEXO se ejecuta desde la raíz:

```powershell
powershell -ExecutionPolicy Bypass -File products/dovexo/scripts/verify.ps1
```

## Sales Agent — inicio rápido

Se completa cuando el scaffold de la Fase 1 esté implementado. La
especificación está en
[`sales-agent/docs/SPEC.md`](sales-agent/docs/SPEC.md).

## Reglas

Leer [`AGENTS.md`](AGENTS.md) antes de trabajar. Cada producto tiene su propio
`AGENTS.md` y su propia documentación. No mezclar código, datos ni credenciales
entre productos.
