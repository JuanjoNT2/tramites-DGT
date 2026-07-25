import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/recuperar-password');
	}
	return { email: locals.user.email ?? null };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.supabase || !locals.user) {
			return fail(401, { error: 'Sesión no válida. Solicita un nuevo enlace de recuperación.' });
		}
		const form = await request.formData();
		const password = String(form.get('password') || '');
		const password2 = String(form.get('password2') || '');

		if (password.length < 8) {
			return fail(400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
		}
		if (password !== password2) {
			return fail(400, { error: 'Las contraseñas no coinciden.' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) {
			return fail(400, { error: error.message || 'No se pudo actualizar la contraseña.' });
		}

		return {
			ok: true,
			message: 'Contraseña actualizada. Ya puedes usar la nueva en el próximo acceso.'
		} as const;
	}
};
