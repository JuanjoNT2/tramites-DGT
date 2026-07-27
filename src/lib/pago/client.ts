export type RedsysFormFields = {
	endpoint: string;
	Ds_SignatureVersion: string;
	Ds_MerchantParameters: string;
	Ds_Signature: string;
};

export type StartPaymentResult =
	| { ok: true; mode: 'stripe_redirect'; solicitudId: string; url: string; sessionId: string }
	| { ok: true; mode: 'redirect'; solicitudId: string; redsys: RedsysFormFields }
	| { ok: true; mode: 'pending_credentials'; solicitudId: string; message: string }
	| { ok: false; error: string; solicitudId?: string };

/** Auto-envía el formulario POST a Redsys. */
export function postToRedsys(redsys: RedsysFormFields) {
	const form = document.createElement('form');
	form.method = 'POST';
	form.action = redsys.endpoint;
	form.style.display = 'none';

	const fields: Record<string, string> = {
		Ds_SignatureVersion: redsys.Ds_SignatureVersion,
		Ds_MerchantParameters: redsys.Ds_MerchantParameters,
		Ds_Signature: redsys.Ds_Signature
	};
	for (const [name, value] of Object.entries(fields)) {
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = name;
		input.value = value;
		form.appendChild(input);
	}
	document.body.appendChild(form);
	form.submit();
}

/** Solo registra la solicitud (pendiente de pago). La pasarela vive en `/pago/[id]`. */
export async function createSolicitud(opts: {
	payload: Record<string, unknown>;
	amount: number;
	/** Si viene de un Guardar previo, reutiliza la fila `nueva` en lugar de crear otra */
	solicitudId?: string | null;
}): Promise<
	| { ok: true; solicitudId: string; accessToken: string | null; pagoUrl: string }
	| { ok: false; error: string }
> {
	if (opts.solicitudId) {
		const promoRes = await fetch('/api/cuenta/promover-pago', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				solicitudId: opts.solicitudId,
				payload: { ...opts.payload, amount: opts.amount, total: opts.amount },
				amount: opts.amount
			})
		});
		const promoData = await promoRes.json().catch(() => ({}));
		if (promoRes.ok) {
			const solicitudId = String(promoData.id || opts.solicitudId);
			const accessToken =
				typeof promoData.accessToken === 'string' ? promoData.accessToken : null;
			const pagoUrl =
				typeof promoData.pagoUrl === 'string'
					? promoData.pagoUrl
					: accessToken
						? `/pago/${solicitudId}?t=${encodeURIComponent(accessToken)}`
						: `/pago/${solicitudId}`;
			return { ok: true, solicitudId, accessToken, pagoUrl };
		}
		if (promoRes.status !== 401 && promoRes.status !== 403 && promoRes.status !== 404) {
			return {
				ok: false,
				error:
					typeof promoData.error === 'string'
						? promoData.error
						: 'No se pudo actualizar la solicitud guardada'
			};
		}
	}

	const solRes = await fetch('/api/solicitud', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			...opts.payload,
			status: 'pendiente_pago',
			amount: opts.amount
		})
	});
	const solData = await solRes.json().catch(() => ({}));
	if (!solRes.ok) {
		return {
			ok: false,
			error: typeof solData.error === 'string' ? solData.error : 'No se pudo registrar la solicitud'
		};
	}
	const solicitudId = String(solData.id || '');
	if (!solicitudId) return { ok: false, error: 'Solicitud sin id' };
	const accessToken =
		typeof solData.accessToken === 'string' ? solData.accessToken : null;
	const pagoUrl =
		typeof solData.pagoUrl === 'string'
			? solData.pagoUrl
			: accessToken
				? `/pago/${solicitudId}?t=${encodeURIComponent(accessToken)}`
				: `/pago/${solicitudId}`;
	return { ok: true, solicitudId, accessToken, pagoUrl };
}

/** Inicia la pasarela (Stripe o Redsys) para una solicitud ya creada. */
export async function startPayment(opts: {
	solicitudId: string;
	amount?: number;
	description?: string;
	accessToken?: string | null;
}): Promise<StartPaymentResult> {
	const payRes = await fetch('/api/pago/crear', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			solicitudId: opts.solicitudId,
			description: opts.description,
			accessToken: opts.accessToken || undefined
		})
	});
	const payData = await payRes.json().catch(() => ({}));
	if (!payRes.ok) {
		return {
			ok: false,
			error: typeof payData.error === 'string' ? payData.error : 'No se pudo iniciar el pago',
			solicitudId: opts.solicitudId
		};
	}

	if (payData.mode === 'stripe_redirect' && typeof payData.url === 'string') {
		return {
			ok: true,
			mode: 'stripe_redirect',
			solicitudId: opts.solicitudId,
			url: payData.url,
			sessionId: String(payData.sessionId || '')
		};
	}

	if (payData.mode === 'redirect' && payData.redsys) {
		return {
			ok: true,
			mode: 'redirect',
			solicitudId: opts.solicitudId,
			redsys: payData.redsys as RedsysFormFields
		};
	}

	return {
		ok: true,
		mode: 'pending_credentials',
		solicitudId: opts.solicitudId,
		message:
			typeof payData.message === 'string'
				? payData.message
				: 'Solicitud registrada pendiente de pago.'
	};
}

/**
 * 1) Guarda la solicitud (status pendiente_pago)
 * 2) Inicia pago Stripe/Redsys o deja pendiente si no hay credenciales
 */
export async function createSolicitudAndStartPayment(opts: {
	payload: Record<string, unknown>;
	amount: number;
	description?: string;
}): Promise<StartPaymentResult> {
	const created = await createSolicitud({ payload: opts.payload, amount: opts.amount });
	if (!created.ok) return created;
	return startPayment({
		solicitudId: created.solicitudId,
		description: opts.description,
		accessToken: created.accessToken
	});
}
