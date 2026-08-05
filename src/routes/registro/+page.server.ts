import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authCallbackUrl } from '$lib/auth/urls';
import { joinPersonName, namePartsFromProfile } from '$lib/cuenta/profile-prefill';
import { getServiceSupabase } from '$lib/supabase/admin';
import {
	normalizePhone,
	validateEmail,
	validateNifNie,
	validatePhone,
	validateRequired
} from '$lib/utils/validators';

function profileIncomplete(profile: App.Locals['profile']): boolean {
	if (!profile) return true;
	const names = namePartsFromProfile(profile);
	return (
		!names.nombre ||
		!names.apellido1 ||
		!names.apellido2 ||
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

		const nameErr =
			validateRequired(nombre, 'El nombre') ||
			validateRequired(apellido1, 'El primer apellido') ||
			validateRequired(apellido2, 'El segundo apellido');
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

			throw redirect(303, '/cuenta');
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
				error: `Error de conexión con Auth: ${msg || 'desconocido'}`,
				...fields
			} as const);
		}

		if (error) {
			const already =
				error.code === 'user_already_exists' ||
				/already|registered|exists|existe/i.test(error.message || '');
			if (already) {
				const { error: resendErr } = await locals.supabase.auth.resend({
					type: 'signup',
					email,
					options: { emailRedirectTo }
				});
				if (!resendErr) {
					return {
						ok: true as const,
						...fields,
						message:
							'Esa cuenta ya existía. Si aún no está verificada, te hemos reenviado el correo de confirmación. Revisa bandeja y spam.'
					};
				}
				return fail(400, {
					error:
						'Esa cuenta ya existe. Prueba a iniciar sesión o recuperar la contraseña. Si no te llega el correo de verificación, escríbenos.',
					...fields
				} as const);
			}
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

		// Anti-enumeración: email ya registrado → user con identities vacías y sin session
		const fakeDuplicate =
			data.user &&
			!data.session &&
			Array.isArray(data.user.identities) &&
			data.user.identities.length === 0;

		if (fakeDuplicate) {
			const { error: resendErr } = await locals.supabase.auth.resend({
				type: 'signup',
				email,
				options: { emailRedirectTo }
			});
			console.info('[registro] email ya existía; resend', {
				email,
				resendOk: !resendErr,
				resendErr: resendErr?.message
			});
			return {
				ok: true as const,
				...fields,
				message: resendErr
					? 'Si esa cuenta ya existe y no está verificada, usa «Reenviar confirmación» en el login o recupera la contraseña.'
					: 'Esa cuenta ya existía. Te hemos reenviado el correo de confirmación (revisa bandeja y spam). Si ya la verificaste, inicia sesión.'
			};
		}

		if (data.user?.id) {
			const sb = getServiceSupabase();
			if (!sb) {
				console.error(
					'[registro] profile upsert omitido: falta SUPABASE_SERVICE_ROLE_KEY'
				);
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
