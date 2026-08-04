import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isStaffRole } from '$lib/auth/roles';
import { getServiceSupabase } from '$lib/supabase/admin';

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
		email: emailParam
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
			return fail(400, {
				error:
					error.message.includes('Email not confirmed')
						? 'Debes verificar tu email antes de iniciar sesión.'
						: 'Credenciales incorrectas.',
				email
			} as const);
		}

		const userId = data.user?.id;
		const dest = userId
			? await resolvePostLoginRedirect(userId, next)
			: next.startsWith('/')
				? next
				: '/cuenta';
		throw redirect(303, dest);
	}
};
