import { env } from '$env/dynamic/private';
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

/** True when GA4 property + credentials look configured. */
export function ga4Configured(): boolean {
	return Boolean(env.GA4_PROPERTY_ID && (env.GA4_ACCESS_TOKEN || env.GOOGLE_SERVICE_ACCOUNT_EMAIL));
}

/**
 * Fetch overview metrics. Uses GA4 Data API when configured; otherwise demo data.
 * Live fetch is best-effort: failures fall back to demo with source still marked carefully.
 */
export async function getOverview(range: DateRange): Promise<OverviewMetrics> {
	if (!ga4Configured()) return mockOverview(range);

	try {
		const rows = await runGa4Report(range, {
			metrics: [
				'activeUsers',
				'sessions',
				'screenPageViews',
				'engagedSessions',
				'conversions',
				'eventCount'
			]
		});
		const m = rows[0]?.metricValues ?? [];
		const sessions = num(m[1]);
		const engaged = num(m[3]);
		return {
			activeUsers: num(m[0]),
			sessions,
			screenPageViews: num(m[2]),
			engagedSessions: engaged,
			conversions: num(m[4]),
			eventCount: num(m[5]),
			engagementRate: sessions ? engaged / sessions : 0,
			source: 'ga4'
		};
	} catch (e) {
		console.warn('[admin/ga4] overview fallback', e);
		return mockOverview(range);
	}
}

export async function getChannels(range: DateRange): Promise<ChannelRow[]> {
	if (!ga4Configured()) return mockChannels(range);
	try {
		const rows = await runGa4Report(range, {
			dimensions: ['sessionDefaultChannelGroup'],
			metrics: ['sessions', 'activeUsers', 'engagedSessions', 'conversions', 'eventCount']
		});
		return rows
			.map((r) => ({
				channel: r.dimensionValues?.[0]?.value || 'Unassigned',
				sessions: num(r.metricValues?.[0]),
				users: num(r.metricValues?.[1]),
				engagedSessions: num(r.metricValues?.[2]),
				conversions: num(r.metricValues?.[3]),
				eventCount: num(r.metricValues?.[4])
			}))
			.sort((a, b) => b.sessions - a.sessions);
	} catch (e) {
		console.warn('[admin/ga4] channels fallback', e);
		return mockChannels(range);
	}
}

export async function getEvents(range: DateRange): Promise<EventRow[]> {
	if (!ga4Configured()) return mockEvents(range);
	try {
		const rows = await runGa4Report(range, {
			dimensions: ['eventName'],
			metrics: ['eventCount', 'totalUsers']
		});
		const conversionNames = new Set(
			(env.GA4_CONVERSION_EVENTS || 'form_submitted,payment_started')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		);
		const base = rows.map((r) => {
			const eventName = r.dimensionValues?.[0]?.value || '(not set)';
			return {
				eventName,
				eventCount: num(r.metricValues?.[0]),
				users: num(r.metricValues?.[1]),
				isConversion: conversionNames.has(eventName),
				byChannel: [] as Array<{ channel: string; eventCount: number }>
			};
		});

		// Optional channel breakdown for conversion events
		try {
			const cross = await runGa4Report(range, {
				dimensions: ['eventName', 'sessionDefaultChannelGroup'],
				metrics: ['eventCount'],
				dimensionFilter: {
					filter: {
						fieldName: 'eventName',
						inListFilter: {
							values: [...conversionNames]
						}
					}
				}
			});
			const map = new Map<string, Array<{ channel: string; eventCount: number }>>();
			for (const r of cross) {
				const ev = r.dimensionValues?.[0]?.value || '';
				const ch = r.dimensionValues?.[1]?.value || 'Unassigned';
				const list = map.get(ev) || [];
				list.push({ channel: ch, eventCount: num(r.metricValues?.[0]) });
				map.set(ev, list);
			}
			for (const row of base) {
				row.byChannel = (map.get(row.eventName) || []).sort((a, b) => b.eventCount - a.eventCount);
			}
		} catch {
			/* optional */
		}

		return base.sort((a, b) => b.eventCount - a.eventCount);
	} catch (e) {
		console.warn('[admin/ga4] events fallback', e);
		return mockEvents(range);
	}
}

export async function getAds(_range: DateRange): Promise<{ rows: AdsRow[]; source: 'live' | 'demo' }> {
	if (!env.GOOGLE_ADS_DEVELOPER_TOKEN || !env.GOOGLE_ADS_CUSTOMER_ID || !env.GA4_ACCESS_TOKEN) {
		return { rows: mockAds(_range), source: 'demo' };
	}
	// Live Ads API wiring requires google-ads library; keep demo until fully configured.
	return { rows: mockAds(_range), source: 'demo' };
}

export async function getGsc(_range: DateRange): Promise<{ rows: GscRow[]; source: 'live' | 'demo' }> {
	if (!env.GSC_SITE_URL || !env.GA4_ACCESS_TOKEN) {
		return { rows: mockGsc(_range), source: 'demo' };
	}
	return { rows: mockGsc(_range), source: 'demo' };
}

function num(v: { value?: string } | undefined): number {
	return Number(v?.value || 0) || 0;
}

type Ga4ReportOpts = {
	metrics: string[];
	dimensions?: string[];
	dimensionFilter?: unknown;
};

async function runGa4Report(range: DateRange, opts: Ga4ReportOpts) {
	const property = env.GA4_PROPERTY_ID!;
	const token = env.GA4_ACCESS_TOKEN;
	if (!token) {
		throw new Error('GA4_ACCESS_TOKEN required for live GA4 reports');
	}

	const body: Record<string, unknown> = {
		dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
		metrics: opts.metrics.map((name) => ({ name })),
		dimensions: (opts.dimensions || []).map((name) => ({ name }))
	};
	if (opts.dimensionFilter) body.dimensionFilter = opts.dimensionFilter;

	const res = await fetch(
		`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}
	);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`GA4 API ${res.status}: ${text.slice(0, 300)}`);
	}
	const json = (await res.json()) as {
		rows?: Array<{
			dimensionValues?: Array<{ value?: string }>;
			metricValues?: Array<{ value?: string }>;
		}>;
	};
	return json.rows || [];
}
