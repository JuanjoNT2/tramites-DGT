import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const TYPES = new Set(['signup', 'email', 'recovery', 'invite', 'magiclink']);

function failKind(type: string, next: string): 'recovery' | 'invite' | 'confirm' {
	if (type === 'recovery' || next.includes('actualizar-password')) return 'recovery';
	if (type === 'invite' || next.includes('invite=1')) return 'invite';
	return 'confirm';
}

function successDest(type: string, next: string): string {
	if (type === 'recovery' || next.includes('actualizar-password')) {
		return '/auth/actualizar-password';
	}
	if (type === 'invite' || next.includes('invite=1')) return '/registro?invite=1';
	if (next.startsWith('/')) return next;
	return '/cuenta';
}

export const load: PageServerLoad = async ({ url }) => {
	const token_hash = url.searchParams.get('token_hash') || '';
	const code = url.searchParams.get('code') || '';
	const type = url.searchParams.get('type') || '';
	const nextRaw = url.searchParams.get('next') || '';
	const next = nextRaw.startsWith('/') ? nextRaw : '';

	if (!token_hash && !code) {
		throw redirect(303, '/login?error=confirm');
	}

	const kind = failKind(type, next);
	const title =
		kind === 'recovery'
			? 'Restablecer contraseña'
			: kind === 'invite'
				? 'Aceptar invitación'
				: 'Confirmar email';
	const lead =
		kind === 'recovery'
			? 'Pulsa el botón para continuar y elegir una nueva contraseña. Este paso evita que el correo invalide el enlace automáticamente.'
			: kind === 'invite'
				? 'Pulsa el botón para continuar y completar tu registro.'
				: 'Pulsa el botón para confirmar tu email y activar la cuenta.';

	return {
		token_hash,
		code,
		type: TYPES.has(type) ? type : kind === 'recovery' ? 'recovery' : 'email',
		next,
		kind,
		title,
		lead
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.supabase) {
			return fail(503, { error: 'Auth no configurada.' });
		}

		const form = await request.formData();
		const token_hash = String(form.get('token_hash') || '');
		const code = String(form.get('code') || '');
		const type = String(form.get('type') || '');
		const next = String(form.get('next') || '');

		if (code) {
			const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
			if (error) {
				console.error('[auth/verificar] exchangeCode', error.message);
				throw redirect(303, `/login?error=${failKind(type, next)}`);
			}
			throw redirect(303, successDest(type, next));
		}

		if (!token_hash || !TYPES.has(type)) {
			return fail(400, { error: 'Enlace incompleto. Solicita uno nuevo.' });
		}

		const { error } = await locals.supabase.auth.verifyOtp({
			token_hash,
			type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink'
		});
		if (error) {
			console.error('[auth/verificar] verifyOtp', type, error.message);
			throw redirect(303, `/login?error=${failKind(type, next)}`);
		}
		throw redirect(303, successDest(type, next));
	}
};
