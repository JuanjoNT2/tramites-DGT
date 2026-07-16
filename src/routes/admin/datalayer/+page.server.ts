import { DATALAYER_CONTRACT } from '$lib/admin/datalayer-contract';
import { resolveDateRange } from '$lib/admin/dates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url);
	return { range, contract: DATALAYER_CONTRACT };
};
