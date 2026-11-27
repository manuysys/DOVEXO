# AGENTS.md — ARVOKTA

## Contexto

ARVOKTA es una empresa de tecnología que desarrolla productos SaaS. Este
repositorio es el espacio de trabajo de la empresa y contiene:

- `products/dovexo/`: DOVEXO, plataforma de gestión para empresas de servicios
  técnicos. Es el producto comercial actual.
- `sales-agent/`: ARVOKTA Sales Agent, sistema interno de prospección comercial,
  investigación de empresas y CRM. Está en desarrollo por fases.
- `docs/`: documentación de empresa, decisiones transversales y estado global.
- `.opencode/`: agentes, skills y comandos compartidos.
- `.github/`: CI de los productos.

La fuente de verdad de cada producto vive en su propia carpeta. No mezclar
código, datos, credenciales ni documentación entre productos.

## Reglas generales

- Leer el `AGENTS.md` y el estado del producto antes de trabajar en él:
  - DOVEXO: `products/dovexo/AGENTS.md`,
    `products/dovexo/docs/PROJECT_STATUS.md`.
  - Sales Agent: `sales-agent/AGENTS.md`,
    `sales-agent/docs/IMPLEMENTATION_STATUS.md`.
- No modificar DOVEXO desde una tarea del Sales Agent ni viceversa.
- No inventar estado: si una función no está implementada o una prueba no se
  ejecutó, decirlo.
- No guardar secretos en el repositorio. Usar `.env` local y `.env.example`.
- No contratar servicios, activar pruebas con tarjeta ni usar APIs pagas sin
  autorización explícita. El Sales Agent debe funcionar con fuentes gratuitas.
- Dinero con `Decimal`/`NUMERIC`, nunca `float`. Fechas en UTC y presentación en
  `America/Argentina/Buenos_Aires`.
- UI y documentación en español rioplatense; código y commits en inglés técnico.
- Commits pequeños y lógicos. No hacer `git push` sin revisar el diff.

## Subagentes

- Modelo obligatorio: `opencode-go/deepseek-v4.1-flash`, con `#high` para trabajo
  complejo, salvo que el usuario pida otro.
- El tech lead orquesta: define alcance, archivos disjuntos y contratos; revisa
  evidencia y resuelve conflictos. No implementa si puede delegar.
- Cada subagente debe indicar comandos ejecutados, salidas y capturas. Sin
  evidencia, el trabajo no se acepta.
- Antes de implementar, cargar la skill correspondiente: `project-context`,
  `backend-fastapi`, `frontend-nextjs`, `database-postgres`, `qa-verification`,
  `git-workflow`, etc.

## Comandos rápidos

DOVEXO (desde la raíz):

```powershell
cd products/dovexo/apps/api
uv run ruff check .
uv run basedpyright
uv run pytest

cd products/dovexo/apps/web
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Sales Agent (se completa cuando el scaffold esté creado):

```powershell
cd sales-agent/backend
uv sync
uv run alembic upgrade head
uv run pytest

cd sales-agent/frontend
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Verificación integral de DOVEXO:

```powershell
powershell -ExecutionPolicy Bypass -File products/dovexo/scripts/verify.ps1
```

## Estado y decisiones

- Estado global: `docs/PROJECT_STATUS.md`.
- Decisiones transversales: `docs/DECISIONS.md`.
- Cambios de empresa: `docs/CHANGELOG.md`.
- Estado de DOVEXO: `products/dovexo/docs/PROJECT_STATUS.md`.
- Estado del Sales Agent: `sales-agent/docs/IMPLEMENTATION_STATUS.md`.

## Regla de oro

Primero se comprueba que el flujo funciona de punta a punta; después se agrega
otra pantalla o módulo. Un producto no está terminado por compilar: necesita
persistencia, permisos, validaciones, pruebas y documentación.
