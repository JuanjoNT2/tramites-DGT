import { sendAdminSalePaidEmail, sendAdminUserRegisteredEmail } from '$lib/server/mailer';
import type { Solicitud } from '$lib/supabase/types';

export function notifyAdminUserRegistered(opts: {
	nombre: string;
	apellido1: string;
	apellido2?: string;
	email: string;
}) {
	return sendAdminUserRegisteredEmail(opts).catch((e) =>
		console.error('[admin-notify] user registered', e)
	);
}

function amountFromPayload(payload: Record<string, unknown>): number | null {
	const pago = (payload.pago as Record<string, unknown>) || {};
	const cents = Number(pago.amountCents ?? pago.amountCentsExpected);
	if (Number.isFinite(cents) && cents > 0) return cents / 100;
	const eur = Number(pago.amount ?? payload.amount ?? payload.total);
	if (Number.isFinite(eur) && eur > 0) return eur;
	return null;
}

/** Aviso de venta cuando una solicitud acaba de pasar a pagada. */
export function notifyAdminSalePaid(solicitud: Solicitud) {
	const payload = (solicitud.payload as Record<string, unknown>) || {};
	return sendAdminSalePaidEmail({
		email: solicitud.email,
		nombre: typeof payload.nombre === 'string' ? payload.nombre : null,
		apellido1: typeof payload.apellido1 === 'string' ? payload.apellido1 : null,
		apellido2: typeof payload.apellido2 === 'string' ? payload.apellido2 : null,
		tipo: solicitud.tipo,
		solicitudId: solicitud.id,
		amountEur: amountFromPayload(payload)
	}).catch((e) => console.error('[admin-notify] sale paid', e));
}
