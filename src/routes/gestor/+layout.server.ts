import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		email: locals.user?.email ?? null,
		role: locals.profile?.role ?? null
	};
};
