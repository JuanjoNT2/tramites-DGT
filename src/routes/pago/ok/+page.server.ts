import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { Solicitud } from '$lib/supabase/types';

export const load: PageServerLoad = async ({ url }) => {
	const solicitudId = url.searchParams.get('solicitud') || '';
	if (!solicitudId) {
		return {
			solicitudId: '',
			paid: false,
			pending: false,
			tipo: null as string | null
		};
	}

	const sb = getServiceSupabase();
	if (!sb) {
		return { solicitudId, paid: false, pending: true, tipo: null };
	}

	const { data } = await sb.from('solicitudes').select('*').eq('id', solicitudId).maybeSingle();
	const sol = data as Solicitud | null;
	const status = sol?.status || '';
	const paid = status === 'pagada' || status === 'realizada';
	const pending = !paid;

	return {
		solicitudId,
		paid,
		pending,
		tipo: sol?.tipo ?? null
	};
};
