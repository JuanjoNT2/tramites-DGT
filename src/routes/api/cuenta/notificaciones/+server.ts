import { json, type RequestHandler } from '@sveltejs/kit';
import {
	countUnreadNotificaciones,
	listNotificaciones,
	markAllNotificacionesRead,
	markNotificacionRead,
	requireUser
} from '$lib/cuenta/data';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	const [items, unread] = await Promise.all([
		listNotificaciones(user.id),
		countUnreadNotificaciones(user.id)
	]);
	return json({ items, unread });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	let body: { id?: string; all?: boolean };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}
	if (body.all) {
		await markAllNotificacionesRead(user.id);
		return json({ ok: true });
	}
	if (!body.id) return json({ error: 'id obligatorio' }, { status: 400 });
	await markNotificacionRead(user.id, body.id);
	return json({ ok: true });
};
