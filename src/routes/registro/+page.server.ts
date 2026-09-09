import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authEmailExists, getAuthUserByEmail } from '$lib/auth/email-exists';
import { authCallbackUrl } from '$lib/auth/urls';
import { joinPersonName, namePartsFromProfile } from '$lib/cuenta/profile-prefill';
import { notifyAdminUserRegistered } from '$lib/server/admin-notify';
import { getServiceSupabase } from '$lib/supabase/admin';
import {
	isCifDocumento,
	normalizePhone,
	validateEmail,
	validateNifNie,
	validatePhone,
	validateRequired
} from '$lib/utils/validators';

function alreadyExistsPayload<T extends Record<string, unknown>>(fields: T) {
	return {
		alreadyExists: true as const,
		error:
			'Ya hay una cuenta con este email. Inicia sesión o recupera la contraseña si la has olvidado.',
		...fields
	};
}

function profileIncomplete(profile: App.Locals['profile']): boolean {
	if (!profile) return true;
	const names = namePartsFromProfile(profile);
	const empresa = isCifDocumento(profile.nif || '');
	return (
		!names.nombre ||
		(!empresa && !names.apellido1) ||
		!profile.telefono?.trim() ||
		!profile.nif?.trim()
	);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const inviteFlag = url.searchParams.get('invite') === '1';

	if (locals.user) {
		const incomplete = profileIncomplete(locals.profile);
		if (inviteFlag || incomplete) {
			const names = namePartsFromProfile(locals.profile);
			return {
				inviteMode: true as const,
				email: locals.user.email ?? '',
				nombre: names.nombre,
				apellido1: names.apellido1,
				apellido2: names.apellido2,
				telefono: locals.profile?.telefono || '',
				nif: locals.profile?.nif || ''
			};
		}
		throw redirect(303, '/cuenta');
	}

	if (inviteFlag) {
		// Enlace de invitación sin sesión válida
		throw redirect(303, '/login?error=invite');
	}

	return {
		inviteMode: false as const,
		email: '',
		nombre: '',
		apellido1: '',
		apellido2: '',
		telefono: '',
		nif: ''
	};
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
		const inviteMode = Boolean(locals.user);

		const fields = {
			email: inviteMode ? (locals.user?.email || email).toLowerCase() : email,
			nombre,
			apellido1,
			apellido2,
			telefono: telefonoRaw,
			nif: nifRaw,
			inviteMode
		} as const;

		const empresa = isCifDocumento(nifRaw);
		const nameErr =
			validateRequired(nombre, empresa ? 'La razón social' : 'El nombre') ||
			(empresa ? null : validateRequired(apellido1, 'El primer apellido'));
		const emailErr = inviteMode ? null : validateEmail(email);
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
		if (form.get('privacy') !== 'on') {
			return fail(400, { error: 'Debes aceptar la política de privacidad.', ...fields } as const);
		}

		const telefono = normalizePhone(telefonoRaw);
		const nif = nifRaw;

		// Invitación aceptada: completar perfil + contraseña (ya hay sesión)
		if (locals.user) {
			const { error: pwErr } = await locals.supabase.auth.updateUser({
				password,
				data: {
					full_name: fullName,
					nombre,
					apellido1,
					apellido2,
					telefono,
					nif
				}
			});
			if (pwErr) {
				return fail(400, {
					error: pwErr.message || 'No se pudo guardar la contraseña.',
					...fields
				} as const);
			}

			const sb = getServiceSupabase();
			if (!sb) {
				console.error(
					'[registro/invite] profile upsert omitido: falta SUPABASE_SERVICE_ROLE_KEY'
				);
			} else {
				const { error: upErr } = await sb.from('profiles').upsert(
					{
						id: locals.user.id,
						email: fields.email,
						full_name: fullName,
						nombre,
						apellido1,
						apellido2,
						telefono,
						nif
					},
					{ onConflict: 'id' }
				);
				if (upErr) {
					console.error('[registro/invite] profile upsert failed', upErr.message);
				}
			}

			void notifyAdminUserRegistered({
				nombre,
				apellido1,
				apellido2,
				email: fields.email
			});

			throw redirect(303, '/cuenta');
		}

		const sbAdmin = getServiceSupabase();
		const emailTaken = sbAdmin
			? (await authEmailExists(sbAdmin, email)).exists
			: Boolean(await getAuthUserByEmail(email));
		if (emailTaken) {
			return fail(400, alreadyExistsPayload(fields));
		}

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
				error:
					'No se pudo enviar el email de confirmación. Revisa el SMTP de Resend en Supabase Auth.',
				...fields
			} as const);
		}

		if (error) {
			const already =
				error.code === 'user_already_exists' ||
				/already|registered|exists|existe/i.test(error.message || '');
			if (already) {
				return fail(400, alreadyExistsPayload(fields));
			}
			const smtpFail =
				error.status === 500 ||
				error.name === 'AuthRetryableFetchError' ||
				/confirmation email|sending|smtp/i.test(error.message || '');
			console.error('[registro] signUp error', {
				name: error.name,
				status: error.status,
				code: error.code,
				message: error.message,
				emailRedirectTo
			});
			return fail(400, {
				error: smtpFail
					? 'No se pudo enviar el email de confirmación. El SMTP de Auth (Resend) no está bien configurado.'
					: 'No se pudo crear la cuenta. Inténtalo de nuevo o escríbenos si sigue fallando.',
				...fields
			} as const);
		}

		const fakeDuplicate =
			data.user &&
			!data.session &&
			Array.isArray(data.user.identities) &&
			data.user.identities.length === 0;

		if (fakeDuplicate) {
			return fail(400, alreadyExistsPayload(fields));
		}

		if (data.user?.id) {
			const sb = getServiceSupabase();
			if (!sb) {
				console.error('[registro] profile upsert omitido: falta SUPABASE_SERVICE_ROLE_KEY');
			} else {
				const { error: upErr } = await sb.from('profiles').upsert(
					{
						id: data.user.id,
						email,
						full_name: fullName,
						nombre,
						apellido1,
						apellido2,
						telefono,
						nif,
						role: 'user'
					},
					{ onConflict: 'id' }
				);
				if (upErr) {
					console.error('[registro] profile upsert failed', upErr.message, upErr.code);
				}
			}
			void notifyAdminUserRegistered({ nombre, apellido1, apellido2, email });
		}

		if (data.session) {
			throw redirect(303, '/cuenta/datos');
		}

		return {
			ok: true as const,
			...fields,
			message: 'Revisa tu correo para verificar la cuenta. Después podrás iniciar sesión.'
		};
	}
};
