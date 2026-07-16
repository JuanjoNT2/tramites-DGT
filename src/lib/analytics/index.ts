/**
 * Analytics / taggeado Trámites DGT
 *
 * - events.ts     → nombres canónicos de eventos y cta_id
 * - page-map.ts   → declaración por URL (page_type, content_group, eventos, CTAs)
 * - track.ts      → envío a PostHog + window.dataLayer
 * - funnel.ts     → helpers del embudo /tramitar/*
 *
 * Inventario SEO: listEventDeclarations() desde page-map.
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
