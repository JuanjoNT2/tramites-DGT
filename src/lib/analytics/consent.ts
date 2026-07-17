/**
 * Consentimiento analytics (capa transversal RGPD del informe).
 * Condiciona la captura; viaja como propiedad en cada evento.
 */
import { browser } from '$app/environment';

const CONSENT_KEY = 'tdgt_consent_analytics';

export type ConsentState = 'granted' | 'denied' | 'unknown';

export function getAnalyticsConsent(): ConsentState {
	if (!browser) return 'unknown';
	try {
		const v = localStorage.getItem(CONSENT_KEY);
		if (v === 'granted' || v === 'denied') return v;
		return 'unknown';
	} catch {
		return 'unknown';
	}
}

export function setAnalyticsConsent(state: 'granted' | 'denied'): void {
	if (!browser) return;
	try {
		localStorage.setItem(CONSENT_KEY, state);
		window.dispatchEvent(new CustomEvent('tdgt-consent', { detail: state }));
	} catch {
		/* ignore */
	}
}

/** Hasta que el usuario elija, no emitimos a ingesta propia (sí se puede mostrar el banner). */
export function canCaptureAnalytics(): boolean {
	return getAnalyticsConsent() === 'granted';
}
