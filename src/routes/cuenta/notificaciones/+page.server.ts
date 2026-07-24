import type { PageServerLoad } from './$types';
import { listNotificaciones, SCHEMA_HINT, isSchemaMissingError } from '$lib/cuenta/data';
import { getServiceSupabase } from '$lib/supabase/admin';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const items = await listNotificaciones(locals.user!.id);
		const sb = getServiceSupabase();
		let schemaMissing = false;
		if (sb) {
			const { error: probe } = await sb.from('notificaciones').select('id').limit(1);
			schemaMissing = isSchemaMissingError(probe);
		}
		return { items, schemaHint: schemaMissing ? SCHEMA_HINT : null };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { items: [], schemaHint: SCHEMA_HINT, error: msg };
	}
};
