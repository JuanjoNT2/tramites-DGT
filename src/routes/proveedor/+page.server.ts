import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formatRangeLabel, resolveDateRange } from '$lib/admin/dates';
import { contarPorEstado, loadProveedorTramites, toProveedorResumen } from '$lib/proveedor/data';
import { getProveedorReportConfig } from '$lib/server/proveedor-report';

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url, 'month');
	const solicitudes = await loadProveedorTramites(range);
	const config = await getProveedorReportConfig();

	return {
		range,
		rangeLabel: formatRangeLabel(range),
		items: solicitudes.map(toProveedorResumen),
		total: solicitudes.length,
		porEstado: contarPorEstado(solicitudes),
		envioAutomatico: config.enabled,
		frecuencia: config.frecuencia
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		if (locals.supabase) await locals.supabase.auth.signOut();
		throw redirect(303, '/login');
	}
};
