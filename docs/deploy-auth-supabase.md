# Deploy: Auth Supabase, Resend y paneles

Checklist para producción / preview en Vercel del flujo de registro, solicitudes y panel gestor.

## Panel de usuario (migración adicional)

Ejecutar también en SQL Editor:

`supabase/migrations/20260724_panel_usuario.sql`

Amplía `profiles`, estados de `solicitudes`, tablas `vehiculos`, `solicitud_documentos`, `notificaciones` y bucket Storage `tramite-docs`.

Roles: solo **admin** (Supabase Auth role) cambia estados de trámite; **gestor** ve/exporta/docs.

## 2. Variables en Vercel

| Variable | Uso |
|---|---|
| `PUBLIC_SUPABASE_URL` | `https://gawfttwqyejunscftman.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | anon key del proyecto |
| `SUPABASE_URL` | Misma URL (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (nunca en cliente) |
| `RESEND_API_KEY` | Reenvío de verificación desde `/cuenta` |
| `RESEND_FROM_EMAIL` | Remitente verificado en Resend |
| `PUBLIC_SITE_ORIGIN` | `https://tramitesdgtonline.com` (links de callback) |
| `ADMIN_PASSWORD` | Gate panel analítica `/admin` |
| `ADMIN_SESSION_SECRET` | Firma cookie admin (≥32 chars) |

Copia de referencia: `.env.example`.

## 3. Supabase Auth + SMTP Resend

En **Authentication → Providers**: Email habilitado (password).

En **Authentication → SMTP / Emails** (custom SMTP Resend):

- Host: `smtp.resend.com`
- Port: `465` (SSL) o `587`
- User: `resend`
- Password: API key de Resend
- Sender: el mismo dominio verificado que `RESEND_FROM_EMAIL`

En **Authentication → URL configuration**:

- Site URL: valor de `PUBLIC_SITE_ORIGIN`
- Redirect URLs:
  - `https://tramitesdgtonline.com/auth/callback`
  - `https://*.vercel.app/auth/callback` (previews, si aplica)
  - `http://localhost:5173/auth/callback` (dev)

Confirmar que “Confirm email” está activo si quieres verificación obligatoria.

## 4. Primer admin / gestor

1. Un ciudadano se registra en `/registro` y verifica el email.
2. Entra a `/admin` con `ADMIN_PASSWORD`.
3. En `/admin/usuarios` cambia el rol a `gestor` o `admin`.
4. Ese usuario accede a `/gestor` con su sesión Supabase.

## 5. QA mínima

- [ ] Registro → email de verificación → login
- [ ] Trámite **sin** login → fila en `solicitudes` y visible en `/gestor`
- [ ] Trámite **con** login → `user_id` poblado
- [ ] Admin eleva a gestor → acceso `/gestor` + CSV/Excel/PDF
- [ ] Nav «Iniciar sesión» apunta a `/login` (no a transferencia)

## 6. Notas

- El panel `/admin` (analítica) sigue usando cookie HMAC; es independiente de Supabase Auth.
- `/gestor` exige `profiles.role` ∈ `gestor|admin`.
- Sin `SUPABASE_*` en local, las solicitudes caen a `.data/solicitudes.json`; en Vercel/prod falla claro (503).
