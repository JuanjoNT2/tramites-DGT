import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authCallbackUrl } from '$lib/email/resend';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
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

		const emailRedirectTo = authCallbackUrl(url);
		let data;
		let error;
		try {
			const result = await locals.supabase.auth.signUp({
				email,
				password,
				options: {
					data: { full_name: fullName },
					emailRedirectTo
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
			const detail = [
				typeof error.message === 'string' && error.message !== '{}'
					? error.message
					: null,
				error.code,
				error.status,
				!error.message || error.message === '{}'
					? JSON.stringify({ name: error.name, status: error.status, code: error.code })
					: null
			]
				.filter(Boolean)
				.join(' · ');
			console.error('[registro] signUp error', { error, emailRedirectTo });
			return fail(400, {
				error:
					detail ||
					'No se pudo crear la cuenta. Revisa SMTP SendGrid y Auth Logs en Supabase.',
				email,
				full_name: fullName
			} as const);
		}

		// Si el proyecto no exige confirmación, ya hay sesión
		if (data.session) {
			throw redirect(303, '/');
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
