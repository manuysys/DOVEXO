# Demo readiness — auditoría funcional

**Fecha:** 2026-11-23
**Alcance:** verificar qué falta para mostrar el producto sin prometer funciones que
no están operativas. No reemplaza `PROJECT_STATUS.md` ni `KNOWN_ISSUES.md`.

## Lo que ya funciona de punta a punta

- Registro, login, refresh rotativo y logout; cookies HttpOnly.
- Multi-tenant por `X-Tenant-ID` validado contra membresía.
- Clientes, solicitudes, órdenes, transiciones y auditoría.
- Presupuestos con ítems históricos, PDF, link público y aprobación/rechazo.
- Agenda, conflictos, reprogramación y asignación de técnicos.
- Pagos manuales, parciales, anulación y recálculo de estado.
- Dashboard operativo: turnos, atrasadas, sin técnico, presupuestos por vencer y saldos.
- PWA del técnico y app Expo: órdenes, transiciones, notas, materiales, fotos, offline.
- Portal del cliente con acceso por token, resumen, órdenes, presupuestos y pagos.
- Automatizaciones, notificaciones, asistente de IA, planes y panel global.
- Importador CSV/XLSX con preview, duplicados y `errors.csv`.
- Onboarding de cuatro pasos y reset del tenant demo.
- **Nuevo:** botón “Reiniciar demo” en `/admin` para platform admins; llama al
  endpoint existente, conserva `audit_logs` y no toca otros tenants.

## P0 — bloquea una demo pública confiable

| Punto | Estado real | Acción |
|---|---|---|
| Backups | El workflow existe, pero falta `NEON_DATABASE_URL`; no hay backup restaurado | Configurar el secreto y verificar una restauración |
| Email | Sin dominio Resend verificado, el provider es `console`; los links del portal se copian a mano | Verificar dominio y configurar `EMAIL_FROM` |
| WhatsApp | Sin `WHATSAPP_APP_SECRET` el webhook responde 503; no hay número de Meta | No mostrarlo como “listo” hasta probarlo end-to-end |
| Cobros online | No hay Mercado Pago ni webhooks; solo pagos manuales | Mostrar “cobros manuales” o dejar la integración fuera del demo |
| APK | El APK v7 release local (95 MB, debug-signed) se instaló en el teléfono y abrió el welcome; el deep link `/tech` mostró el login. MIUI bloquea la inyección de taps por ADB (`INJECT_EVENTS`) | Habilitar “Depuración USB (Ajustes de seguridad)” o recorrer técnico/cliente/fotos/offline a mano |
| E2E | La suite es unitaria/integración; no hay Playwright E2E del flujo completo | Agregar smoke de registro → orden → presupuesto → aprobación → portal |
| Demo reset | El endpoint y la UI existen; la UI no tiene E2E | Probar con un platform admin antes de la demo |

## P1 — deuda de producto que no bloquea el demo

- Enforcement completo de límites por plan en todos los endpoints.
- `revoke_refresh_token` (logout) sin lock; falta test de reuso fuera de la
  ventana de gracia de 10 s.
- `import_jobs` guarda datos personales sin política de retención ni endpoint de
  borrado.
- Fotos de técnicos en `BYTEA`; migrar a S3 en producción.
- Sin RLS, 2FA ni recuperación de contraseña por email.
- Recordatorios automáticos programados y cobros reales.
- Webhook de WhatsApp con un secreto global; evaluar secreto por tenant.
- Rate limiting en PostgreSQL con fallback en memoria; evaluar Redis/WAF.

## Verificación ejecutada (2026-11-23)

```text
Backend
  uv run ruff check .              -> All checks passed
  uv run ruff format --check .     -> 160 files already formatted
  uv run basedpyright              -> 0 errors, 0 warnings, 0 notes
  uv run pytest -q                 -> 203 passed

Frontend
  pnpm lint                        -> 0 errors, 4 warnings
  pnpm typecheck                   -> OK
  pnpm test                        -> 281 passed
  pnpm build                       -> 28 rutas
  Lighthouse mobile                -> 99 / 100 / 100 / 100; LCP 1.2 s; TBT 120 ms; CLS 0
  Lighthouse desktop               -> 100 / 100 / 100 / 100; LCP 0.3 s; TBT 0 ms; CLS 0
  Axe 4.14                         -> 0 violaciones WCAG 2.2 AA en 1440 y 390
  Playwright                       -> sin overflow de 320 a 1920; hero, pinned,
                                      auto-drop, dashboard con demo y sello verificados

Mobile
  pnpm exec tsc --noEmit           -> OK
```

## Criterio para decir “demo lista”

1. Los P0 están resueltos o explícitamente marcados como “no disponible”.
2. El flujo completo se recorre en producción con datos del tenant demo.
3. El reset de demo se ejecuta desde `/admin` y el seed queda coherente.
4. El APK se instala y se prueba en un Android físico.
5. La suite backend, frontend, Lighthouse y Axe pasan después del deploy.

Hoy la demo es **mostrable** con datos de ejemplo y cobros manuales. No es una
demo de cobros online, WhatsApp real ni email productivo.
