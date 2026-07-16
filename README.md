# Trámites DGT Online — V2

App **SvelteKit** con look & feel inspirado en [tramitesdgtonline.com](https://tramitesdgtonline.com/), formularios guiados propios y analytics de embudo.

> No es un clon de WordPress: es una web nueva estéticamente alineada, con URLs SEO equivalentes y wizards más amigables.

## Stack

- SvelteKit 5 + TypeScript + adapter Vercel
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

## Tracking (CDP)

Eventos: `form_started`, `form_step_viewed`, `form_step_completed`, `form_abandoned`, `form_submitted`, `payment_started`.

```env
PUBLIC_POSTHOG_KEY=
PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

## Deploy

```bash
npx vercel --prod --yes
```

https://tramites-dgt-v2.vercel.app
