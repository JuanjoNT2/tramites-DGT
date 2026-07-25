import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fetchSolicitudById } from '$lib/gestor/access';
import { getProfileById, listDocsForSolicitud, listVehiculos } from '$lib/cuenta/data';
import { canChangeSolicitudStatus } from '$lib/auth/roles';
import {
	SOLICITUD_STATUSES,
	SOLICITUD_STATUS_LABELS,
	SOLICITUD_TIPO_LABELS
} from '$lib/supabase/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const item = await fetchSolicitudById(params.id);
		const [docs, citizen, vehiculos] = await Promise.all([
			listDocsForSolicitud(item.id).catch(() => []),
			item.user_id ? getProfileById(item.user_id) : Promise.resolve(null),
			item.user_id ? listVehiculos(item.user_id).catch(() => []) : Promise.resolve([])
		]);

		const payloadMatricula =
			typeof item.payload?.matricula === 'string'
				? item.payload.matricula.trim().toUpperCase()
				: '';

		const vehiculosOrdenados = [...vehiculos].sort((a, b) => {
			const aMatch = payloadMatricula && a.matricula.toUpperCase() === payloadMatricula ? 0 : 1;
			const bMatch = payloadMatricula && b.matricula.toUpperCase() === payloadMatricula ? 0 : 1;
			return aMatch - bMatch;
		});

		return {
			item,
			docs,
			citizen,
			vehiculos: vehiculosOrdenados,
			label: SOLICITUD_TIPO_LABELS[item.tipo] || item.tipo,
			canChangeStatus: canChangeSolicitudStatus(locals.profile),
			statuses: SOLICITUD_STATUSES,
			statusLabels: SOLICITUD_STATUS_LABELS
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, 'Error al cargar la solicitud');
	}
};
