import type { PageServerLoad } from './$types';
import { SCHEMA_HINT, isSchemaMissingError } from '$lib/cuenta/data';
import { normalizeFechaNacimiento } from '$lib/cuenta/profile-prefill';
import { getServiceSupabase } from '$lib/supabase/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const rawDir = locals.profile?.direccion as
		| Record<string, string>
		| string
		| null
		| undefined;
	let d: Record<string, string> = {};
	if (rawDir && typeof rawDir === 'object') {
		d = rawDir;
	} else if (typeof rawDir === 'string' && rawDir.trim()) {
		d = { calle: rawDir.trim(), cp: '', ciudad: '', provincia: '' };
	}
	const sb = getServiceSupabase();
	let schemaHint: string | null = null;
	if (sb) {
		const { error: probe } = await sb
			.from('profiles')
			.select('telefono,nif,direccion,fecha_nacimiento,sexo')
			.limit(1);
		if (isSchemaMissingError(probe)) schemaHint = SCHEMA_HINT;
	}
	return {
		profile: locals.profile,
		email: locals.user?.email ?? null,
		emailConfirmed: Boolean(locals.user?.email_confirmed_at),
		fechaNacimiento: normalizeFechaNacimiento(locals.profile?.fecha_nacimiento),
		sexo: locals.profile?.sexo || '',
		direccion: {
			calle: d.calle || '',
			cp: d.cp || '',
			ciudad: d.ciudad || '',
			provincia: d.provincia || ''
		},
		schemaHint
	};
};
