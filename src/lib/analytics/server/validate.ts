import { Events } from '../events';

/** Definición única de conversión (capa MOD del informe). */
export const CONVERSION_EVENTS = new Set<string>([
	Events.FORM_SUBMITTED,
	Events.PAYMENT_STARTED,
	Events.PAYMENT_COMPLETED
]);

export const KNOWN_EVENTS = new Set<string>(Object.values(Events));

/** Props obligatorias por evento (contrato DEC + VAL). */
export const REQUIRED_PROPS: Record<string, string[]> = {
	[Events.PAGE_VIEW]: ['page_path', 'page_type', 'content_group'],
	[Events.CTA_CLICK]: ['cta_id', 'page_path'],
	[Events.FORM_STARTED]: ['tramite'],
	[Events.FORM_STEP_VIEWED]: ['tramite', 'step'],
	[Events.FORM_STEP_COMPLETED]: ['tramite', 'step'],
	[Events.FORM_ABANDONED]: ['tramite', 'step'],
	[Events.FORM_SUBMITTED]: ['tramite'],
	[Events.PAYMENT_STARTED]: ['tramite'],
	[Events.PAYMENT_COMPLETED]: ['tramite']
};

export type IncomingEvent = {
	event: string;
	visitor_id: string;
	session_id: string;
	consent: 'granted' | 'denied';
	ts?: string;
	props?: Record<string, unknown>;
	acquisition?: Record<string, unknown>;
};

export type ValidationResult =
	| { ok: true; event: IncomingEvent }
	| { ok: false; reason: string };

export function validateIncoming(body: unknown): ValidationResult {
	if (!body || typeof body !== 'object') return { ok: false, reason: 'body_invalid' };
	const b = body as Record<string, unknown>;

	const event = String(b.event || '');
	if (!event || !KNOWN_EVENTS.has(event)) return { ok: false, reason: 'unknown_event' };

	const visitor_id = String(b.visitor_id || '');
	const session_id = String(b.session_id || '');
	if (!visitor_id || visitor_id.length > 80) return { ok: false, reason: 'visitor_id_invalid' };
	if (!session_id || session_id.length > 80) return { ok: false, reason: 'session_id_invalid' };

	const consent = b.consent === 'denied' ? 'denied' : b.consent === 'granted' ? 'granted' : null;
	if (!consent) return { ok: false, reason: 'consent_invalid' };
	if (consent !== 'granted') return { ok: false, reason: 'consent_not_granted' };

	const props = (b.props && typeof b.props === 'object' ? b.props : {}) as Record<string, unknown>;
	const required = REQUIRED_PROPS[event] || [];
	for (const key of required) {
		if (props[key] === undefined || props[key] === null || props[key] === '') {
			return { ok: false, reason: `missing_prop:${key}` };
		}
	}

	const acquisition =
		b.acquisition && typeof b.acquisition === 'object'
			? (b.acquisition as Record<string, unknown>)
			: {};

	return {
		ok: true,
		event: {
			event,
			visitor_id,
			session_id,
			consent,
			ts: typeof b.ts === 'string' ? b.ts : new Date().toISOString(),
			props,
			acquisition
		}
	};
}

export function isConversionEvent(name: string): boolean {
	return CONVERSION_EVENTS.has(name);
}
