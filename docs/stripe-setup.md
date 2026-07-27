# Conectar Stripe (pasarela)

La app prioriza **Stripe**. Si no hay `STRIPE_SECRET_KEY`, intenta Redsys; si tampoco, deja el trámite en pendiente de pago.

## 1. Claves en Stripe Dashboard

1. Entra en [https://dashboard.stripe.com](https://dashboard.stripe.com) (modo **Test** primero).
2. **Developers → API keys**.
3. Copia la **Secret key** (`sk_test_…`).

## 2. Variables en Vercel (y `.env.local` en local)

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # tras crear el webhook (paso 3)
PUBLIC_SITE_ORIGIN=https://tramitesdgtonline.com
```

Redeploy tras guardar.

## 3. Webhook (imprescindible para marcar `pagada`)

### Producción / preview Vercel

1. Stripe → **Developers → Webhooks → Add endpoint**.
2. URL: `https://tramitesdgtonline.com/api/pago/stripe-webhook`  
   (en preview: `https://TU-DEPLOY.vercel.app/api/pago/stripe-webhook`).
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded` (opcional, métodos asíncronos)
4. Copia el **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`.

### Local (opcional)

```bash
stripe listen --forward-to localhost:5173/api/pago/stripe-webhook
```

Usa el `whsec_…` que imprime la CLI en `.env.local`.

## 4. Probar

1. Completa un trámite hasta `/pago/[id]`.
2. Debe verse “Pago seguro con Stripe” y **Pagar ahora**.
3. Usa tarjeta de test: `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
4. Tras el pago → `/pago/ok` y en Supabase la solicitud pasa a **`pagada`** (vía webhook).

## 5. Pasar a Live

1. Completa activación de la cuenta Stripe (negocio, IBAN, etc.).
2. Cambia a modo **Live** las claves `sk_live_…` y un webhook live con el mismo path.
3. Actualiza Vercel Production y redeploy.

## Flujo técnico

1. `POST /api/pago/crear` → Checkout Session Stripe → redirect a `url`.
2. Usuario paga en Stripe Hosted Checkout.
3. Stripe llama a `/api/pago/stripe-webhook` → status `pagada` + email/notificación.
4. El usuario vuelve a `/pago/ok?solicitud=…`.

Redsys sigue disponible si algún día hay `REDSYS_*` y **no** hay Stripe configurado (Stripe tiene prioridad).
