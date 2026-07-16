# Trámites DGT Online — V2

App **SvelteKit** con look & feel inspirado en [tramitesdgtonline.com](https://tramitesdgtonline.com/), formularios guiados propios y analytics de embudo.

> No es un clon de WordPress: es una web nueva estéticamente alineada, con URLs SEO equivalentes y wizards más amigables.

## Stack

- SvelteKit 5 + TypeScript + adapter Verce
- Formularios propios en `/tramitar/*`
- PostHog (opcional) para medir abandono por paso

## Desarrollo

```bash
npm install
cp .env.example .env.local   # PUBLIC_POSTHOG_KEY opcional
npm run dev
```

## URLs principales (SEO)

| Ruta | Contenido |
|------|-----------|
| `/` | Home estética |
| `/transferencia-vehiculos` | Landing transferencia |
| `/distintivo-medioambiental` | Landing etiqueta |
| `/informe-trafico` | Landing informe |
| `/duplicado-de-carnet-de-conducir` | Landing duplicado |
| `/cancelacion-de-reserva-de-dominio` | Landing cancelación |
| `/tramitar/*` | Wizards amigables |
| `/calcular/*` | Calculadoras |

## Tracking (CDP + GTM/GA4)

Eventos: `page_view`, `cta_click`, `form_*`, `payment_started` → PostHog + `window.dataLayer`.

Inventario: `src/lib/analytics/event-declaration.json`.

```env
PUBLIC_POSTHOG_KEY=
PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
PUBLIC_GTM_ID=
```

## Panel admin (analítica estilo GA4)

- URL: `/admin` (login: `/admin/login`)
- Password: `ADMIN_PASSWORD` (por defecto local: `admin`)
- Sin credenciales GA4/Ads → **modo demo** con datos sintéticos
- Vistas: overview, canales, eventos/conversiones, conexiones, etiquetado, data layer
- Export: CSV y PDF (`/admin/api/export/...`)

Ver `.env.example` para `GA4_*`, Search Console, Google Ads y Meta Ads.

## Deploy

```bash
npx vercel --prod --yes
```

https://tramites-dgt-v2.vercel.app
