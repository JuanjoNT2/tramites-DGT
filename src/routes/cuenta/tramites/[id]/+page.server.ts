import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getUserSolicitud,
	listDocsForSolicitud,
	updateUserSolicitudPayload
} from '$lib/cuenta/data';

export const load: PageServerLoad = async ({ locals, params }) => {
	const item = await getUserSolicitud(locals.user!.id, params.id);
	const docs = await listDocsForSolicitud(item.id).catch(() => []);
	return { item, docs, canEdit: item.status === 'nueva' };
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
