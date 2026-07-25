import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const path = url.pathname;
	let vista = url.searchParams.get('vista') || 'todos';
	if (path.startsWith('/gestor/seguridad')) vista = 'seguridad';
	else if (path.startsWith('/gestor/tramites')) {
		const tv = url.searchParams.get('vista') || 'pendientes';
		vista = `tramites_${tv}`;
	} else if (path.startsWith('/gestor/cliente')) vista = 'todos';
	else if (/^\/gestor\/[^/]+$/.test(path) && path !== '/gestor') vista = 'tramites_pendientes';

	return {
		email: locals.user?.email ?? null,
		role: locals.profile?.role ?? null,
		vista
	};
};
