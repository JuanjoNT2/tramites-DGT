import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

let ready = false;

export function initAnalytics() {
	if (!browser || ready) return;
	const key = env.PUBLIC_POSTHOG_KEY ?? '';
	if (!key) {
		ready = true;
		return;
	}
	posthog.init(key, {
		api_host: env.PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
		person_profiles: 'identified_only',
		capture_pageview: true,
		capture_pageleave: true
	});
	ready = true;
}

export type FunnelProps = {
	tramite: string;
	step?: number;
	step_name?: string;
	total_steps?: number;
	[key: string]: unknown;
};

export function track(event: string, props?: Record<string, unknown>) {
	if (!browser) return;
	initAnalytics();
	try {
		if (env.PUBLIC_POSTHOG_KEY) {
			posthog.capture(event, props);
		} else {
			const q = JSON.parse(localStorage.getItem('tdgt_events') || '[]') as unknown[];
			q.push({ event, props, t: Date.now() });
			localStorage.setItem('tdgt_events', JSON.stringify(q.slice(-200)));
			console.debug('[tdgt-track]', event, props);
		}
	} catch {
		/* ignore */
	}
}

/** Eventos de embudo de formulario (CDP / product analytics) */
export const funnel = {
	started: (p: FunnelProps) => track('form_started', p),
	stepViewed: (p: FunnelProps) => track('form_step_viewed', p),
	stepCompleted: (p: FunnelProps) => track('form_step_completed', p),
	abandoned: (p: FunnelProps) => track('form_abandoned', p),
	submitted: (p: FunnelProps) => track('form_submitted', p),
	paymentStarted: (p: FunnelProps) => track('payment_started', p)
};
