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

Dominio canónico: **https://tramitesdgtonline.com** (no usar el host de Vercel en canonicals).

Convenciones on-page: [`.cursor/rules/seo.mdc`](.cursor/rules/seo.mdc). Componente: `SeoHead`. Sitemap: `/sitemap.xml`.

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

## Tracking (capa de datos propia)

Flujo Performanze: declaración → captura → identidad/sesión → adquisición → `/api/collect` → validación → crudo → modelo → panel.

- Consentimiento: banner en el sitio (`tdgt_consent_analytics`)
- Inventario: `src/lib/analytics/event-declaration.json`
- SQL Supabase: `supabase/migrations/20260717_analytics_own_store.sql`

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_GTM_ID=
```

Sin Supabase, en local los eventos van a `.data/analytics/`.

## Panel admin (analítica)

- URL: `/admin` · login `/admin/login` · password `ADMIN_PASSWORD` (default local: `admin`)
- Lee del **almacén propio** (no de GA4). CSV/PDF salen del mismo modelo.
- Carril B (GSC/Ads/Meta): tablas externas separadas.

## Deploy

```bash
npm run security:scan   # anti-hardcoded (obligatorio en CI/local antes de prod)
npx vercel --prod --yes
```

En Vercel (Production/Preview) define `ADMIN_PASSWORD` (≥12), `ADMIN_SESSION_SECRET` (≥32) y `PUBLIC_SITE_ORIGIN=https://tramitesdgtonline.com`.

https://tramites-dgt-v2.vercel.app
