import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { getAcquisition } from './acquisition';
import { canCaptureAnalytics, getAnalyticsConsent } from './consent';
import { CtaIds, Events, type CtaId, type EventName } from './events';
import { getSessionId, getVisitorId, touchSession } from './identity';
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

	// PostHog opcional como espejo de marketing; la fuente de verdad es /api/collect
	const key = env.PUBLIC_POSTHOG_KEY ?? '';
	if (key) {
		posthog.init(key, {
			api_host: env.PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
			person_profiles: 'identified_only',
			capture_pageview: false,
			capture_pageleave: true
		});
	}

	ready = true;
}

function pushDataLayer(event: string, props?: Record<string, unknown>) {
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push({ event, ...props });
}

/** Destino único de verdad: ingesta de primera parte en el propio dominio. */
function sendFirstParty(payload: Record<string, unknown>) {
	const body = JSON.stringify(payload);
	const url = '/api/collect';
	try {
		if (navigator.sendBeacon) {
			const blob = new Blob([body], { type: 'application/json' });
			if (navigator.sendBeacon(url, blob)) return;
		}
	} catch {
		/* fall through */
	}
	void fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body,
		keepalive: true,
		credentials: 'same-origin'
	}).catch(() => undefined);
}

/**
 * Emite un evento según el contrato.
 * 1) Ingesta propia (/api/collect) — fuente de verdad
 * 2) dataLayer — espejo para GTM/GA4 (carril marketing, no verdad del panel)
 */
export function track(
	event: EventName | string,
	props?: Record<string, unknown>,
	opts?: { pathname?: string }
) {
	if (!browser) return;
	initAnalytics();

	if (!canCaptureAnalytics()) {
		console.debug('[tdgt-track:blocked-consent]', event);
		return;
	}

	touchSession();
	const pathname =
		opts?.pathname ??
		(typeof props?.page_path === 'string' ? props.page_path : undefined) ??
		window.location.pathname;

	const ctx = pageContext(pathname);
	const pageProps = { ...ctx, ...props };
	const acquisition = getAcquisition(String(pageProps.page_path || pathname));
	const visitor_id = getVisitorId();
	const session_id = getSessionId();
	const consent = getAnalyticsConsent();

	const firstParty = {
		event,
		visitor_id,
		session_id,
		consent,
		ts: new Date().toISOString(),
		props: pageProps,
		acquisition
	};

	try {
		sendFirstParty(firstParty);

		// Espejo marketing (no sustituye al almacén propio)
		pushDataLayer(event, {
			...pageProps,
			visitor_id,
			session_id,
			channel: acquisition.channel,
			consent
		});

		if (env.PUBLIC_POSTHOG_KEY) {
			posthog.capture(event, { ...pageProps, channel: acquisition.channel });
		}
	} catch {
		/* ignore */
	}
}

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

export function trackClick(
	ctaId: CtaId | string,
	props?: Record<string, unknown>,
	opts?: { pathname?: string }
) {
	track(Events.CTA_CLICK, { cta_id: ctaId, ...props }, opts);
}

export { CtaIds, Events };
