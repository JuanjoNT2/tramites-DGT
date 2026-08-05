import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authEmailExists } from '$lib/auth/email-exists';
import { inviteUserRedirect } from '$lib/auth/urls';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { Profile } from '$lib/supabase/types';
import { validateEmail } from '$lib/utils/validators';

export const load: PageServerLoad = async () => {
	const sb = getServiceSupabase();
	if (!sb) {
		return {
			profiles: [] as Profile[],
			error: 'Supabase no configurado (SUPABASE_SERVICE_ROLE_KEY).'
		};
	}

	const { data, error } = await sb
		.from('profiles')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(500);

	if (error) {
		return { profiles: [] as Profile[], error: error.message };
	}

	return { profiles: (data ?? []) as Profile[], error: null };
};

export const actions: Actions = {
	invite: async ({ request, url }) => {
		const sb = getServiceSupabase();
		if (!sb) {
			return fail(503, { inviteError: 'Supabase no configurado.' });
		}

		const form = await request.formData();
		const email = String(form.get('email') || '')
			.trim()
			.toLowerCase();
		const emailErr = validateEmail(email);
		if (emailErr) {
			return fail(400, { inviteError: emailErr, inviteEmail: email });
		}

		const existing = await authEmailExists(sb, email);
		if (existing.exists) {
			return fail(400, {
				inviteError:
					'Ya existe una cuenta o una invitación pendiente con ese email. No se ha enviado otra.',
				inviteEmail: email
			});
		}

		const { data, error } = await sb.auth.admin.inviteUserByEmail(email, {
			redirectTo: inviteUserRedirect(url)
		});

		if (error) {
			console.error('[admin/invite]', error.message);
			const msg = error.message || '';
			const already =
				/already|registered|exists|existe|invited/i.test(msg) ||
				error.code === 'email_exists' ||
				error.status === 422;
			return fail(400, {
				inviteError: already
					? 'Ya existe una cuenta o una invitación pendiente con ese email.'
					: msg || 'No se pudo enviar la invitación.',
				inviteEmail: email
			});
		}

		return {
			inviteOk: true as const,
			inviteEmail: email,
			inviteUserId: data.user?.id ?? null,
			inviteMessage: `Invitación enviada a ${email}. Recibirá un correo para completar el registro.`
		};
	}
};
