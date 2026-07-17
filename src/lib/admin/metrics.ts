import { analyticsStoreMode, getAnalyticsStore } from '$lib/analytics/server/get-store';
import { recomputeDailyForRange } from '$lib/analytics/server/model';
import { isConversionEvent } from '$lib/analytics/server/validate';
import { daysInRange } from '$lib/admin/dates';
import {
	mockAds,
	mockChannels,
	mockEvents,
	mockGsc,
	mockOverview
} from './mock-data';
import type {
	AdsRow,
	ChannelRow,
	DateRange,
	EventRow,
	GscRow,
	OverviewMetrics
} from './types';

export type MetricsSource = 'own' | 'demo';

async function loadDaily(range: DateRange) {
	const store = getAnalyticsStore();
	let daily = await store.queryDaily({ start: range.startDate, end: range.endDate });
	if (!daily.length) {
		// Recalcular desde crudo si aún no hay agregados
		daily = await recomputeDailyForRange(store, range.startDate, range.endDate);
	}
	return daily;
}

export async function getOverview(range: DateRange): Promise<OverviewMetrics & { store: string }> {
	try {
		const daily = await loadDaily(range);
		if (!daily.length) {
			return { ...mockOverview(range), store: analyticsStoreMode() };
		}

		const users = new Set<string>();
		const sessions = new Set<string>();
		// Preferir crudo para usuarios/sesiones únicos reales
		const store = getAnalyticsStore();
		const raw = await store.queryRaw({ start: range.startDate, end: range.endDate });
		for (const ev of raw) {
			users.add(ev.visitor_id);
			sessions.add(ev.session_id);
		}

		const eventCount = daily.reduce((s, r) => s + r.event_count, 0);
		const conversions = daily.reduce((s, r) => s + r.conversions, 0);
		const pageViews = daily
			.filter((r) => r.event_name === 'page_view')
			.reduce((s, r) => s + r.event_count, 0);
		const sessionCount = sessions.size || daily.reduce((s, r) => s + r.sessions, 0);
		const engaged = Math.round(sessionCount * 0.55);

		return {
			activeUsers: users.size || daily.reduce((s, r) => Math.max(s, r.users), 0),
			sessions: sessionCount,
			screenPageViews: pageViews || eventCount,
			engagedSessions: engaged,
			conversions,
			eventCount,
			engagementRate: sessionCount ? engaged / sessionCount : 0,
			source: 'own',
			store: analyticsStoreMode()
		};
	} catch (e) {
		console.warn('[metrics/own] overview fallback', e);
		return { ...mockOverview(range), store: 'demo' };
	}
}

export async function getChannels(range: DateRange): Promise<ChannelRow[]> {
	try {
		const daily = await loadDaily(range);
		if (!daily.length) return mockChannels(range);

		const map = new Map<string, ChannelRow>();
		for (const r of daily) {
			const cur = map.get(r.channel) || {
				channel: r.channel,
				sessions: 0,
				users: 0,
				engagedSessions: 0,
				conversions: 0,
				eventCount: 0
			};
			cur.eventCount += r.event_count;
			cur.conversions += r.conversions;
			cur.sessions = Math.max(cur.sessions, r.sessions);
			cur.users = Math.max(cur.users, r.users);
			map.set(r.channel, cur);
		}

		// Mejor estimación de sesiones/usuarios por canal desde crudo
		const store = getAnalyticsStore();
		const raw = await store.queryRaw({ start: range.startDate, end: range.endDate });
		const byCh = new Map<string, { users: Set<string>; sessions: Set<string> }>();
		for (const ev of raw) {
			const ch = ev.channel || 'Direct';
			let acc = byCh.get(ch);
			if (!acc) {
				acc = { users: new Set(), sessions: new Set() };
				byCh.set(ch, acc);
			}
			acc.users.add(ev.visitor_id);
			acc.sessions.add(ev.session_id);
		}
		for (const [ch, sets] of byCh) {
			const row = map.get(ch);
			if (row) {
				row.users = sets.users.size;
				row.sessions = sets.sessions.size;
				row.engagedSessions = Math.round(row.sessions * 0.55);
			}
		}

		return [...map.values()].sort((a, b) => b.sessions - a.sessions);
	} catch (e) {
		console.warn('[metrics/own] channels fallback', e);
		return mockChannels(range);
	}
}

