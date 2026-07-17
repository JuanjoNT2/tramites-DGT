/**
 * Analytics / taggeado Trámites DGT (arquitectura Performanze)
 *
 * DEC  events.ts + page-map.ts + server/validate.ts
 * CAP  track.ts → destino único de verdad /api/collect (+ espejo dataLayer)
 * IDE  identity.ts
 * ADQ  acquisition.ts (first-touch de sesión)
 * ING  routes/api/collect
 * VAL  server/validate.ts
 * ALM  server/store-* (Supabase o .data/analytics)
 * MOD  server/model.ts → analytics_daily
 * PAN  /admin lee del modelo
 * RGP  consent.ts + ConsentBanner
 */
export { CtaIds, Events, type CtaId, type EventName } from './events';
export {
	listEventDeclarations,
	normalizePath,
	pageContext,
	PAGE_TAGS,
	resolvePageTag,
	type ContentGroup,
	type PageTag,
	type PageType
} from './page-map';
export { funnel, type FunnelProps } from './funnel';
export { initAnalytics, track, trackClick, trackPageView } from './track';
export {
	canCaptureAnalytics,
	getAnalyticsConsent,
	setAnalyticsConsent
} from './consent';
