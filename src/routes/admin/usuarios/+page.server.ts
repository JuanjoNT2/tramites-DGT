import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { Profile } from '$lib/supabase/types';

export const load: PageServerLoad = async () => {
	const sb = getServiceSupabase();
	if (!sb) {
		return { profiles: [] as Profile[], error: 'Supabase no configurado (SUPABASE_SERVICE_ROLE_KEY).' };
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