export async function getEvents(range: DateRange): Promise<EventRow[]> {
	try {
		const daily = await loadDaily(range);
		if (!daily.length) return mockEvents(range);

		const map = new Map<string, EventRow>();
		for (const r of daily) {
			const cur = map.get(r.event_name) || {
				eventName: r.event_name,
				eventCount: 0,
				users: 0,
				isConversion: isConversionEvent(r.event_name),
				byChannel: []
			};
			cur.eventCount += r.event_count;
			cur.users = Math.max(cur.users, r.users);
			const ch = cur.byChannel.find((c) => c.channel === r.channel);
			if (ch) ch.eventCount += r.event_count;
			else cur.byChannel.push({ channel: r.channel, eventCount: r.event_count });
			map.set(r.event_name, cur);
		}

		return [...map.values()]
			.map((e) => ({
				...e,
				byChannel: e.byChannel.sort((a, b) => b.eventCount - a.eventCount)
			}))
			.sort((a, b) => b.eventCount - a.eventCount);
	} catch (e) {
		console.warn('[metrics/own] events fallback', e);
		return mockEvents(range);
	}
}

export async function getAds(range: DateRange): Promise<{ rows: AdsRow[]; source: 'live' | 'demo' }> {
	try {
		const store = getAnalyticsStore();
		const ext = await store.queryExternal({
			source: 'google_ads',
			start: range.startDate,
			end: range.endDate
		});
		if (!ext.length) return { rows: mockAds(range), source: 'demo' };
		const byCampaign = new Map<string, AdsRow>();
		for (const row of ext) {
			const campaign = String(row.metrics.campaign || row.channel);
			const cur = byCampaign.get(campaign) || {
				campaign,
				impressions: 0,
				clicks: 0,
				cost: 0,
				ctr: 0
			};
			cur.impressions += Number(row.metrics.impressions || 0);
			cur.clicks += Number(row.metrics.clicks || 0);
			cur.cost += Number(row.metrics.cost || 0);
			byCampaign.set(campaign, cur);
		}
		const rows = [...byCampaign.values()].map((r) => ({
			...r,
			ctr: r.impressions ? r.clicks / r.impressions : 0
		}));
		return { rows, source: 'live' };
	} catch {
		return { rows: mockAds(range), source: 'demo' };
	}
}

export async function getGsc(range: DateRange): Promise<{ rows: GscRow[]; source: 'live' | 'demo' }> {
	try {
		const store = getAnalyticsStore();
		const ext = await store.queryExternal({
			source: 'search_console',
			start: range.startDate,
			end: range.endDate
		});
		if (!ext.length) return { rows: mockGsc(range), source: 'demo' };
		const rows: GscRow[] = ext.map((r) => ({
			query: String(r.metrics.query || r.channel),
			clicks: Number(r.metrics.clicks || 0),
			impressions: Number(r.metrics.impressions || 0),
			ctr: Number(r.metrics.ctr || 0),
			position: Number(r.metrics.position || 0)
		}));
		return { rows, source: 'live' };
	} catch {
		return { rows: mockGsc(range), source: 'demo' };
	}
}

export function ga4Configured(): boolean {
	// Compat: el panel ahora prioriza almacén propio; GA4 ya no es la fuente.
	return false;
}

export function ownStoreHasDataHint(range: DateRange): string {
	const days = daysInRange(range);
	return `Almacén propio (${analyticsStoreMode()}) · ventana ${days}d`;
}
