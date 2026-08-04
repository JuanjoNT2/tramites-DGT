import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadGestorDashboard, parseDashboardFilters } from '$lib/gestor/stats';

export const load: PageServerLoad = async ({ url }) => {
	// Compat: antiguos filtros de usuarios vivían en /gestor?vista=
	const vista = url.searchParams.get('vista');
	if (vista) {
		const q = url.searchParams.get('q');
		const params = new URLSearchParams({ vista });
		if (q) params.set('q', q);
		throw redirect(303, `/gestor/usuarios?${params}`);
	}

	const filters = parseDashboardFilters(url);
	const dashboard = await loadGestorDashboard(filters);

	return { dashboard };
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		if (locals.supabase) await locals.supabase.auth.signOut();
		throw redirect(303, '/login');
	}
};
