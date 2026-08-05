import type { LayoutServerLoad } from './$types';
import { countUnreadNotificaciones } from '$lib/cuenta/data';
import { displayFirstName } from '$lib/cuenta/profile-prefill';

export const load: LayoutServerLoad = async ({ locals }) => {
	let unread = 0;
	if (locals.user) {
		try {
			unread = await countUnreadNotificaciones(locals.user.id);
		} catch {
			unread = 0;
		}
	}
	const name = displayFirstName(locals.profile, locals.user?.email);
	const profileIncomplete = Boolean(
		locals.user &&
			(!locals.profile?.telefono?.trim() || !locals.profile?.nif?.trim() || !locals.user.email)
	);
	return {
		email: locals.user?.email ?? null,
		displayName: name === 'Mi cuenta' ? null : name,
		unread,
		profile: locals.profile,
		profileIncomplete
	};
};
