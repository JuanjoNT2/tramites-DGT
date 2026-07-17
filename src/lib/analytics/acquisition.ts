/**
 * Adquisición (capa ADQ): se congela en el primer evento de la sesión.
 * Regla de atribución: first-touch de la sesión (UTM / gclid / fbclid / referrer).
 */
import { browser } from '$app/environment';

export type Acquisition = {
	channel: string;
	source: string;
	medium: string;
	campaign: string;
	content: string;
	term: string;
	gclid: string;
	fbclid: string;
	referrer: string;
	landing_path: string;
};

const ACQ_KEY = 'tdgt_acq';
const LOCK_KEY = 'tdgt_acq_locked';

function classifyChannel(a: Omit<Acquisition, 'channel'>): string {
	if (a.gclid || (a.source === 'google' && a.medium === 'cpc')) return 'Paid Search';
	if (a.fbclid || a.source === 'facebook' || a.source === 'instagram' || a.medium === 'paid_social')
		return 'Paid Social';
	if (a.medium === 'email' || a.source === 'email') return 'Email';
	if (a.medium === 'organic' || a.medium === 'organic_social') {
		if (['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'].includes(a.source))
			return 'Organic Social';
		return 'Organic Search';
	}
	if (a.medium === 'referral' || (a.referrer && !a.source)) return 'Referral';
	if (!a.source && !a.medium && !a.referrer) return 'Direct';
	if (a.medium === 'cpc' || a.medium === 'ppc' || a.medium === 'paid') return 'Paid Search';
	if (a.referrer) return 'Referral';
	return 'Unassigned';
}

function hostOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return '';
	}
}

export function captureAcquisition(landingPath: string): Acquisition {
	if (!browser) {
		return emptyAcq(landingPath);
	}

	try {
		const locked = sessionStorage.getItem(LOCK_KEY);
		const existing = sessionStorage.getItem(ACQ_KEY);
		if (locked && existing) {
			return JSON.parse(existing) as Acquisition;
		}

		const params = new URLSearchParams(window.location.search);
		const ref = document.referrer || '';
		const refHost = hostOf(ref);
		const selfHost = window.location.hostname.replace(/^www\./, '');
		const externalRef = refHost && refHost !== selfHost ? ref : '';

		const source =
			params.get('utm_source') ||
			(params.get('gclid') ? 'google' : '') ||
			(params.get('fbclid') ? 'facebook' : '') ||
			(externalRef ? hostOf(externalRef) : '') ||
			'';

		const medium =
			params.get('utm_medium') ||
			(params.get('gclid') ? 'cpc' : '') ||
			(params.get('fbclid') ? 'paid_social' : '') ||
			(externalRef ? 'referral' : '') ||
			'';

		const base = {
			source: source.toLowerCase(),
			medium: medium.toLowerCase(),
			campaign: params.get('utm_campaign') || '',
			content: params.get('utm_content') || '',
			term: params.get('utm_term') || '',
			gclid: params.get('gclid') || '',
			fbclid: params.get('fbclid') || '',
			referrer: externalRef,
			landing_path: landingPath
		};

		const acq: Acquisition = {
			...base,
			channel: classifyChannel(base)
		};

		sessionStorage.setItem(ACQ_KEY, JSON.stringify(acq));
		sessionStorage.setItem(LOCK_KEY, '1');
		return acq;
	} catch {
		return emptyAcq(landingPath);
	}
}

function emptyAcq(landingPath: string): Acquisition {
	return {
		channel: 'Direct',
		source: '',
		medium: '',
		campaign: '',
		content: '',
		term: '',
		gclid: '',
		fbclid: '',
		referrer: '',
		landing_path: landingPath
	};
}

export function getAcquisition(landingPath: string): Acquisition {
	return captureAcquisition(landingPath);
}
