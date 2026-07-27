import { json, text, type RequestHandler } from '@sveltejs/kit';
import { getServiceSupabase } from '$lib/supabase/admin';
import { constructStripeEvent, isStripeConfigured } from '$lib/server/stripe';
import { sendPagoConfirmadoEmail } from '$lib/server/mailer';
import { createNotificacion } from '$lib/cuenta/data';
import type { Solicitud } from '$lib/supabase/types';
import type Stripe from 'stripe';

async function markSolicitudPaid(opts: {
	solicitudId: string;
	session: Stripe.Checkout.Session;
}) {
	const sb = getServiceSupabase();
	if (!sb) return;

	const { data: sol } = await sb
		.from('solicitudes')
		.select('*')
		.eq('id', opts.solicitudId)
		.maybeSingle();
	if (!sol) {
		console.error('[stripe/webhook] solicitud no encontrada', opts.solicitudId);
		return;
	}

	const solicitud = sol as Solicitud;
	if (solicitud.status === 'pagada' || solicitud.status === 'realizada') {
		return;
	}

	const prev = (solicitud.payload as Record<string, unknown>) || {};
	const prevPago = (prev.pago as Record<string, unknown>) || {};
	const expectedCents = Number(prevPago.amountCentsExpected ?? Number(prevPago.amount) * 100);
	const paidCents = Number(opts.session.amount_total);

	if (
		Number.isFinite(expectedCents) &&
		expectedCents > 0 &&
		Number.isFinite(paidCents) &&
		Math.abs(paidCents - expectedCents) > 1
	) {
		console.error('[stripe/webhook] importe no coincide', {
			solicitudId: opts.solicitudId,
			expectedCents,
			paidCents
		});
		const payloadMismatch = {
			...prev,
			pago: {
				...prevPago,
				mode: 'stripe',
				stripeSessionId: opts.session.id,
				amountCents: paidCents,
				authorized: false,
				amountMismatch: true,
				notifiedAt: new Date().toISOString()
			}
		};
		await sb
			.from('solicitudes')
			.update({ status: 'pendiente_pago', payload: payloadMismatch })
			.eq('id', opts.solicitudId);
		return;
	}

	const payload = {
		...prev,
		pago: {
			...prevPago,
			mode: 'stripe',
			stripeSessionId: opts.session.id,
			stripePaymentIntent:
				typeof opts.session.payment_intent === 'string'
					? opts.session.payment_intent
					: opts.session.payment_intent?.id ?? null,
			amountCents: paidCents,
			authorized: true,
			notifiedAt: new Date().toISOString()
		}
	};

	await sb.from('solicitudes').update({ status: 'pagada', payload }).eq('id', opts.solicitudId);

	const email = solicitud.email;
	const nombre = typeof prev.nombre === 'string' ? prev.nombre : null;
	const esPrueba = solicitud.tipo === 'prueba_pago' || prev.esPruebaPago === true;
	if (email && !esPrueba) {
		sendPagoConfirmadoEmail({
			to: email,
			solicitudId: opts.solicitudId,
			tipo: solicitud.tipo,
			nombre
		}).catch((e) => console.error('[stripe/webhook] email', e));
	}
	if (solicitud.user_id) {
		createNotificacion({
			user_id: solicitud.user_id,
			tipo: 'pago',
			titulo: 'Pago confirmado',
			cuerpo: `Tu trámite ${solicitud.tipo} ha sido pagado correctamente.`,
			link: `/cuenta/tramites/${opts.solicitudId}`
		}).catch(() => null);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	if (!isStripeConfigured()) {
		return json({ error: 'Stripe no configurado' }, { status: 503 });
	}

	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return text('Falta stripe-signature', { status: 400 });
	}

	const rawBody = await request.text();
	let event: Stripe.Event;
	try {
		event = constructStripeEvent(rawBody, signature);
	} catch (e) {
		console.error('[stripe/webhook] firma', e);
		return text('Firma inválida', { status: 400 });
	}

	if (
		event.type === 'checkout.session.completed' ||
		event.type === 'checkout.session.async_payment_succeeded'
	) {
		const session = event.data.object as Stripe.Checkout.Session;
		const solicitudId =
			session.metadata?.solicitudId ||
			(typeof session.client_reference_id === 'string' ? session.client_reference_id : null);
		if (!solicitudId) {
			console.error('[stripe/webhook] sin solicitudId', session.id);
		} else if (session.payment_status === 'paid' || event.type === 'checkout.session.completed') {
			await markSolicitudPaid({ solicitudId, session });
		}
	}

	return json({ received: true });
};
