import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const next = url.searchParams.get('next') || '/';
		throw redirect(303, next);
	}
	return { next: url.searchParams.get('next') || '/' };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.supabase) {
			return fail(503, { error: 'Auth no configurada (faltan variables PUBLIC_SUPABASE_*).' });
		}
		const form = await request.formData();
		const email = String(form.get('email') || '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') || '');
		const next = String(form.get('next') || '/');

		if (!email || !password) {
			return fail(400, { error: 'Email y contraseña son obligatorios.', email } as const);
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			return fail(400, {
				error:
					error.message.includes('Email not confirmed')
						? 'Debes verificar tu email antes de iniciar sesión.'
						: 'Credenciales incorrectas.',
				email
			} as const);
		}

		throw redirect(303, next.startsWith('/') ? next : '/');
	}
};
