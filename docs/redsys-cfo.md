# Redsys — qué pedir al CFO

Sin estos datos no se puede cobrar en producción. El producto ya tiene UI + APIs listas (`/api/pago/crear`, `/api/pago/notificacion`, `/pago/ok`, `/pago/ko`).

## Credenciales necesarias

| Dato | Variable Vercel | Notas |
|------|-----------------|--------|
| Código de comercio | `REDSYS_MERCHANT_CODE` | FUC / merchant code |
| Número de terminal | `REDSYS_TERMINAL` | p. ej. `001` |
| Clave secreta SHA-256 (Base64) | `REDSYS_SECRET_KEY` | Clave de firma HMAC |
| Entorno | `REDSYS_ENV` | `test` (sandbox) o `live` |

## URLs a dar al banco / panel Redsys

Sustituir el dominio canónico si aplica:

- **URL notificación (servidor):** `https://tramitesdgtonline.com/api/pago/notificacion`
- **URL OK:** `https://tramitesdgtonline.com/pago/ok`
- **URL KO:** `https://tramitesdgtonline.com/pago/ko`

También en preview (opcional): las mismas rutas bajo `*.vercel.app`.

## Mensaje corto para el CFO

> Necesitamos el TPV Redsys (código comercio, terminal, clave SHA-256 en Base64 y si usamos test o live) para cablear el último paso de los trámites. Las URLs de notificación/OK/KO ya están definidas en la app.

## Tras recibir las claves

1. Añadir las 4 variables en Vercel (Production + Preview).
2. Redeploy.
3. Probar un pago sandbox de 1 € / importe real del trámite.
4. Comprobar en Supabase que la solicitud pasa a `pagada`.
