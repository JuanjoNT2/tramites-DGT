/**
 * Identidad anónima + sesión (capas IDE del informe Performanze).
 * visitor_id: persistente; session_id: expira por inactividad.
 */
import { browser } from '$app/environment';

const VISITOR_KEY = 'tdgt_vid';
const SESSION_KEY = 'tdgt_sid';
const SESSION_TS_KEY = 'tdgt_sid_ts';
/** 30 min de inactividad = nueva sesión */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function uuid(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getVisitorId(): string {
	if (!browser) return '';
	try {
		let id = localStorage.getItem(VISITOR_KEY);
		if (!id) {
			id = uuid();
			localStorage.setItem(VISITOR_KEY, id);
		}
		return id;
	} catch {
		return uuid();
	}
}

export function getSessionId(): string {
	if (!browser) return '';
	try {
		const now = Date.now();
		const last = Number(sessionStorage.getItem(SESSION_TS_KEY) || 0);
		let sid = sessionStorage.getItem(SESSION_KEY);
		if (!sid || !last || now - last > SESSION_TIMEOUT_MS) {
			sid = uuid();
			sessionStorage.setItem(SESSION_KEY, sid);
			// Nueva sesión → forzar recaptura de adquisición
			sessionStorage.removeItem('tdgt_acq');
			sessionStorage.removeItem('tdgt_acq_locked');
		}
		sessionStorage.setItem(SESSION_TS_KEY, String(now));
		return sid;
	} catch {
		return uuid();
	}
}

export function touchSession(): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
	} catch {
		/* ignore */
	}
}
