import { json, type RequestHandler } from '@sveltejs/kit';
import { getServiceSupabase } from '$lib/supabase/admin';
import { validateEmail } from '$lib/utils/validators';

/** Comprueba si ya hay un perfil con ese email (para invitar a iniciar sesión en el wizard). */
export const POST: RequestHandler = async ({ request, locals }) => {
	let body: { email?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
	const emailErr = validateEmail(email);
	if (emailErr) return json({ exists: false });

	// Si ya hay sesión con ese mismo email, no hace falta pedir login
	const sessionEmail = locals.user?.email?.trim().toLowerCase() || '';
	if (sessionEmail && sessionEmail === email) {
		return json({ exists: false, sameSession: true });
	}

	const sb = getServiceSupabase();
	if (!sb) {
		return json({ exists: false });
	}

	// profiles.email (comparación case-insensitive)
	const { data, error } = await sb
		.from('profiles')
		.select('id')
		.ilike('email', email)
		.limit(1)
		.maybeSingle();

	if (error) {
		console.error('[email-exists]', error.message);
		return json({ error: 'No se pudo comprobar el email' }, { status: 503 });
	}

	return json({ exists: Boolean(data?.id) });
};
