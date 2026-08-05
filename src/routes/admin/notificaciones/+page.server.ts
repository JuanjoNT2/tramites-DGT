import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { resolveDateRange } from '$lib/admin/dates';
import {
	DEFAULT_ADMIN_NOTIFY_EMAIL,
	getAdminNotifyEmail,
	setAdminNotifyEmail
} from '$lib/server/site-settings';
import { validateEmail } from '$lib/utils/validators';

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url);
	let email = DEFAULT_ADMIN_NOTIFY_EMAIL;
	let loadError: string | null = null;
	try {
		email = await getAdminNotifyEmail();
	} catch (e) {
		loadError = e instanceof Error ? e.message : 'No se pudo cargar el email';
	}
	return { range, email, defaultEmail: DEFAULT_ADMIN_NOTIFY_EMAIL, loadError };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		const email = String(fd.get('email') || '').trim().toLowerCase();
		const err = validateEmail(email);
		if (err) return fail(400, { error: err, email });

		try {
			const saved = await setAdminNotifyEmail(email);
			return { ok: true as const, email: saved, message: 'Email de notificaciones guardado.' };
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error al guardar';
			const schema =
				/does not exist|schema cache|PGRST/i.test(msg)
					? ' Aplica la migración 20260805_site_settings.sql en Supabase.'
					: '';
			return fail(500, { error: msg + schema, email });
		}
	}
};
