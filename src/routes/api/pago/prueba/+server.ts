import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getServiceSupabase } from '$lib/supabase/admin';
import { generatePagoAccessToken } from '$lib/pago/access';
import {
	createStripeCheckoutSession,
	isStripeConfigured
} from '$lib/server/stripe';

/** Mínimo de Stripe Checkout en EUR. */
const AMOUNT_EUR = 0.5;
const TIPO = 'prueba_pago';

function isPruebaEnabled(): boolean {
	const flag = env.ENABLE_PAGO_PRUEBA?.trim().toLowerCase();
	if (flag === '0' || flag === 'false' || flag === 'off') return false;
	// Por defecto activo si Stripe está listo (desactivar con ENABLE_PAGO_PRUEBA=0)
	return isStripeConfigured();
}

/** Crea una solicitud de prueba a 0,01 € y redirige a Stripe Checkout. */
export const POST: RequestHandler = async ({ url, locals }) => {
	if (!isPruebaEnabled()) {
		return json({ error: 'Prueba de pago desactivada' }, { status: 403 });
	}

	const sb = getServiceSupabase();
	if (!sb) {
		return json({ error: 'Supabase no configurado' }, { status: 503 });
	}

	const id = crypto.randomUUID();
	const accessToken = generatePagoAccessToken();
	const created_at = new Date().toISOString();
	const email = locals.user?.email?.toLowerCase() || null;
	const userId = locals.user?.id ?? null;

	const payload = {
		nombre: 'Prueba de pago',
		email,
		amount: AMOUNT_EUR,
		total: AMOUNT_EUR,
		accessToken,
		esPruebaPago: true,
		pago: {
			amount: AMOUNT_EUR,
			currency: 'EUR',
			amountCentsExpected: 50,
			mode: 'stripe'
		}
	};

	const { error } = await sb.from('solicitudes').insert({
		id,
		tipo: TIPO,
		payload,
		user_id: userId,
		email,
		status: 'pendiente_pago',
		created_at
	});

	if (error) {
		console.error('[pago/prueba] insert', error.message);
		return json({ error: 'No se pudo crear la solicitud de prueba' }, { status: 500 });
	}

	try {
		const session = await createStripeCheckoutSession({
			solicitudId: id,
			amountEur: AMOUNT_EUR,
			description: 'Prueba de pago Stripe (0,50 €)',
			customerEmail: email,
			accessToken,
			origin: url.origin
		});

		const nextPayload = {
			...payload,
			pago: {
				...payload.pago,
				stripeSessionId: session.sessionId,
				createdAt: new Date().toISOString()
			}
		};
		await sb.from('solicitudes').update({ payload: nextPayload }).eq('id', id);

		return json({
			ok: true,
			solicitudId: id,
			amount: AMOUNT_EUR,
			url: session.url,
			sessionId: session.sessionId
		});
	} catch (e) {
		console.error('[pago/prueba] stripe', e);
		return json(
			{ error: e instanceof Error ? e.message : 'No se pudo iniciar el Checkout' },
			{ status: 500 }
		);
	}
};
