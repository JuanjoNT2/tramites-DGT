import type { PageServerLoad } from './$types';
import { listNotificaciones } from '$lib/cuenta/data';

export const load: PageServerLoad = async ({ locals }) => {
	const items = await listNotificaciones(locals.user!.id);
	return { items };
};
