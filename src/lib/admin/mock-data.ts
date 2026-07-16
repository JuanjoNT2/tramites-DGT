import { daysInRange } from './dates';
import type {
	AdsRow,
	ChannelRow,
	DateRange,
	EventRow,
	GscRow,
	OverviewMetrics
} from './types';

const CHANNELS = [
	'Organic Search',
	'Paid Search',
	'Direct',
	'Referral',
	'Organic Social',
	'Paid Social',
	'Email',
	'Unassigned'
] as const;

const CONVERSION_EVENTS = new Set(['form_submitted', 'payment_started']);

function seedFromRange(range: DateRange): number {
	const s = range.startDate + range.endDate;
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	return h || 1;
}

function mulberry32(a: number) {
	return function () {
		let t = (a += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function mockOverview(range: DateRange): OverviewMetrics {
	const days = daysInRange(range);
	const rnd = mulberry32(seedFromRange(range));
	const sessions = Math.round(days * (80 + rnd() * 120));
	const activeUsers = Math.round(sessions * (0.55 + rnd() * 0.25));
	const screenPageViews = Math.round(sessions * (2.2 + rnd() * 1.4));
	const engagedSessions = Math.round(sessions * (0.45 + rnd() * 0.25));
	const conversions = Math.round(sessions * (0.02 + rnd() * 0.04));
	const eventCount = Math.round(sessions * (4 + rnd() * 3));
	return {
		activeUsers,
		sessions,
		screenPageViews,
		engagedSessions,
		conversions,
		eventCount,
		engagementRate: sessions ? engagedSessions / sessions : 0,
		source: 'demo'
	};
}

export function mockChannels(range: DateRange): ChannelRow[] {
	const overview = mockOverview(range);
	const rnd = mulberry32(seedFromRange(range) + 9);
	const weights = CHANNELS.map(() => 0.4 + rnd());
	const sum = weights.reduce((a, b) => a + b, 0);
	return CHANNELS.map((channel, i) => {
		const w = weights[i] / sum;
		const sessions = Math.round(overview.sessions * w);
		const users = Math.round(overview.activeUsers * w * (0.85 + rnd() * 0.2));
		const engagedSessions = Math.round(sessions * (0.4 + rnd() * 0.3));
		const conversions = Math.round(overview.conversions * w);
		const eventCount = Math.round(overview.eventCount * w);
		return { channel, sessions, users, engagedSessions, conversions, eventCount };
	}).sort((a, b) => b.sessions - a.sessions);
}

export function mockEvents(range: DateRange): EventRow[] {
	const channels = mockChannels(range);
	const rnd = mulberry32(seedFromRange(range) + 21);
	const names = [
		'page_view',
		'cta_click',
		'form_started',
		'form_step_viewed',
		'form_step_completed',
		'form_abandoned',
		'form_submitted',
		'payment_started',
		'scroll',
		'file_download'
	];
	return names
		.map((eventName) => {
			const eventCount = Math.round(200 + rnd() * 4000 * (eventName === 'page_view' ? 2 : 0.4));
			const users = Math.round(eventCount * (0.35 + rnd() * 0.4));
			const byChannel = channels.slice(0, 5).map((c) => ({
				channel: c.channel,
				eventCount: Math.round(eventCount * (c.sessions / Math.max(1, channels[0].sessions)) * (0.3 + rnd()))
			}));
			return {
				eventName,
				eventCount,
				users,
				isConversion: CONVERSION_EVENTS.has(eventName),
				byChannel
			};
		})
		.sort((a, b) => b.eventCount - a.eventCount);
}

export function mockAds(range: DateRange): AdsRow[] {
	const rnd = mulberry32(seedFromRange(range) + 44);
	const campaigns = [
		'Transferencia - Search',
		'Informe DGT - Search',
		'Etiqueta - Performance Max',
		'Brand - Exact',
		'Remarketing - Display'
	];
	return campaigns.map((campaign) => {
		const impressions = Math.round(1000 + rnd() * 40000);
		const clicks = Math.round(impressions * (0.02 + rnd() * 0.06));
		const cost = Math.round(clicks * (0.35 + rnd() * 1.8) * 100) / 100;
		return {
			campaign,
			impressions,
			clicks,
			cost,
			ctr: impressions ? clicks / impressions : 0
		};
	});
}

export function mockGsc(range: DateRange): GscRow[] {
	const rnd = mulberry32(seedFromRange(range) + 77);
	const queries = [
		'transferencia vehiculo online',
		'informe dgt',
		'duplicado carnet conducir',
		'etiqueta medioambiental dgt',
		'cancelacion reserva dominio',
		'tramites dgt online',
		'cambio nombre coche'
	];
	return queries.map((query) => {
		const impressions = Math.round(200 + rnd() * 8000);
		const clicks = Math.round(impressions * (0.03 + rnd() * 0.12));
		return {
			query,
			clicks,
			impressions,
			ctr: impressions ? clicks / impressions : 0,
			position: Math.round((3 + rnd() * 25) * 10) / 10
		};
	});
}

export { CONVERSION_EVENTS };
