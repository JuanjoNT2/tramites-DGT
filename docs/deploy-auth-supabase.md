# Deploy: Auth Supabase, SendGrid y paneles

Checklist para producción / preview en Vercel del flujo de registro, solicitudes y panel gestor.

## 1. Panel de usuario (migración adicional)

Ejecutar en SQL Editor:

- `supabase/migrations/20260724_panel_usuario.sql`
- `supabase/migrations/20260724_pago_estados.sql` (estados `pendiente_pago` / `pagada`)

Amplía `profiles`, estados de `solicitudes`, tablas `vehiculos`, `solicitud_documentos`, `notificaciones` y bucket Storage `tramite-docs`.

Roles: solo **admin** (Supabase Auth role) cambia estados de trámite; **gestor** ve/exporta/docs.

## 2. Variables en Vercel

| Variable | Uso |
|---|---|
| `PUBLIC_SUPABASE_URL` | `https://gawfttwqyejunscftman.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | anon key del proyecto |
| `SUPABASE_URL` | Misma URL (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (nunca en cliente) |
| `PUBLIC_SITE_ORIGIN` | `https://tramitesdgtonline.com` (links de callback) |
| `ADMIN_PASSWORD` | Gate panel analítica `/admin` |
| `ADMIN_SESSION_SECRET` | Firma cookie admin (≥32 chars) |
| `STRIPE_SECRET_KEY` | Secret key Stripe (`sk_test_…` / `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret del webhook (`whsec_…`) |
| `REDSYS_*` | Opcional; solo si no hay Stripe |

Copia de referencia: `.env.example`. Guía Stripe: `docs/stripe-setup.md`.

### Verificación Vercel (julio 2026)

Confirmado con `vercel env ls` en el proyecto `tramites-dgt-v2`:

- [x] `PUBLIC_SUPABASE_*` y `SUPABASE_*` en **Production** y **Preview**
- [x] `PUBLIC_SITE_ORIGIN`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` en Production / Preview / Development
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — por conectar
- [ ] `REDSYS_*` — opcionales (Stripe tiene prioridad)

El SMTP de verificación de email **no** va en Vercel: se configura en el Dashboard de Supabase (SendGrid).

## 3. Supabase Auth + SMTP SendGrid (único canal)

La verificación de email se hace **solo con SendGrid** vía SMTP personalizado de Supabase Auth. No usar Resend.

En **Authentication → Providers**: Email habilitado (password).

En **Authentication → SMTP / Emails** (custom SMTP):

- Host: `smtp.sendgrid.net`
- Port: `587` (TLS) o `465` (SSL)
- Username: `apikey` (literal)
- Password: API key de SendGrid (`SG....`)
- Sender: p. ej. `no-reply@gestion.tramitesdgtonline.com` (dominio verificado en SendGrid)

En **Authentication → URL configuration**:

- Site URL: valor de `PUBLIC_SITE_ORIGIN`
- Redirect URLs:
  - `https://tramitesdgtonline.com/auth/callback`
  - `https://tramitesdgtonline.com/auth/verificar`
  - `https://tramitesdgtonline.com/auth/callback?**` (si el panel lo pide)
  - `https://*.vercel.app/auth/callback`
  - `http://localhost:5173/auth/callback` (dev)
  - `http://localhost:5173/auth/verificar` (dev)

Los emails de Auth deben usar `token_hash` → `/auth/verificar` (plantillas en `supabase/templates/`),
no `ConfirmationURL`, para que Gmail no consuma el enlace al previsualizarlo.

Confirmar que “Confirm email” está activo.

### Plantillas de email (castellano + marca)

Supabase envía por defecto textos en **inglés** y sin marca. Hay que personalizarlos en el dashboard
(no van en el código de Vercel):

**Authentication → Email Templates**

| Plantilla | Asunto sugerido | HTML en el repo |
|---|---|---|
| Confirm signup | `Confirma tu email · Trámites DGT Online` | `supabase/templates/confirm-signup.html` |
| Reset password | `Restablece tu contraseña · Trámites DGT Online` | `supabase/templates/recovery.html` |
| Invite user | `Te han invitado a Trámites DGT Online` | `supabase/templates/invite.html` |

1. Abre cada plantilla en el dashboard.
2. Sustituye el **Subject** por el de la tabla.
3. Pega el HTML completo del archivo correspondiente.
4. Guarda.

El logo usa `{{ .SiteURL }}/brand/logo-blanco.png` (debe existir en producción tras el deploy).
El saludo puede usar `{{ .Data.nombre }}` (metadata del registro).

#### Aviso de Gmail («mensaje sospechoso» / imágenes ocultas)

No es un fallo específico de SendGrid: Gmail oculta imágenes y marca avisos cuando el dominio
es nuevo, el volumen es bajo o faltan/fallan **SPF, DKIM y DMARC** en el dominio del remitente
(`gestion.tramitesdgtonline.com`). Conviene:

- Dominio autenticado en SendGrid (Single Sender / Domain Authentication).
- Registros DNS SPF + DKIM de SendGrid y DMARC en el dominio.
- Remitente estable (`no-reply@gestion.…`) y Site URL canónica `https://tramitesdgtonline.com`.

Las plantillas del repo están pensadas para leerse bien **aunque Gmail oculte las imágenes**
(texto en castellano + botón/enlace).

## 4. Roles gestor / admin Auth

**No se elevan roles desde la web.** Se asignan con:

- `npm run seed:demo-users` (crea gestor demo), o
- Supabase → Table Editor `profiles.role`, o SQL / Admin API

### Seed demo

```bash
# Requiere SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en .env.local
npm run seed:demo-users
```

| Rol | Email | Password | Entrar |
|-----|-------|----------|--------|
| Ciudadano | `demo1@tramitesdgtonline.com` … `demo5@…` | `DemoUser2026!` | `/login` → `/cuenta` |
| **Gestor** | `gestor@tramitesdgtonline.com` | `GestorDemo2026!` | `/login` → `/gestor` |

**Importante:** `/admin` (analítica) usa `ADMIN_PASSWORD`, independiente de Auth.

### Contraseñas

- Olvidé mi contraseña: `/recuperar-password` (email SendGrid)
- Cambiar estando logueado: `/cuenta/seguridad` (ciudadano, gestor y admin Auth)

## 5. QA mínima

- [ ] Registro → email SendGrid → login
- [ ] Trámite **sin** login → fila en `solicitudes` y visible en `/gestor`
- [ ] Trámite **con** login → `user_id` poblado
- [ ] Admin eleva a gestor → acceso `/gestor` + CSV/Excel/PDF
- [ ] Último paso → pagar (con `STRIPE_*`: Checkout Stripe; si no, Redsys; sin claves: `pendiente_pago`)

## 6. Notas

- El panel `/admin` (analítica) sigue usando cookie HMAC; es independiente de Supabase Auth.
- `/gestor` exige `profiles.role` ∈ `gestor|admin`.
- Sin `SUPABASE_*` en local, las solicitudes caen a `.data/solicitudes.json`; en Vercel/prod falla claro (503).
- Pasarela: ver [`docs/redsys-cfo.md`](redsys-cfo.md).
