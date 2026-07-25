import { randomBytes } from 'node:crypto';
import type { Solicitud } from '$lib/supabase/types';

export function generatePagoAccessToken(): string {
	return randomBytes(24).toString('base64url');
}

export function getPayloadAccessToken(payload: Record<string, unknown> | null | undefined): string | null {
	const t = payload?.accessToken;
	return typeof t === 'string' && t.length >= 16 ? t : null;
}

export function resolveStoredAmount(sol: Solicitud): number {
	const payload = (sol.payload || {}) as Record<string, unknown>;
	const pago = payload.pago as { amount?: number } | undefined;
	for (const candidate of [pago?.amount, payload.total, payload.amount]) {
		const n = Number(candidate);
		if (Number.isFinite(n) && n > 0) return n;
	}
	return 0;
}

/** Acceso a ficha de pago: token de la solicitud o propietario logueado. */
export function canAccessPagoSolicitud(opts: {
	sol: Solicitud;
	userId?: string | null;
	token?: string | null;
}): boolean {
	const { sol, userId, token } = opts;
	if (userId && sol.user_id && userId === sol.user_id) return true;
	const expected = getPayloadAccessToken(sol.payload as Record<string, unknown>);
	if (expected && token && expected === token) return true;
	return false;
}
