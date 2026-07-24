import type { PageServerLoad } from './$types';
import { SCHEMA_HINT, isSchemaMissingError } from '$lib/cuenta/data';
import { getServiceSupabase } from '$lib/supabase/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const d = (locals.profile?.direccion || {}) as Record<string, string>;
	const sb = getServiceSupabase();
	let schemaHint: string | null = null;
	if (sb) {
		// telefono/nif/direccion vienen de la migración de panel
		const { error: probe } = await sb.from('profiles').select('telefono,nif,direccion').limit(1);
		if (isSchemaMissingError(probe)) schemaHint = SCHEMA_HINT;
	}
	return {
		profile: locals.profile,
		email: locals.user?.email ?? null,
		emailConfirmed: Boolean(locals.user?.email_confirmed_at),
		direccion: {
			calle: d.calle || '',
			cp: d.cp || '',
			ciudad: d.ciudad || '',
			provincia: d.provincia || ''
		},
		schemaHint
	};
};
