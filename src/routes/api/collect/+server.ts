import { json } from '@sveltejs/kit';
import { getAnalyticsStore } from '$lib/analytics/server/get-store';
import { buildDailyAggregates } from '$lib/analytics/server/model';
import { toStoredEvent } from '$lib/analytics/server/store';
import { validateIncoming } from '$lib/analytics/server/validate';
import type { RequestHandler } from './$types';

/** Rate limit muy simple en memoria por IP (capa VAL / defensa del endpoint). */
const hits = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;

function allow(ip: string): boolean {
	const now = Date.now();
	const cur = hits.get(ip);
	if (!cur || now - cur.t > WINDOW_MS) {
		hits.set(ip, { n: 1, t: now });
		return true;
	}
	cur.n += 1;
	return cur.n <= MAX_PER_WINDOW;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	if (!allow(ip)) {
		return json({ ok: false, reason: 'rate_limited' }, { status: 429 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, reason: 'json_invalid' }, { status: 400 });
	}

	const validated = validateIncoming(body);
	if (!validated.ok) {
		return json({ ok: false, reason: validated.reason }, { status: 400 });
	}

	try {
		const store = getAnalyticsStore();
		const stored = toStoredEvent(validated.event);
		await store.appendRaw(stored);
		const day = (stored.ts || stored.received_at).slice(0, 10);
		// Recalcular agregados del día desde el crudo (modelo absoluto, no incremental ciego)
		const dayRaw = await store.queryRaw({ start: day, end: day });
		await store.upsertDaily(buildDailyAggregates(dayRaw));
		return json({ ok: true, id: stored.id, day });
	} catch (e) {
		console.error('[collect]', e);
		return json({ ok: false, reason: 'store_error' }, { status: 500 });
	}
};

/** Health / discovery (sin escribir). */
export const GET: RequestHandler = async () => {
	return json({
		ok: true,
		endpoint: '/api/collect',
		note: 'POST first-party analytics events (Performanze capas ING+VAL+ALM+MOD)'
	});
};
