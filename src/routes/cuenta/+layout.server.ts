import { redirect } from '@sveltejs/kit';
import type { Actions, LayoutServerLoad } from './$types';
import { countUnreadNotificaciones } from '$lib/cuenta/data';

export const load: LayoutServerLoad = async ({ locals }) => {
	let unread = 0;
	if (locals.user) {
		try {
			unread = await countUnreadNotificaciones(locals.user.id);
		} catch {
			unread = 0;
		}
	}
	const name = locals.profile?.full_name?.trim().split(/\s+/)[0] || null;
	return {
		email: locals.user?.email ?? null,
		displayName: name,
		unread,
		profile: locals.profile
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		if (locals.supabase) await locals.supabase.auth.signOut();
		throw redirect(303, '/');
	}
};
