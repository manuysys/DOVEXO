# Checklist de producción

Estado al 2026-11-22. Marcar solo cuando esté verificado.

## P0 — antes de clientes reales

- [x] HTTPS en frontend y API.
- [x] PostgreSQL administrado (Neon).
- [x] Migraciones aplicadas contra la base administrada.
- [x] Cookies `HttpOnly`, `Secure`, `SameSite=None` para cross-site.
- [x] Cabeceras de seguridad en API.
- [x] Cabeceras de seguridad en frontend (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- [x] Rate limiting compartido en PostgreSQL (con fallback en memoria).
- [x] Lockout de login y revocación de familia de refresh tokens.
- [x] Audit log de acciones críticas.
- [x] `/docs` y `/openapi.json` ocultos en producción.
- [x] Validación de `Origin` en endpoints con cookie.
- [ ] Password reset con token de un solo uso.
- [ ] Email transaccional con dominio verificado (Resend).
- [ ] Backup diario y restauración probada (workflow con PostgreSQL 17, verificación y checksum; falta `NEON_DATABASE_URL` y restore real).
- [ ] Monitoreo de errores y uptime.
- [ ] Dominio propio.
- [ ] Política de privacidad y términos revisados.
- [ ] Búsqueda de marca y registro de dominio.

## P1 — primeras semanas

- [ ] Enforcement de límites por plan.
- [ ] Mercado Pago suscripciones + webhook + facturas.
- [ ] WhatsApp outbox, plantillas y consentimiento.
- [ ] Cron de recordatorios y reintentos.
- [ ] 2FA para owners/admins.
- [ ] Exportación/eliminación de datos del tenant.
- [ ] Adjuntos en S3/R2 con URLs firmadas.
- [ ] FKs compuestas por tenant o RLS.
- [ ] Pruebas E2E con Playwright contra preview.
- [ ] Accesibilidad AA y Lighthouse.

## P2 — escala

- [ ] Planes pagos de Vercel/Neon con SLA.
- [ ] Rate limiting distribuido o WAF.
- [ ] Observabilidad avanzada (trazas, métricas de negocio).
- [ ] Pruebas de carga.
- [ ] Separación de entornos staging/producción.
- [ ] Rotación de secretos documentada.
- [ ] Plan de respuesta a incidentes.

## Variables críticas

```env
APP_ENV=production
APP_DEBUG=false
JWT_SECRET=<64+ chars aleatorios>
DATABASE_URL=postgresql+asyncpg://...?ssl=require
API_CORS_ORIGINS=["https://app.arreglo.com.ar"]
COOKIE_SECURE=true
COOKIE_SAMESITE=none
ALLOWED_HOSTS=["api.arreglo.com.ar"]
RATE_LIMIT_ENABLED=true
AI_PROVIDER=openai_compatible
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=openai/gpt-oss-120b
AI_API_KEY=<secreto>
WHATSAPP_ENCRYPTION_KEY=<secreto>
WHATSAPP_VERIFY_TOKEN=<secreto>
# WHATSAPP_APP_SECRET es obligatorio para el webhook; sin él responde 503.
WHATSAPP_APP_SECRET=<secreto>
# TRUST_PROXY_HEADERS=true solo detrás de un proxy de confianza (Vercel).
TRUST_PROXY_HEADERS=true
RESEND_API_KEY=<secreto>
MP_ACCESS_TOKEN=<secreto>
MP_WEBHOOK_SECRET=<secreto>
```

No guardar secretos en el repositorio. Usar `.env` local y el gestor de
variables del proveedor.
