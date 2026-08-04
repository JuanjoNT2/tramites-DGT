import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authCallbackUrl } from '$lib/auth/urls';
import { getServiceSupabase } from '$lib/supabase/admin';
import {
	normalizePhone,
	validateEmail,
	validateNifNie,
	validatePhone,
	validateRequired
} from '$lib/utils/validators';

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
		const telefonoRaw = String(form.get('telefono') || '').trim();
		const nifRaw = String(form.get('nif') || '')
			.trim()
			.toUpperCase()
			.replace(/[\s-]/g, '');

		const fields = {
			email,
			full_name: fullName,
			telefono: telefonoRaw,
			nif: nifRaw
		} as const;

		const nameErr = validateRequired(fullName, 'El nombre completo');
		const emailErr = validateEmail(email);
		const phoneErr = validatePhone(telefonoRaw);
		const nifErr = validateNifNie(nifRaw);
		const firstErr = nameErr || emailErr || phoneErr || nifErr;
		if (firstErr) {
			return fail(400, { error: firstErr, ...fields } as const);
		}
		if (!password) {
			return fail(400, { error: 'La contraseña es obligatoria.', ...fields } as const);
		}
		if (password.length < 8) {
			return fail(400, {
				error: 'La contraseña debe tener al menos 8 caracteres.',
				...fields
			} as const);
		}

		const telefono = normalizePhone(telefonoRaw);
		const nif = nifRaw;

		const emailRedirectTo = authCallbackUrl(url);
		let data;
		let error;
		try {
			const result = await locals.supabase.auth.signUp({
				email,
				password,
				options: {
					data: { full_name: fullName, telefono, nif },
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
				...fields
			} as const);
		}

		if (error) {
			const detail = [
				typeof error.message === 'string' && error.message !== '{}' ? error.message : null,
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
				...fields
			} as const);
		}

		if (data.user?.id) {
			const sb = getServiceSupabase();
			if (sb) {
				await sb
					.from('profiles')
					.update({
						email,
						full_name: fullName,
						telefono,
						nif
					})
					.eq('id', data.user.id)
					.then(({ error: upErr }) => {
						if (upErr) console.error('[registro] profile update', upErr.message);
					});
			}
		}

		if (data.session) {
			throw redirect(303, '/cuenta/datos');
		}

		return {
			ok: true as const,
			...fields,
			message:
				'Revisa tu correo para verificar la cuenta. Después podrás iniciar sesión.'
		};
	}
};
