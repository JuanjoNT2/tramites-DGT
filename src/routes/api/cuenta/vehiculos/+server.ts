import { json, type RequestHandler } from '@sveltejs/kit';
import {
	createVehiculo,
	deleteVehiculo,
	listVehiculos,
	requireUser,
	updateVehiculo
} from '$lib/cuenta/data';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireUser(locals);
	const items = await listVehiculos(user.id);
	return json({ items });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}
	const matricula = String(body.matricula || '').trim();
	if (!matricula) return json({ error: 'Matrícula obligatoria' }, { status: 400 });

	const item = await createVehiculo(user.id, {
		matricula,
		tipo: body.tipo ? String(body.tipo) : 'coche',
		marca: body.marca ? String(body.marca) : undefined,
		modelo: body.modelo ? String(body.modelo) : undefined,
		bastidor: body.bastidor ? String(body.bastidor) : undefined
	});
	return json({ ok: true, item });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}
	const id = String(body.id || '');
	if (!id) return json({ error: 'id obligatorio' }, { status: 400 });

	const item = await updateVehiculo(user.id, id, {
		matricula: body.matricula != null ? String(body.matricula) : undefined,
		tipo: body.tipo != null ? String(body.tipo) : undefined,
		marca: body.marca != null ? String(body.marca) : undefined,
		modelo: body.modelo != null ? String(body.modelo) : undefined,
		bastidor: body.bastidor != null ? String(body.bastidor) : undefined
	});
	return json({ ok: true, item });
};

export const DELETE: RequestHandler = async ({ request, locals, url }) => {
	const user = requireUser(locals);
	const id = url.searchParams.get('id') || '';
	if (!id) {
		try {
			const body = await request.json();
			if (body?.id) {
				await deleteVehiculo(user.id, String(body.id));
				return json({ ok: true });
			}
		} catch {
			/* empty */
		}
		return json({ error: 'id obligatorio' }, { status: 400 });
	}
	await deleteVehiculo(user.id, id);
	return json({ ok: true });
};
