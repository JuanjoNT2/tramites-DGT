import type { PageServerLoad } from './$types';
import { listUserSolicitudes } from '$lib/cuenta/data';

export const load: PageServerLoad = async ({ locals, url }) => {
	const estadoParam = url.searchParams.get('estado') || 'en_curso';
	const estado =
		estadoParam === 'realizados' ? 'realizados' : estadoParam === 'todos' ? 'todos' : 'en_curso';
	const items = await listUserSolicitudes(locals.user!.id, estado);
	return { estado, items };
};
