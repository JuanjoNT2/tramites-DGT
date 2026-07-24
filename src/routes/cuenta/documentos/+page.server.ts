import type { PageServerLoad } from './$types';
import { listDocsForUser } from '$lib/cuenta/data';

export const load: PageServerLoad = async ({ locals }) => {
	const items = await listDocsForUser(locals.user!.id);
	return { items };
};
