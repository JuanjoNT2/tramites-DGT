import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fetchSolicitudById } from '$lib/gestor/access';
import { getProfileById, listDocsForSolicitud } from '$lib/cuenta/data';
import { canChangeSolicitudStatus } from '$lib/auth/roles';
import {
	SOLICITUD_STATUSES,
	SOLICITUD_STATUS_LABELS,
	SOLICITUD_TIPO_LABELS
} from '$lib/supabase/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const item = await fetchSolicitudById(params.id);
		const [docs, citizen] = await Promise.all([
			listDocsForSolicitud(item.id).catch(() => []),
			item.user_id ? getProfileById(item.user_id) : Promise.resolve(null)
		]);
		return {
			item,
			docs,
			citizen,
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
