import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { siteOrigin } from '$lib/auth/urls';

export function getStripeSecretKey(): string | null {
	const key = env.STRIPE_SECRET_KEY?.trim();
	return key || null;
}

export function isStripeConfigured(): boolean {
	return Boolean(getStripeSecretKey());
}

export function getStripeWebhookSecret(): string | null {
	return env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function getStripeClient(): Stripe {
	const key = getStripeSecretKey();
	if (!key) throw new Error('Stripe no configurado (falta STRIPE_SECRET_KEY)');
	return new Stripe(key, {
		apiVersion: '2026-06-24.dahlia'
	});
}

export async function createStripeCheckoutSession(opts: {
	solicitudId: string;
	amountEur: number;
	description: string;
	customerEmail?: string | null;
	accessToken?: string | null;
	origin?: string;
	/** embedded = Checkout en la misma página; hosted = redirect */
	uiMode?: 'embedded' | 'hosted';
}): Promise<{ sessionId: string; url: string | null; clientSecret: string | null }> {
	const stripe = getStripeClient();
	const amountCents = Math.round(opts.amountEur * 100);
	if (!Number.isFinite(amountCents) || amountCents < 1) {
		throw new Error('Importe inválido');
	}

	const base = (opts.origin || siteOrigin()).replace(/\/$/, '');
	const tokenQ = opts.accessToken
		? `&t=${encodeURIComponent(opts.accessToken)}`
		: '';
	const uiMode = opts.uiMode ?? 'embedded';

	const common = {
		mode: 'payment' as const,
		payment_method_types: ['card' as const],
		customer_email: opts.customerEmail || undefined,
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: 'eur',
					unit_amount: amountCents,
					product_data: {
						name: opts.description.slice(0, 120) || 'Trámite DGT',
						description: `Referencia ${opts.solicitudId}`
					}
				}
			}
		],
		metadata: {
			solicitudId: opts.solicitudId
		},
		client_reference_id: opts.solicitudId
	};

	if (uiMode === 'embedded') {
		const session = await stripe.checkout.sessions.create({
			...common,
			ui_mode: 'embedded_page',
			return_url: `${base}/pago/ok?solicitud=${encodeURIComponent(opts.solicitudId)}&session_id={CHECKOUT_SESSION_ID}${tokenQ}`
		} as Parameters<typeof stripe.checkout.sessions.create>[0]);
		const clientSecret =
			(session as { client_secret?: string | null }).client_secret ?? null;
		if (!clientSecret) throw new Error('Stripe no devolvió client_secret');
		return {
			sessionId: session.id,
			url: null,
			clientSecret
		};
	}

	const session = await stripe.checkout.sessions.create({
		...common,
		success_url: `${base}/pago/ok?solicitud=${encodeURIComponent(opts.solicitudId)}&session_id={CHECKOUT_SESSION_ID}${tokenQ}`,
		cancel_url: `${base}/pago/ko?solicitud=${encodeURIComponent(opts.solicitudId)}${tokenQ}`
	});

	if (!session.url) throw new Error('Stripe no devolvió URL de Checkout');
	return { sessionId: session.id, url: session.url, clientSecret: null };
}

export function constructStripeEvent(rawBody: string, signature: string): Stripe.Event {
	const secret = getStripeWebhookSecret();
	if (!secret) throw new Error('Falta STRIPE_WEBHOOK_SECRET');
	const stripe = getStripeClient();
	return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
