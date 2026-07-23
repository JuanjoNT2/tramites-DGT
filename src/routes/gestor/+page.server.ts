import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import { SOLICITUD_TIPOS, SOLICITUD_TIPO_LABELS, type Solicitud } from '$lib/supabase/types';

export const load: PageServerLoad = async ({ url }) => {
	const tipo = url.searchParams.get('tipo') || 'todos';
	const sb = getServiceSupabase();

	if (!sb) {
		return {
			tipo,
			items: [] as Solicitud[],
			counts: {} as Record<string, number>,
			error: 'Supabase no configurado.',
			tipos: SOLICITUD_TIPOS,
			labels: SOLICITUD_TIPO_LABELS
		};
	}

	let query = sb
		.from('solicitudes')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(500);

	if (tipo !== 'todos') {
		query = query.eq('tipo', tipo);
	}

	const [{ data, error }, countRes] = await Promise.all([
		query,
		sb.from('solicitudes').select('tipo')
	]);

	const counts: Record<string, number> = {};
	for (const row of countRes.data ?? []) {
		const t = (row as { tipo: string }).tipo;
		counts[t] = (counts[t] || 0) + 1;
	}

	return {
		tipo,
		items: (data ?? []) as Solicitud[],
		counts,
		error: error?.message ?? countRes.error?.message ?? null,
		tipos: SOLICITUD_TIPOS,
		labels: SOLICITUD_TIPO_LABELS
	};
};
