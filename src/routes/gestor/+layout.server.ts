import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const path = url.pathname.replace(/\/$/, '') || '/';
	let vista = 'inicio';
	if (path.startsWith('/gestor/seguridad')) vista = 'seguridad';
	else if (path.startsWith('/gestor/tramites')) {
		const tv = url.searchParams.get('vista') || 'pendientes';
		vista = `tramites_${tv}`;
	} else if (path.startsWith('/gestor/usuarios')) {
		vista = url.searchParams.get('vista') || 'usuarios';
	} else if (path.startsWith('/gestor/cliente')) vista = 'usuarios';
	else if (/^\/gestor\/[^/]+$/.test(path) && path !== '/gestor') vista = 'tramites_pendientes';
	else if (path === '/gestor') vista = 'inicio';

	return {
		email: locals.user?.email ?? null,
		role: locals.profile?.role ?? null,
		vista
	};
};
