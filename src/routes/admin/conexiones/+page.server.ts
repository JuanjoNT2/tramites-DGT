import { getConnectorStatuses } from '$lib/admin/connectors';
import { resolveDateRange } from '$lib/admin/dates';
import { getAds, getGsc } from '$lib/admin/metrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url);
	const connectors = getConnectorStatuses();
	const [ads, gsc] = await Promise.all([getAds(range), getGsc(range)]);
	return { range, connectors, ads, gsc };
};
