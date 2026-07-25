import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import { listVehiculos } from '$lib/cuenta/data';
import {
	SOLICITUD_STATUS_LABELS,
	SOLICITUD_TIPO_LABELS,
	type Profile,
	type Solicitud,
	type SolicitudStatus
} from '$lib/supabase/types';
import { classifySolicitud } from '$lib/gestor/clients';

export const load: PageServerLoad = async ({ params }) => {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');

	const { data: profile, error: pErr } = await sb
		.from('profiles')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();

	if (pErr) throw error(500, pErr.message);
	if (!profile) throw error(404, 'Cliente no encontrado');

	const [{ data: sols }, vehiculos] = await Promise.all([
		sb
			.from('solicitudes')
			.select('*')
			.eq('user_id', params.id)
			.order('created_at', { ascending: false })
			.limit(200),
		listVehiculos(params.id).catch(() => [])
	]);

	const solicitudes = (sols ?? []) as Solicitud[];
	const pendientes = solicitudes.filter((s) => classifySolicitud(String(s.status)) === 'pendiente');
	const finalizados = solicitudes.filter((s) => classifySolicitud(String(s.status)) === 'finalizado');

	return {
		profile: profile as Profile,
		vehiculos,
		pendientes,
		finalizados,
		solicitudes,
		tipoLabels: SOLICITUD_TIPO_LABELS,
		statusLabels: SOLICITUD_STATUS_LABELS as Record<SolicitudStatus, string>
	};
};
