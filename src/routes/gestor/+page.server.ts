import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import {
	SOLICITUD_STATUSES,
	SOLICITUD_STATUS_LABELS,
	SOLICITUD_TIPOS,
	SOLICITUD_TIPO_LABELS,
	type Solicitud
} from '$lib/supabase/types';

export const load: PageServerLoad = async ({ url }) => {
	const tipo = url.searchParams.get('tipo') || 'todos';
	const status = url.searchParams.get('status') || 'todos';
	const q = (url.searchParams.get('q') || '').trim().toLowerCase();
	const sb = getServiceSupabase();

	if (!sb) {
		return {
			tipo,
			status,
			q,
			items: [] as Solicitud[],
			counts: {} as Record<string, number>,
			error: 'Supabase no configurado.',
			tipos: SOLICITUD_TIPOS,
			labels: SOLICITUD_TIPO_LABELS,
			statuses: SOLICITUD_STATUSES,
			statusLabels: SOLICITUD_STATUS_LABELS
		};
	}

	let query = sb
		.from('solicitudes')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(500);

	if (tipo !== 'todos') query = query.eq('tipo', tipo);
	if (status !== 'todos') query = query.eq('status', status);

	const [{ data, error }, countRes] = await Promise.all([
		query,
		sb.from('solicitudes').select('tipo')
	]);

	let items = (data ?? []) as Solicitud[];
	if (q) {
		items = items.filter((s) => {
			const mat = String(s.payload?.matricula ?? '').toLowerCase();
			return (
				(s.email || '').toLowerCase().includes(q) ||
				mat.includes(q) ||
				(s.user_id || '').toLowerCase().includes(q) ||
				s.id.toLowerCase().includes(q)
			);
		});
	}

	const counts: Record<string, number> = {};
	for (const row of countRes.data ?? []) {
		const t = (row as { tipo: string }).tipo;
		counts[t] = (counts[t] || 0) + 1;
	}

	return {
		tipo,
		status,
		q,
		items,
		counts,
		error: error?.message ?? countRes.error?.message ?? null,
		tipos: SOLICITUD_TIPOS,
		labels: SOLICITUD_TIPO_LABELS,
		statuses: SOLICITUD_STATUSES,
		statusLabels: SOLICITUD_STATUS_LABELS
	};
};
