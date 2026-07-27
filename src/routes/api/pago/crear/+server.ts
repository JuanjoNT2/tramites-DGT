import { json, type RequestHandler } from '@sveltejs/kit';
import { getServiceSupabase } from '$lib/supabase/admin';
import { createRedsysPayment, isRedsysConfigured } from '$lib/server/redsys';
import {
	createStripeCheckoutSession,
	isStripeConfigured
} from '$lib/server/stripe';
import {
	canAccessPagoSolicitud,
	getPayloadAccessToken,
	resolveStoredAmount
} from '$lib/pago/access';
import type { Solicitud } from '$lib/supabase/types';

export const POST: RequestHandler = async ({ request, url, locals }) => {
	let body: {
		solicitudId?: string;
		amount?: number;
		description?: string;
		accessToken?: string;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Petición inválida' }, { status: 400 });
	}

	const solicitudId = body.solicitudId?.trim();
	if (!solicitudId) {
		return json({ error: 'solicitudId requerido' }, { status: 400 });
	}

	const sb = getServiceSupabase();
	if (!sb) {
		return json({ error: 'Supabase no configurado' }, { status: 503 });
	}

	const { data: sol, error } = await sb
		.from('solicitudes')
		.select('*')
		.eq('id', solicitudId)
		.maybeSingle();
	if (error || !sol) {
		return json({ error: 'Solicitud no encontrada' }, { status: 404 });
	}

	const solicitud = sol as Solicitud;
	const token =
		body.accessToken?.trim() ||
		url.searchParams.get('t') ||
		request.headers.get('x-pago-token');

	if (
		!canAccessPagoSolicitud({
			sol: solicitud,
			userId: locals.user?.id,
			token
		})
	) {
		return json({ error: 'No autorizado para pagar esta solicitud' }, { status: 403 });
	}

	if (solicitud.status === 'pagada' || solicitud.status === 'realizada') {
		return json({ error: 'Esta solicitud ya está pagada' }, { status: 400 });
	}

	const amount = resolveStoredAmount(solicitud);
	if (!(amount > 0)) {
		return json({ error: 'La solicitud no tiene un importe válido' }, { status: 400 });
	}

	const prev = (solicitud.payload || {}) as Record<string, unknown>;
	const accessToken = getPayloadAccessToken(prev) || (typeof token === 'string' ? token : null);
	const description = body.description || String(solicitud.tipo || 'Trámite DGT');
	const amountCentsExpected = Math.round(amount * 100);

	const basePayload = {
		...prev,
		pago: {
			...((prev.pago as Record<string, unknown>) || {}),
			amount,
			currency: 'EUR',
			amountCentsExpected,
			updatedAt: new Date().toISOString()
		}
	};

	await sb
		.from('solicitudes')
		.update({ status: 'pendiente_pago', payload: basePayload })
		.eq('id', solicitudId);

	// Preferencia: Stripe → Redsys → pendiente de credenciales
	if (isStripeConfigured()) {
		try {
			const session = await createStripeCheckoutSession({
				solicitudId,
				amountEur: amount,
				description,
				customerEmail: solicitud.email,
				accessToken,
				origin: url.origin,
				uiMode: 'embedded'
			});

			const nextPayload = {
				...basePayload,
				pago: {
					...(basePayload.pago as Record<string, unknown>),
					mode: 'stripe',
					stripeSessionId: session.sessionId,
					createdAt: new Date().toISOString()
				}
			};
			await sb.from('solicitudes').update({ payload: nextPayload }).eq('id', solicitudId);

			if (session.clientSecret) {
				return json({
					ok: true,
					mode: 'stripe_embedded',
					solicitudId,
					amount,
					clientSecret: session.clientSecret,
					sessionId: session.sessionId,
					url: session.url
				});
			}

			return json({
				ok: true,
				mode: 'stripe_redirect',
				solicitudId,
				amount,
				url: session.url,
				sessionId: session.sessionId
			});
		} catch (e) {
			console.error('[pago/crear] stripe', e);
			return json(
				{ error: e instanceof Error ? e.message : 'No se pudo iniciar el pago Stripe' },
				{ status: 500 }
			);
		}
	}

	if (isRedsysConfigured()) {
		try {
			const redirect = createRedsysPayment({
				solicitudId,
				amountEur: amount,
				productDescription: description,
				origin: url.origin
			});

			const nextPayload = {
				...basePayload,
				pago: {
					...(basePayload.pago as Record<string, unknown>),
					redsysOrder: redirect.order,
					mode: 'redsys',
					createdAt: new Date().toISOString()
				}
			};
			await sb.from('solicitudes').update({ payload: nextPayload }).eq('id', solicitudId);

			return json({
				ok: true,
				mode: 'redirect',
				solicitudId,
				amount,
				redsys: redirect
			});
		} catch (e) {
			console.error('[pago/crear] redsys', e);
			return json(
				{ error: e instanceof Error ? e.message : 'No se pudo iniciar el pago' },
				{ status: 500 }
			);
		}
	}

	return json({
		ok: true,
		mode: 'pending_credentials',
		solicitudId,
		amount,
		message:
			'Solicitud registrada pendiente de pago. Configura STRIPE_SECRET_KEY (o Redsys) para activar la pasarela.'
	});
};
