import { resolveDateRange } from '$lib/admin/dates';
import { getChannels, getOverview } from '$lib/admin/metrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url);
	const [overview, channels] = await Promise.all([getOverview(range), getChannels(range)]);
	return { range, overview, channels: channels.slice(0, 5) };
};
