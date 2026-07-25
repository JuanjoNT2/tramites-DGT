import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import { listUserSolicitudes, listVehiculos } from '$lib/cuenta/data';
import type { Profile } from '$lib/supabase/types';

export const load: PageServerLoad = async ({ params }) => {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');

	const { data: profile, error: pErr } = await sb
		.from('profiles')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();

	if (pErr) throw error(500, pErr.message);
	if (!profile) throw error(404, 'Usuario no encontrado');

	const [vehiculos, solicitudes] = await Promise.all([
		listVehiculos(params.id).catch(() => []),
		listUserSolicitudes(params.id, 'todos').catch(() => [])
	]);

	return {
		profile: profile as Profile,
		vehiculos,
		solicitudes
	};
};
