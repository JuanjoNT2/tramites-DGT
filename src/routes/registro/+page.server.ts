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
		let data;
		let error;
		try {
			const result = await locals.supabase.auth.signUp({
				email,
				password,
				options: {
					data: { full_name: fullName },
					emailRedirectTo: `${origin}/auth/callback`
				}
			});
			data = result.data;
			error = result.error;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			console.error('[registro] signUp threw', e);
			return fail(500, {
				error: `Error de conexión con Auth: ${msg || 'desconocido'}`,
				email,
				full_name: fullName
			} as const);
		}

		if (error) {
			const detail = [error.message, error.code, error.status].filter(Boolean).join(' · ');
			console.error('[registro] signUp error', error);
			return fail(400, {
				error: detail || 'No se pudo crear la cuenta (sin detalle de Auth).',
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
