import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fetchSolicitudById } from '$lib/gestor/access';
import { SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const item = await fetchSolicitudById(params.id);
		return {
			item,
			label: SOLICITUD_TIPO_LABELS[item.tipo] || item.tipo
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, 'Error al cargar la solicitud');
	}
};
