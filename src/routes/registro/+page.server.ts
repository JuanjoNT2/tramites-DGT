import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { siteOrigin } from '$lib/email/resend';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/cuenta');
	return {};
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
		const fullName = String(form.get('full_name') || '').trim();

		if (!email || !password) {
			return fail(400, {
				error: 'Email y contraseña son obligatorios.',
				email,
				full_name: fullName
			} as const);
		}
		if (password.length < 8) {
			return fail(400, {
				error: 'La contraseña debe tener al menos 8 caracteres.',
				email,
				full_name: fullName
			} as const);
		}

		const origin = siteOrigin();
		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { full_name: fullName },
				emailRedirectTo: `${origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, {
				error: error.message || 'No se pudo crear la cuenta.',
				email,
				full_name: fullName
			} as const);
		}

		// Si el proyecto no exige confirmación, ya hay sesión
		if (data.session) {
			throw redirect(303, '/cuenta');
		}

		return {
			ok: true as const,
			email,
			full_name: fullName,
			message:
				'Revisa tu correo para verificar la cuenta. Después podrás iniciar sesión.'
		};
	}
};
