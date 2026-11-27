# Rediseño de la PWA del técnico — Fase 5

**Fecha:** 2026-11-18
**Estado:** implementado en local; `typecheck` OK (tech lead) y validación con
Playwright a 360/390 px. Sin build final ni deploy al momento de este documento.
**Alcance:** `apps/web/src/app/tech/**` y `apps/web/src/components/tech/**`.
**Referencias:** [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md) (P-01…P-03),
[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), `MEJORA_FRONTEND.txt` sección 14.

## 1. Problemas corregidos

| Hallazgo | Corrección |
|---|---|
| **P-01 (P0)**: sesión de owner en `/tech` mostraba "No se pudieron cargar tus trabajos" (403) como error de red | Guard de rol en `TechShell` (no monta la query si el rol no es técnico) + `TechQueryError` que distingue 401/403/404/red con mensajes y acciones |
| P-02: el botón "Salir" no cerraba la sesión en la prueba | El shell ahora expone "Cerrar sesión" en el estado de rol incorrecto y en el perfil; el logout navega a `/login` |
| P-03: mensaje genérico | Copy específico: "Esta sección es para técnicos. Ingresá con tu cuenta de técnico." con "Cerrar sesión" e "Ir al panel" |
| `loading.tsx` sin shell (fondo beige, sin header) | Loading con header y main del shell, `aria-busy` y `sr-only` |

## 2. Home y navegación

- Jerarquía: header (fecha, nombre, resumen, actualizado) → resumen compacto
  (Hoy/Pendientes/En curso) → **próximo trabajo** → agenda → trabajos →
  acciones.
- Tarjetas compactas con código, estado, cliente, servicio, horario, dirección y
  acción; `aria-label` completo.
- Navegación inferior: Inicio, Agenda, Trabajos, Perfil.
- Detalle con acción principal fija (Iniciar/Continuar/Finalizar/Pausar) y
  secciones de cliente, dirección, instrucciones, presupuesto, materiales,
  fotos, notas e historial.

## 3. Offline y sincronización

`useSyncStatus()` resume conexión, mutaciones en vuelo y fallos:

- Estados: online, offline, actualizando, guardando, fallido.
- Contador de pendientes y barra para offline/pendientes/fallidos/reconexión.
- Los fallos se pueden reconocer ("Ocultar") y no se anuncia éxito hasta la
  respuesta del servidor.
- La PWA web no tiene outbox persistente: "pendiente" significa request en vuelo.

## 4. Fotos y materiales

- Fotos: cámara/galería, preview, eliminar, reintentar, progreso y sync; grilla
  desde 420 px y copy que no se parte.
- Materiales: alta rápida, ayuda de decimales con `aria-describedby`, vacío con
  contexto.
- Se conservaron idempotencia (`client_request_id`), cola offline y llamadas API.

## 5. Verificación

- `pnpm typecheck` (tech lead): **0 errores** tras corregir `tech-sync-status`
  (`mutationId` numérico → `String`).
- ESLint del alcance: 0 errores, 1 warning preexistente de `react-hook-form`.
- Playwright (contexto aislado, 360/390 px):
  - Owner en `/tech` → heading y copy de rol correctos.
  - 403 forzado → copy correcto, sin "Revisá la conexión".
  - Técnico: home y detalle sin overflow (`scrollWidth - innerWidth = 0`), 0
    errores de consola.
  - Offline simulado y fallo de sincronización: indicadores y barra correctos.
- **Bug de auth corregido**: los formularios de login, registro e invitación
  ahora usan `method="post"`, evitando el envío GET nativo con email y
  contraseña en la URL antes de la hidratación.

## 6. Pendiente

- Service worker offline real en dispositivo (solo simulación de `navigator.onLine`).
- 403 de detalle con técnico reasignado real.
- Cambio de empresa con usuario técnico en dos tenants.
- Contraste fino de `text-text-2` sobre `bg-surface-2/40` en 12 px.
- Prueba en Android físico.
