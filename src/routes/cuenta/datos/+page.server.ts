import type { PageServerLoad } from './$types';
import { SCHEMA_HINT, isSchemaMissingError } from '$lib/cuenta/data';
import {
	normalizeFechaNacimiento,
	normalizeProfileDireccion
} from '$lib/cuenta/profile-prefill';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { ProfileDocumentos } from '$lib/supabase/types';

export const load: PageServerLoad = async ({ locals }) => {
	const d = normalizeProfileDireccion(locals.profile?.direccion ?? null);
	const docs = (locals.profile?.documentos || {}) as ProfileDocumentos;
	const sb = getServiceSupabase();
	let schemaHint: string | null = null;
	if (sb) {
		const { error: probe } = await sb
			.from('profiles')
			.select('telefono,nif,direccion,fecha_nacimiento,sexo,documentos')
			.limit(1);
		if (isSchemaMissingError(probe)) {
			schemaHint =
				SCHEMA_HINT +
				' También aplica 20260805_profile_documentos.sql si falta la columna documentos.';
		}
	}
	return {
		profile: locals.profile,
		email: locals.user?.email ?? null,
		emailConfirmed: Boolean(locals.user?.email_confirmed_at),
		fechaNacimiento: normalizeFechaNacimiento(locals.profile?.fecha_nacimiento),
		sexo: locals.profile?.sexo || '',
		direccion: {
			tipoVia: d.tipoVia || 'Calle',
			calle: d.calle || '',
			numero: d.numero || '',
			piso: d.piso || '',
			puerta: d.puerta || '',
			cp: d.cp || '',
			ciudad: d.ciudad || d.municipio || d.localidad || '',
			municipio: d.municipio || d.ciudad || '',
			provincia: d.provincia || ''
		},
		nifDocs: {
			frontal: Boolean(docs.nif_frontal?.path),
			trasero: Boolean(docs.nif_trasero?.path)
		},
		schemaHint
	};
};
