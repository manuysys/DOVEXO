# Rediseño de la app Android (Expo) — Fase 7

**Fecha:** 2026-11-18
**Estado:** implementado en local; `tsc` OK. Sin build de Expo, emulador ni
dispositivo físico en esta sesión.
**Alcance:** `apps/mobile` (Expo SDK 58, React Native 0.88, Expo Router).
**Referencias:** [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) (tokens),
[`PROJECT_STATUS.md`](PROJECT_STATUS.md), `MEJORA_FRONTEND.txt` secciones 16–17.

## 1. Estado de partida

La app ya traía tokens TS, `src/components/ui.tsx`, tabs de técnico y cliente,
bottom sheets, estados de sincronización offline y skeletons. Esta fase cerró el
hueco funcional y desbloqueó el typecheck de la rama.

## 2. Cambios realizados

| Archivo | Cambio |
|---|---|
| `app/customer/(tabs)/services.tsx` | Nueva pestaña **Pagos**: consulta `portalPayments`, total registrado, movimientos con método/estado/fecha y soporte de `?tab=` |
| `app/customer/(tabs)/home.tsx` | Card de **Pagos** en el home (total, último pago y estado) con acceso a la pestaña |
| `app/customer/(tabs)/_layout.tsx` | Uso de `tabIconColor` |
| `app/tech/(tabs)/_layout.tsx` | Uso de `tabIconColor` |
| `src/components/ui.tsx` | Helper `tabIconColor(ColorValue): string` |
| `src/components/bottom-sheet.tsx` | `StyleSheet.absoluteFillObject` → `absoluteFill` (RN 0.88) |

## 3. Decisiones

- **Pagos**: el contrato `PortalPaymentResponse`, `paymentStatusMeta` y
  `paymentMethods` ya existían pero no se usaban en ninguna pantalla; se replicó
  el patrón del portal web (total sin anulados, movimientos ordenados).
- **Pestaña por parámetro**: `TAB_VALUES` + type guard + `useEffect`, con
  degradación a `orders` si el parámetro falta o es inválido.
- **`tabIconColor`**: el navegador entrega `ColorValue`; Ionicons exige string.
  Se resolvió con un helper tipado en el design system.
- **Sin dependencias nuevas.** No se agregó `expo-haptics` porque es un módulo
  nativo que exige rebuild; `android_ripple` y los estados `pressed` cubren el
  feedback táctil. Queda como deuda explícita.

## 4. Verificación

```text
cd apps/mobile
pnpm exec tsc --noEmit   -> exit 0
```

Se corrigieron 9 errores de typecheck preexistentes (8 en los `_layout.tsx` por
el color de `tabBarIcon`, 1 en `bottom-sheet.tsx`). `apps/mobile` no tiene
ESLint configurado.

## 5. Pendiente de validación

- Runtime en emulador o dispositivo Android (no ejecutado).
- Que `?tab=payments` llegue al tab screen de `expo-router/js-tabs`.
- Render de la pestaña Pagos contra la API real.
- Flujos offline, push y refresh (no modificados, no re-ejecutados).
- Capturas en 360/390/430 dp para QA visual.

## 6. Próximos pasos

1. `pnpm exec expo export --platform android` y `expo-doctor`.
2. Probar en emulador y luego en dispositivo físico.
3. QA visual de las dos experiencias (técnico y cliente).
