import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { passwordRecoveryRedirect } from '$lib/auth/urls';

import { isStaffRole } from '$lib/auth/roles';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(
			303,
			isStaffRole(locals.profile?.role) ? '/gestor/seguridad' : '/cuenta/seguridad'
		);
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		if (!locals.supabase) {
			return fail(503, { error: 'Auth no configurada.' });
		}
		const form = await request.formData();
		const email = String(form.get('email') || '')
			.trim()
			.toLowerCase();
		if (!email) {
			return fail(400, { error: 'Indica tu email.', email: '' } as const);
		}

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: passwordRecoveryRedirect(url)
		});

		// No revelar si el email existe
		if (error) {
			console.error('[recuperar-password]', error.message);
		}

		return {
			ok: true,
			email,
			message:
				'Si ese email está registrado, recibirás un enlace para restablecer la contraseña. Revisa también spam.'
		} as const;
	}
};
