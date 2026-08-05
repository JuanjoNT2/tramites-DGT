import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isStaffRole } from '$lib/auth/roles';
import { authCallbackUrl } from '$lib/auth/urls';
import { getServiceSupabase } from '$lib/supabase/admin';
import { validateEmail } from '$lib/utils/validators';

async function resolvePostLoginRedirect(
	userId: string,
	nextRaw: string | null | undefined
): Promise<string> {
	const next = (nextRaw || '').startsWith('/') ? nextRaw! : '';
	const sb = getServiceSupabase();
	let role: string | null = null;
	if (sb) {
		const { data } = await sb.from('profiles').select('role').eq('id', userId).maybeSingle();
		role = (data as { role?: string } | null)?.role ?? null;
	}
	if (isStaffRole(role)) {
		if (next.startsWith('/gestor')) return next;
		return '/gestor';
	}
	if (next.startsWith('/')) return next;
	return '/cuenta';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const dest = await resolvePostLoginRedirect(
			locals.user.id,
			url.searchParams.get('next')
		);
		throw redirect(303, dest);
	}
	const emailParam = (url.searchParams.get('email') || '').trim().toLowerCase();
	return {
		next: url.searchParams.get('next') || '/',
		email: emailParam,
		urlError: url.searchParams.get('error') || null
	};
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

		const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			const unconfirmed = /not confirmed|email_not_confirmed/i.test(error.message || '');
			return fail(400, {
				error: unconfirmed
					? 'Debes verificar tu email antes de iniciar sesión.'
					: 'Email o contraseña incorrectos. Si te volviste a registrar, la contraseña no cambia: usa recuperar contraseña o la que tenías al confirmar la cuenta.',
				email,
				needsConfirm: unconfirmed
			} as const);
		}

		const userId = data.user?.id;
		const dest = userId
			? await resolvePostLoginRedirect(userId, next)
			: next.startsWith('/')
				? next
				: '/cuenta';
		throw redirect(303, dest);
	},

	resend: async ({ request, locals, url }) => {
		if (!locals.supabase) {
			return fail(503, { error: 'Auth no configurada (faltan variables PUBLIC_SUPABASE_*).' });
		}
		const form = await request.formData();
		const email = String(form.get('email') || '')
			.trim()
			.toLowerCase();
		const emailErr = validateEmail(email);
		if (emailErr) {
			return fail(400, { error: emailErr, email, needsConfirm: true } as const);
		}

		const emailRedirectTo = authCallbackUrl(url);
		const { error } = await locals.supabase.auth.resend({
			type: 'signup',
			email,
			options: { emailRedirectTo }
		});

		if (error) {
			console.error('[login/resend]', error.message, error.code);
			return fail(400, {
				error:
					'No se pudo reenviar. Espera un minuto e inténtalo de nuevo, o usa recuperar contraseña.',
				email,
				needsConfirm: true
			} as const);
		}

		return {
			ok: true as const,
			email,
			message: 'Si la cuenta existe y no está verificada, te hemos enviado un nuevo correo. Revisa bandeja y spam.'
		};
	}
};
