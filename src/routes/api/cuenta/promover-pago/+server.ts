import { json, type RequestHandler } from '@sveltejs/kit';
import { isStaffRole } from '$lib/auth/roles';
import { promoteSolicitudToPayment, requireUser, upsertVehiculoFromPayload, getUserSolicitud } from '$lib/cuenta/data';
import { validateSolicitudPayload } from '$lib/server/solicitud-validate';
import { generatePagoAccessToken, getPayloadAccessToken } from '$lib/pago/access';
import { sendOtraParteInviteEmail, sendSolicitudReceivedEmail } from '$lib/server/mailer';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	if (isStaffRole(locals.profile?.role)) {
		return json(
			{ error: 'Las cuentas de gestor no pueden iniciar trámites de ciudadano.' },
			{ status: 403 }
		);
	}
	let body: {
		solicitudId?: string;
		payload?: Record<string, unknown>;
		amount?: number;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const solicitudId = String(body.solicitudId || '');
	if (!solicitudId) return json({ error: 'solicitudId obligatorio' }, { status: 400 });
	if (!body.payload || typeof body.payload !== 'object') {
		return json({ error: 'payload obligatorio' }, { status: 400 });
	}

	const payload = { ...body.payload };
	delete payload.amount;
	delete payload.total;
	const tipo = String(payload.tipo ?? 'desconocido');

	const validated = await validateSolicitudPayload(tipo, payload);
	if (!validated.ok) {
		return json({ error: validated.error }, { status: 400 });
	}

	const email = validated.email || user.email?.toLowerCase() || null;
	if (email && !payload.email) payload.email = email;
	if (validated.amount != null) {
		payload.amount = validated.amount;
		payload.total = validated.amount;
		payload.pago = {
			...((payload.pago as Record<string, unknown>) || {}),
			amount: validated.amount,
			currency: 'EUR'
		};
	}

	const current = await getUserSolicitud(user.id, solicitudId);
	const accessToken =
		getPayloadAccessToken(current.payload as Record<string, unknown>) || generatePagoAccessToken();
	payload.accessToken = accessToken;

	const sol = await promoteSolicitudToPayment(user.id, solicitudId, payload);
	await upsertVehiculoFromPayload(user.id, payload).catch(() => null);

	if (email) {
		sendSolicitudReceivedEmail({
			to: email,
			solicitudId: sol.id,
			tipo,
			nombre: typeof payload.nombre === 'string' ? payload.nombre : null,
			accessToken
		}).catch((e) => console.error('[promover-pago] email', e));
	}

	const otraParte =
		typeof payload.otraParteEmail === 'string' ? payload.otraParteEmail.trim().toLowerCase() : '';
	if (otraParte && otraParte !== email) {
		sendOtraParteInviteEmail({
			to: otraParte,
			fromNombre: typeof payload.nombre === 'string' ? payload.nombre : 'Un usuario',
			solicitudId: sol.id,
			accessToken
		}).catch((e) => console.error('[promover-pago] invite', e));
	}

	return json({
		ok: true,
		id: sol.id,
		accessToken,
		pagoUrl: `/pago/${sol.id}?t=${encodeURIComponent(accessToken)}`,
		message: 'Solicitud lista para pago.'
	});
};
