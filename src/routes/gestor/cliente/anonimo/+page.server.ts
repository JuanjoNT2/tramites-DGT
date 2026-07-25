import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import {
	SOLICITUD_STATUS_LABELS,
	SOLICITUD_TIPO_LABELS,
	type Solicitud,
	type SolicitudStatus
} from '$lib/supabase/types';
import { classifySolicitud } from '$lib/gestor/clients';

export const load: PageServerLoad = async ({ url }) => {
	const email = (url.searchParams.get('email') || '').trim().toLowerCase();
	if (!email) throw error(400, 'Falta email');

	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');

	const { data, error: err } = await sb
		.from('solicitudes')
		.select('*')
		.ilike('email', email)
		.is('user_id', null)
		.order('created_at', { ascending: false })
		.limit(200);

	if (err) throw error(500, err.message);

	const solicitudes = (data ?? []) as Solicitud[];
	const pendientes = solicitudes.filter((s) => classifySolicitud(String(s.status)) === 'pendiente');
	const finalizados = solicitudes.filter((s) => classifySolicitud(String(s.status)) === 'finalizado');

	return {
		email,
		pendientes,
		finalizados,
		tipoLabels: SOLICITUD_TIPO_LABELS,
		statusLabels: SOLICITUD_STATUS_LABELS as Record<SolicitudStatus, string>
	};
};
