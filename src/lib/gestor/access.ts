import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isStaffRole } from '$lib/auth/roles';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { Solicitud } from '$lib/supabase/types';

export function requireGestor(locals: App.Locals) {
	if (!locals.user || !isStaffRole(locals.profile?.role)) {
		throw error(401, 'No autorizado');
	}
}

export async function fetchSolicitudes(tipo: string | null): Promise<Solicitud[]> {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');

	let query = sb.from('solicitudes').select('*').order('created_at', { ascending: false }).limit(2000);
	if (tipo && tipo !== 'todos') query = query.eq('tipo', tipo);

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
	return data as Solicitud;
}

export type GestorEvent = RequestEvent;
