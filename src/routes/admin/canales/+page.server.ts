import { resolveDateRange } from '$lib/admin/dates';
import { getChannels } from '$lib/admin/metrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url);
	const channels = await getChannels(range);
	return { range, channels };
};
