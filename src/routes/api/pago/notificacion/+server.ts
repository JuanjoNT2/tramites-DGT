import { text, type RequestHandler } from '@sveltejs/kit';
import { getServiceSupabase } from '$lib/supabase/admin';
import { parseRedsysNotification } from '$lib/server/redsys';
import { notifyAdminSalePaid, notifyAdminPagoIncidencia } from '$lib/server/admin-notify';
import { sendPagoConfirmadoEmail } from '$lib/server/mailer';
import { createNotificacion } from '$lib/cuenta/data';
import type { Solicitud } from '$lib/supabase/types';

async function handleNotification(params: URLSearchParams) {
	const Ds_MerchantParameters =
		params.get('Ds_MerchantParameters') || params.get('DS_MERCHANTPARAMETERS');
	const Ds_Signature = params.get('Ds_Signature') || params.get('DS_SIGNATURE');

	if (!Ds_MerchantParameters || !Ds_Signature) {
		return text('Faltan parámetros', { status: 400 });
	}

	let notification;
	try {
		notification = parseRedsysNotification(Ds_MerchantParameters, Ds_Signature);
	} catch (e) {
		console.error('[pago/notificacion] firma', e);
		return text('Firma inválida', { status: 400 });
	}

	const sb = getServiceSupabase();
	if (!sb) return text('OK');

	const solicitudId = notification.solicitudId;
	if (!solicitudId) {
		console.error('[pago/notificacion] sin solicitud', notification.order);
		return text('OK');
	}

	const { data: sol } = await sb.from('solicitudes').select('*').eq('id', solicitudId).maybeSingle();
	if (!sol) return text('OK');

	const solicitud = sol as Solicitud;
	if (solicitud.status === 'pagada' || solicitud.status === 'realizada') {
		return text('OK');
	}

	const prev = (solicitud.payload as Record<string, unknown>) || {};
	const prevPago = (prev.pago as Record<string, unknown>) || {};

	const expectedCents = Number(prevPago.amountCentsExpected ?? Number(prevPago.amount) * 100);
	const paidCents = Number(notification.amount);
	if (
		notification.authorized &&
		Number.isFinite(expectedCents) &&
		expectedCents > 0 &&
		Number.isFinite(paidCents) &&
		Math.abs(paidCents - expectedCents) > 1
	) {
		console.error('[pago/notificacion] importe no coincide', {
			solicitudId,
			expectedCents,
			paidCents
		});
		const payloadMismatch = {
			...prev,
			pago: {
				...prevPago,
				redsysOrder: notification.order,
				responseCode: notification.responseCode,
				amountCents: notification.amount,
				authorized: false,
				amountMismatch: true,
				notifiedAt: new Date().toISOString(),
				raw: notification.raw
			}
		};
		await sb
			.from('solicitudes')
			.update({ status: 'pendiente_pago', payload: payloadMismatch })
			.eq('id', solicitudId);
		void notifyAdminPagoIncidencia({
			solicitudId,
			tipo: solicitud.tipo,
			expectedCents,
			paidCents,
			provider: 'redsys'
		});
		return text('OK');
	}

	const payload = {
		...prev,
		pago: {
			...prevPago,
			redsysOrder: notification.order,
			responseCode: notification.responseCode,
			amountCents: notification.amount,
			authorized: notification.authorized,
			notifiedAt: new Date().toISOString(),
			raw: notification.raw
		}
	};

	const status = notification.authorized ? 'pagada' : 'pendiente_pago';
	await sb.from('solicitudes').update({ status, payload }).eq('id', solicitudId);

	if (notification.authorized) {
		void notifyAdminSalePaid({
			...solicitud,
			status: 'pagada',
			payload
		});

		const email = solicitud.email;
		const nombre = typeof prev.nombre === 'string' ? prev.nombre : null;
		if (email) {
			sendPagoConfirmadoEmail({
				to: email,
				solicitudId,
				tipo: solicitud.tipo,
				nombre
			}).catch((e) => console.error('[pago/notificacion] email', e));
		}
		if (solicitud.user_id) {
			createNotificacion({
				user_id: solicitud.user_id,
				tipo: 'pago',
				titulo: 'Pago confirmado',
				cuerpo: `Tu trámite ${solicitud.tipo} ha sido pagado correctamente.`,
				link: `/cuenta/tramites/${solicitudId}`
			}).catch(() => null);
		}
	}

	return text('OK');
}

export const POST: RequestHandler = async ({ request }) => {
	const ct = request.headers.get('content-type') || '';
	let params: URLSearchParams;
	if (ct.includes('application/json')) {
		const body = (await request.json()) as Record<string, string>;
		params = new URLSearchParams(body);
	} else {
		const raw = await request.text();
		params = new URLSearchParams(raw);
	}
	return handleNotification(params);
};

export const GET: RequestHandler = async ({ url }) => {
	return handleNotification(url.searchParams);
};
