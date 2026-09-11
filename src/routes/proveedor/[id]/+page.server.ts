import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listDocsForSolicitud } from '$lib/cuenta/data';
import { loadProveedorTramiteById } from '$lib/proveedor/data';
import {
	SOLICITUD_STATUSES,
	SOLICITUD_STATUS_LABELS,
	SOLICITUD_TIPO_LABELS
} from '$lib/supabase/types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const item = await loadProveedorTramiteById(params.id);
		const docs = await listDocsForSolicitud(item.id).catch(() => []);

		return {
			item,
			docs,
			label: SOLICITUD_TIPO_LABELS[item.tipo] || item.tipo,
			statuses: SOLICITUD_STATUSES,
			statusLabels: SOLICITUD_STATUS_LABELS
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, 'Error al cargar la solicitud');
	}
};
