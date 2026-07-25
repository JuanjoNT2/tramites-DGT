import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	canUserUploadDocs,
	getUserSolicitud,
	listDocsForSolicitud,
	updateUserSolicitudPayload
} from '$lib/cuenta/data';
import { getPayloadAccessToken } from '$lib/pago/access';

export const load: PageServerLoad = async ({ locals, params }) => {
	const item = await getUserSolicitud(locals.user!.id, params.id);
	const docs = await listDocsForSolicitud(item.id).catch(() => []);
	const token = getPayloadAccessToken(item.payload as Record<string, unknown>);
	const needsPayment =
		item.status === 'pendiente_pago' || item.status === 'nueva';
	const pagoUrl = needsPayment
		? token
			? `/pago/${item.id}?t=${encodeURIComponent(token)}`
			: `/pago/${item.id}`
		: null;
	return {
		item,
		docs,
		canEdit: item.status === 'nueva',
		canUpload: canUserUploadDocs(String(item.status)),
		pagoUrl
	};
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		const form = await request.formData();
		const raw = String(form.get('payload_json') || '');
		let payload: Record<string, unknown>;
		try {
			payload = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'JSON de payload inválido' });
		}
		try {
			const item = await updateUserSolicitudPayload(locals.user!.id, params.id, payload);
			return { ok: true as const, item };
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Error al guardar' });
		}
	}
};
