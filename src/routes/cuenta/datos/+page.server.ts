import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const d = (locals.profile?.direccion || {}) as Record<string, string>;
	return {
		profile: locals.profile,
		email: locals.user?.email ?? null,
		emailConfirmed: Boolean(locals.user?.email_confirmed_at),
		direccion: {
			calle: d.calle || '',
			cp: d.cp || '',
			ciudad: d.ciudad || '',
			provincia: d.provincia || ''
		}
	};
};
