import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authCallbackUrl } from '$lib/auth/urls';
import { joinPersonName } from '$lib/cuenta/profile-prefill';
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
		const password2 = String(form.get('password2') || '');
		const nombre = String(form.get('nombre') || '').trim();
		const apellido1 = String(form.get('apellido1') || '').trim();
		const apellido2 = String(form.get('apellido2') || '').trim();
		const telefonoRaw = String(form.get('telefono') || '').trim();
		const nifRaw = String(form.get('nif') || '')
			.trim()
			.toUpperCase()
			.replace(/[\s-]/g, '');

		const fullName = joinPersonName(nombre, apellido1, apellido2);

		const fields = {
			email,
			nombre,
			apellido1,
			apellido2,
			telefono: telefonoRaw,
			nif: nifRaw
		} as const;

		const nameErr =
			validateRequired(nombre, 'El nombre') ||
			validateRequired(apellido1, 'El primer apellido') ||
			validateRequired(apellido2, 'El segundo apellido');
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
		if (password !== password2) {
			return fail(400, { error: 'Las contraseñas no coinciden.', ...fields } as const);
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
					data: {
						full_name: fullName,
						nombre,
						apellido1,
						apellido2,
						telefono,
						nif
					},
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
						nombre,
						apellido1,
						apellido2,
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
