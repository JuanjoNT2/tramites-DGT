import { listEventDeclarations } from '$lib/analytics';
import { resolveDateRange } from '$lib/admin/dates';
import { toCsv } from '$lib/admin/export-csv';
import { getAds, getChannels, getEvents, getGsc, getOverview } from '$lib/admin/metrics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const range = resolveDateRange(url);
	const type = url.searchParams.get('type') || 'overview';
	let rows: Record<string, unknown>[] = [];
	let filename = `analytics-${type}-${range.startDate}_${range.endDate}.csv`;

	if (type === 'overview') {
		const o = await getOverview(range);
		rows = [
			{
				start: range.startDate,
				end: range.endDate,
				preset: range.preset,
				source: o.source,
				activeUsers: o.activeUsers,
				sessions: o.sessions,
				screenPageViews: o.screenPageViews,
				engagedSessions: o.engagedSessions,
				conversions: o.conversions,
				eventCount: o.eventCount,
				engagementRate: o.engagementRate
			}
		];
	} else if (type === 'channels') {
		rows = (await getChannels(range)) as unknown as Record<string, unknown>[];
	} else if (type === 'events') {
		const only = url.searchParams.get('only');
		let events = await getEvents(range);
		if (only === 'conversions') events = events.filter((e) => e.isConversion);
		if (only === 'user') events = events.filter((e) => !e.isConversion);
		rows = events.map((e) => ({
			eventName: e.eventName,
			eventCount: e.eventCount,
			users: e.users,
			isConversion: e.isConversion,
			channels: e.byChannel.map((c) => `${c.channel}:${c.eventCount}`).join('|')
		}));
	} else if (type === 'ads') {
		rows = (await getAds(range)).rows as unknown as Record<string, unknown>[];
	} else if (type === 'gsc') {
		rows = (await getGsc(range)).rows as unknown as Record<string, unknown>[];
	} else if (type === 'tagging') {
		rows = listEventDeclarations().map((p) => ({
			path: p.path,
			page_type: p.page_type,
			content_group: p.content_group,
			tramite: p.tramite,
			label: p.label,
			events: p.events.join('|'),
			ctas: p.ctas.join('|')
		}));
		filename = 'tagging-declaration.csv';
	} else {
		return new Response('Unknown type', { status: 400 });
	}

	const csv = toCsv(rows);
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
