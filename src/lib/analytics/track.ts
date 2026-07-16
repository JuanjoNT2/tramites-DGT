import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { CtaIds, Events, type CtaId, type EventName } from './events';
import { pageContext, resolvePageTag } from './page-map';

declare global {
	interface Window {
		dataLayer?: Record<string, unknown>[];
	}
}

let ready = false;
let lastPagePath = '';

export function initAnalytics() {
	if (!browser || ready) return;

	window.dataLayer = window.dataLayer || [];

	const key = env.PUBLIC_POSTHOG_KEY ?? '';
	if (key) {
		posthog.init(key, {
			api_host: env.PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
			person_profiles: 'identified_only',
			// Page views los disparamos nosotros con page_type / content_group
			capture_pageview: false,
			capture_pageleave: true
		});
	}

	ready = true;
}

function pushDataLayer(event: string, props?: Record<string, unknown>) {
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push({
		event,
		...props
	});
}

function queueLocal(event: string, props?: Record<string, unknown>) {
	try {
		const q = JSON.parse(localStorage.getItem('tdgt_events') || '[]') as unknown[];
		q.push({ event, props, t: Date.now() });
		localStorage.setItem('tdgt_events', JSON.stringify(q.slice(-200)));
		console.debug('[tdgt-track]', event, props);
	} catch {
		/* ignore */
	}
}

/**
 * Dispara un evento a PostHog + dataLayer (GTM/GA4).
 * Incluye contexto de página si hay pathname en props o se pasa currentPath.
 */
export function track(
	event: EventName | string,
	props?: Record<string, unknown>,
	opts?: { pathname?: string }
) {
	if (!browser) return;
	initAnalytics();

	const pathname =
		opts?.pathname ??
		(typeof props?.page_path === 'string' ? props.page_path : undefined) ??
		window.location.pathname;

	const ctx = pageContext(pathname);
	const payload = { ...ctx, ...props };

	try {
		pushDataLayer(event, payload);

		if (env.PUBLIC_POSTHOG_KEY) {
			posthog.capture(event, payload);
		} else {
			queueLocal(event, payload);
		}
	} catch {
		/* ignore */
	}
}

/** Page view tipado según declaración de la URL. */
export function trackPageView(pathname: string = browser ? window.location.pathname : '/') {
	if (!browser) return;
	const tag = resolvePageTag(pathname);
	if (tag.path === lastPagePath) return;
	lastPagePath = tag.path;

	track(
		Events.PAGE_VIEW,
		{
			page_path: tag.path,
			page_type: tag.page_type,
			content_group: tag.content_group,
			page_label: tag.label,
			...(tag.tramite ? { tramite: tag.tramite } : {})
		},
		{ pathname: tag.path }
	);
}

/** Clic en CTA. cta_id debe ser de CtaIds cuando sea posible. */
export function trackClick(
	ctaId: CtaId | string,
	props?: Record<string, unknown>,
	opts?: { pathname?: string }
) {
	track(
		Events.CTA_CLICK,
		{
			cta_id: ctaId,
			...props
		},
		opts
	);
}

export { CtaIds, Events };
