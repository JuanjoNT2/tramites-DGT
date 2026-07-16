import { resolveDateRange } from '$lib/admin/dates';
import { getEvents } from '$lib/admin/metrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url);
	const only = url.searchParams.get('only');
	let events = await getEvents(range);
	if (only === 'conversions') events = events.filter((e) => e.isConversion);
	if (only === 'user') events = events.filter((e) => !e.isConversion);
	return { range, events, only: only || 'all' };
};
