import { json, type RequestHandler } from '@sveltejs/kit';
import { requireUser, updateProfileFields } from '$lib/cuenta/data';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const fields: Record<string, unknown> = {};
	if (typeof body.full_name === 'string') fields.full_name = body.full_name.trim();
	if (typeof body.telefono === 'string') fields.telefono = body.telefono.trim();
	if (typeof body.nif === 'string') fields.nif = body.nif.trim().toUpperCase();
	if (body.direccion && typeof body.direccion === 'object') {
		fields.direccion = body.direccion;
	}

	const profile = await updateProfileFields(user.id, fields);
	return json({ ok: true, profile });
};
