import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const path = url.pathname.replace(/\/$/, '') || '/';
	let vista = 'inicio';
	if (path.startsWith('/proveedor/seguridad')) vista = 'seguridad';
	else if (path.startsWith('/proveedor/ajustes')) vista = 'ajustes';

	return {
		email: locals.user?.email ?? null,
		role: locals.profile?.role ?? null,
		vista
	};
};
