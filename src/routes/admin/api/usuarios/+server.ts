import { json, type RequestHandler } from '@sveltejs/kit';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { UserRole } from '$lib/supabase/types';

const ALLOWED: UserRole[] = ['user', 'gestor', 'admin'];

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) {
		return json({ error: 'No autorizado' }, { status: 401 });
	}

	const sb = getServiceSupabase();
	if (!sb) {
		return json({ error: 'Supabase no configurado' }, { status: 503 });
	}

	let body: { id?: string; role?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const id = body.id;
	const role = body.role as UserRole | undefined;
	if (!id || !role || !ALLOWED.includes(role)) {
		return json({ error: 'id y role (user|gestor|admin) requeridos' }, { status: 400 });
	}

	const { data, error } = await sb
		.from('profiles')
		.update({ role })
		.eq('id', id)
		.select('id, email, role')
		.maybeSingle();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}
	if (!data) {
		return json({ error: 'Perfil no encontrado' }, { status: 404 });
	}

	return json({ ok: true, ...data });
};
