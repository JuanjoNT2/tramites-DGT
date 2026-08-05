import type { PageServerLoad } from './$types';
import {
	canUserUploadDocs,
	getUserSolicitud,
	listDocsForSolicitud
} from '$lib/cuenta/data';
import { getPayloadAccessToken } from '$lib/pago/access';

export const load: PageServerLoad = async ({ locals, params }) => {
	const item = await getUserSolicitud(locals.user!.id, params.id);
	const docs = await listDocsForSolicitud(item.id).catch(() => []);
	const token = getPayloadAccessToken(item.payload as Record<string, unknown>);
	const needsPayment = item.status === 'pendiente_pago' || item.status === 'nueva';
	const pagoUrl = needsPayment
		? token
			? `/pago/${item.id}?t=${encodeURIComponent(token)}`
			: `/pago/${item.id}`
		: null;
	return {
		item,
		docs,
		canUpload: canUserUploadDocs(String(item.status)),
		pagoUrl
	};
};
