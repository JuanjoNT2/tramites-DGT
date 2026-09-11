import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isStaffRole } from '$lib/auth/roles';
import { rangeBoundsIso } from '$lib/admin/dates';
import type { DateRange } from '$lib/admin/types';
import { PROVEEDOR_TIPOS, isProveedorTipo } from '$lib/proveedor/scope';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { Solicitud } from '$lib/supabase/types';

export function requireGestor(locals: App.Locals) {
	if (!locals.user || !isStaffRole(locals.profile?.role)) {
		throw error(401, 'No autorizado');
	}
}

export type GestorSolicitudesFilter = {
	/** Tipo de trámite, o 'todos'. Los tipos del proveedor externo se ignoran siempre. */
	tipo?: string | null;
	/** Estado exacto (`nueva`, `en_curso`, …), o 'todos'. */
	estado?: string | null;
	/** Acota por fecha de creación. */
	range?: DateRange | null;
};

export async function fetchSolicitudes(filter: GestorSolicitudesFilter = {}): Promise<Solicitud[]> {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');

	let query = sb
		.from('solicitudes')
		.select('*')
		// Los distintivos ambientales son del proveedor externo: nunca salen aquí
		.not('tipo', 'in', `(${PROVEEDOR_TIPOS.join(',')})`)
		.order('created_at', { ascending: false })
		.limit(2000);

	const tipo = (filter.tipo || '').trim();
	if (tipo && tipo !== 'todos' && !isProveedorTipo(tipo)) query = query.eq('tipo', tipo);

	const estado = (filter.estado || '').trim();
	if (estado && estado !== 'todos') query = query.eq('status', estado);

	if (filter.range) {
		const { from, to } = rangeBoundsIso(filter.range);
		query = query.gte('created_at', from).lte('created_at', to);
	}

	const { data, error: err } = await query;
	if (err) throw error(500, err.message);
	return (data ?? []) as Solicitud[];
}

export async function fetchSolicitudById(id: string): Promise<Solicitud> {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');
	const { data, error: err } = await sb.from('solicitudes').select('*').eq('id', id).maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) throw error(404, 'Solicitud no encontrada');
	const sol = data as Solicitud;
	if (isProveedorTipo(sol.tipo)) throw error(404, 'Solicitud no encontrada');
	return sol;
}

export type GestorEvent = RequestEvent;
