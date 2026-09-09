import { randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { authEmailExists } from '$lib/auth/email-exists';
import { joinPersonName } from '$lib/cuenta/profile-prefill';
import { getServiceSupabase } from '$lib/supabase/admin';
import { notifyAdminUserRegistered } from '$lib/server/admin-notify';
import { sendAccountCredentialsEmail } from '$lib/server/mailer';

/** Por defecto ON: cuenta obligatoria en trámites. Desactivar con REQUIRE_ACCOUNT_FOR_TRAMITES=0. */
export function requireAccountForTramites(): boolean {
	const flag = env.REQUIRE_ACCOUNT_FOR_TRAMITES?.trim().toLowerCase();
	if (flag === '0' || flag === 'false' || flag === 'off' || flag === 'no') return false;
	return true;
}

export function generateAccountPassword(length = 18): string {
	const alphabet =
		'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*?';
	const bytes = randomBytes(length);
	let out = '';
	for (let i = 0; i < length; i++) {
		out += alphabet[bytes[i]! % alphabet.length];
	}
	return out;
}

export type EnsureAccountResult =
	| { ok: true; userId: string; created: boolean; emailSent: boolean }
	| { ok: false; code: 'ACCOUNT_EXISTS' | 'NO_EMAIL' | 'AUTH_ERROR'; error: string };

/**
 * Si no hay sesión: crea cuenta con password generada (permanente) o
 * falla si el email ya existe (hay que iniciar sesión).
 */
export async function ensureCitizenAccountForTramite(opts: {
	email: string | null | undefined;
	payload: Record<string, unknown>;
}): Promise<EnsureAccountResult> {
	const email = (opts.email || '').trim().toLowerCase();
	if (!email) {
		return {
			ok: false,
			code: 'NO_EMAIL',
			error: 'Necesitamos tu email para crear la cuenta y seguir el trámite.'
		};
	}

	const sb = getServiceSupabase();
	if (!sb) {
		return {
			ok: false,
			code: 'AUTH_ERROR',
			error: 'No se pudo crear la cuenta (Supabase no configurado).'
		};
	}

	const exists = await authEmailExists(sb, email);
	if (exists.exists) {
		return {
			ok: false,
			code: 'ACCOUNT_EXISTS',
			error:
				'Ya hay una cuenta con este email. Inicia sesión o recupera la contraseña si la has olvidado.'
		};
	}

	const password = generateAccountPassword();
	const p = opts.payload;
	const nombre = typeof p.nombre === 'string' ? p.nombre.trim() : '';
	const apellido1 = typeof p.apellido1 === 'string' ? p.apellido1.trim() : '';
	const apellido2 = typeof p.apellido2 === 'string' ? p.apellido2.trim() : '';
	const telefono =
		typeof p.telefono === 'string'
			? p.telefono.trim()
			: typeof p.phone === 'string'
				? p.phone.trim()
				: '';
	const nif =
		typeof p.nif === 'string'
			? p.nif.trim().toUpperCase().replace(/[\s-]/g, '')
			: '';
	const fullName = joinPersonName(nombre, apellido1, apellido2) || email.split('@')[0] || email;

	const { data, error } = await sb.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
		user_metadata: {
			full_name: fullName,
			nombre,
			apellido1,
			apellido2,
			telefono,
			nif,
			created_via: 'tramite_auto'
		}
	});

	if (error || !data.user?.id) {
		const msg = (error?.message || '').toLowerCase();
		if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
			return {
				ok: false,
				code: 'ACCOUNT_EXISTS',
				error:
					'Ya hay una cuenta con este email. Inicia sesión o recupera la contraseña si la has olvidado.'
			};
		}
		console.error('[auto-account] createUser', error?.message);
		return {
			ok: false,
			code: 'AUTH_ERROR',
			error: 'No se pudo crear tu cuenta. Inténtalo de nuevo o regístrate manualmente.'
		};
	}

	const userId = data.user.id;
	const { error: upErr } = await sb.from('profiles').upsert(
		{
			id: userId,
			email,
			full_name: fullName,
			nombre: nombre || null,
			apellido1: apellido1 || null,
			apellido2: apellido2 || null,
			telefono: telefono || null,
			nif: nif || null,
			role: 'user'
		},
		{ onConflict: 'id' }
	);
	if (upErr) console.error('[auto-account] profile upsert', upErr.message);

	const emailSent = await sendAccountCredentialsEmail({
		to: email,
		password,
		nombre: nombre || fullName
	});

	void notifyAdminUserRegistered({
		nombre: nombre || fullName,
		apellido1,
		apellido2,
		email
	});

	return { ok: true, userId, created: true, emailSent };
}
