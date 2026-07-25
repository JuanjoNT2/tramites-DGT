import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { Solicitud } from '$lib/supabase/types';
import { getPayloadAccessToken } from '$lib/pago/access';

const TRAMITAR_PATH: Record<string, string> = {
	transferencia: '/tramitar/transferencia',
	etiqueta: '/tramitar/etiqueta',
	'etiqueta-vmp': '/tramitar/etiqueta-vmp',
	vmp: '/tramitar/etiqueta-vmp',
	'informe-dgt': '/tramitar/informe-dgt',
	informe: '/tramitar/informe-dgt',
	'duplicado-carnet': '/tramitar/duplicado-carnet',
	duplicado: '/tramitar/duplicado-carnet',
	'cancelacion-reserva': '/tramitar/cancelacion-reserva',
	cancelacion: '/tramitar/cancelacion-reserva'
};

export const load: PageServerLoad = async ({ url }) => {
	const solicitudId = url.searchParams.get('solicitud') || '';
	let retryTramite = '/#servicios';
	let pagoUrl: string | null = null;

	if (solicitudId) {
		const sb = getServiceSupabase();
		if (sb) {
			const { data } = await sb.from('solicitudes').select('*').eq('id', solicitudId).maybeSingle();
			const sol = data as Solicitud | null;
			if (sol) {
				retryTramite = TRAMITAR_PATH[sol.tipo] || '/#servicios';
				const token = getPayloadAccessToken(sol.payload as Record<string, unknown>);
				pagoUrl = token
					? `/pago/${solicitudId}?t=${encodeURIComponent(token)}`
					: `/pago/${solicitudId}`;
			}
		}
	}

	return { solicitudId, retryTramite, pagoUrl };
};
