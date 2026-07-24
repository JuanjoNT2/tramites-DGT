import { json, type RequestHandler } from '@sveltejs/kit';
import {
	getUserSolicitud,
	listUserSolicitudes,
	requireUser,
	updateUserSolicitudPayload
} from '$lib/cuenta/data';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals);
	const id = url.searchParams.get('id');
	if (id) {
		const item = await getUserSolicitud(user.id, id);
		return json({ item });
	}
	const estado = (url.searchParams.get('estado') || 'todos') as
		| 'en_curso'
		| 'realizados'
		| 'todos';
	const items = await listUserSolicitudes(user.id, estado);
	return json({ items });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	let body: { id?: string; payload?: Record<string, unknown> };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}
	if (!body.id || !body.payload) {
		return json({ error: 'id y payload obligatorios' }, { status: 400 });
	}
	const item = await updateUserSolicitudPayload(user.id, body.id, body.payload);
	return json({ ok: true, item });
};
