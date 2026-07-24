import type { PageServerLoad } from './$types';
import { listVehiculos } from '$lib/cuenta/data';

export const load: PageServerLoad = async ({ locals }) => {
	const items = await listVehiculos(locals.user!.id);
	return { items };
};
