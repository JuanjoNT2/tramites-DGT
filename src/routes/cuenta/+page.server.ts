import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authCallbackUrl } from '$lib/email/resend';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?next=/cuenta');
	return {
		email: locals.user.email,
		profile: locals.profile,
		emailConfirmed: Boolean(locals.user.email_confirmed_at)
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		if (locals.supabase) await locals.supabase.auth.signOut();
		throw redirect(303, '/');
	},

	resend: async ({ locals, url }) => {
		if (!locals.user?.email || !locals.supabase) {
			return fail(401, { error: 'No hay sesión.' });
		}

		const { error } = await locals.supabase.auth.resend({
			type: 'signup',
			email: locals.user.email,
			options: { emailRedirectTo: authCallbackUrl(url) }
		});

		if (error) {
			return fail(400, { error: error.message });
		}

		return { ok: true as const, message: 'Te hemos reenviado el email de verificación.' };
	}
};
