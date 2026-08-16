import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import type { Solicitud } from '$lib/supabase/types';
import { canAccessPagoSolicitud, getPayloadAccessToken } from '$lib/pago/access';

export const load: PageServerLoad = async ({ url, locals }) => {
	const solicitudId = url.searchParams.get('solicitud') || '';
	const token = url.searchParams.get('t');
	if (!solicitudId) {
		return {
			solicitudId: '',
			paid: false,
			pending: false,
			tipo: null as string | null,
			loggedIn: Boolean(locals.user),
			pagoUrl: null as string | null,
			allowed: false
		};
	}

	const sb = getServiceSupabase();
	if (!sb) {
		return {
			solicitudId,
			paid: false,
			pending: true,
			tipo: null,
			loggedIn: Boolean(locals.user),
			pagoUrl: token ? `/pago/${solicitudId}?t=${encodeURIComponent(token)}` : `/pago/${solicitudId}`,
			allowed: Boolean(token || locals.user)
		};
	}

	const { data } = await sb.from('solicitudes').select('*').eq('id', solicitudId).maybeSingle();
	const sol = data as Solicitud | null;
	if (
		!sol ||
		!canAccessPagoSolicitud({
			sol,
			userId: locals.user?.id,
			token
		})
	) {
		return {
			solicitudId,
			paid: false,
			pending: true,
			tipo: null,
			loggedIn: Boolean(locals.user),
			pagoUrl: null,
			allowed: false
		};
	}

	const status = sol.status || '';
	const paid = status === 'pagada' || status === 'realizada';
	const accessToken = getPayloadAccessToken(sol.payload as Record<string, unknown>);
	const pagoUrl = accessToken
		? `/pago/${solicitudId}?t=${encodeURIComponent(accessToken)}`
		: `/pago/${solicitudId}`;

	return {
		solicitudId,
		paid,
		pending: !paid,
		tipo: sol.tipo ?? null,
		loggedIn: Boolean(locals.user),
		pagoUrl,
		allowed: true
	};
};
