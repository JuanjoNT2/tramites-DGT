import type { PageServerLoad } from './$types';
import { listDocsForUser, SCHEMA_HINT, isSchemaMissingError } from '$lib/cuenta/data';
import { getServiceSupabase } from '$lib/supabase/admin';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const items = await listDocsForUser(locals.user!.id);
		const sb = getServiceSupabase();
		let schemaMissing = false;
		if (sb) {
			const { error: probe } = await sb.from('solicitud_documentos').select('id').limit(1);
			schemaMissing = isSchemaMissingError(probe);
		}
		return { items, schemaHint: schemaMissing ? SCHEMA_HINT : null };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { items: [], schemaHint: SCHEMA_HINT, error: msg };
	}
};
