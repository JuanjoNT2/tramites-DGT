import { env } from '$env/dynamic/private';
import { siteOrigin } from '$lib/auth/urls';
import { getAdminNotifyEmail } from '$lib/server/site-settings';
import { SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';

async function sendEmail(opts: {
	to: string;
	subject: string;
	text: string;
	html?: string;
	attachments?: { filename: string; content: Buffer; type?: string }[];
}): Promise<boolean> {
	const key = env.SENDGRID_API_KEY?.trim();
	const from = env.SENDGRID_FROM?.trim() || 'noreply@tramitesdgtonline.com';
	if (!key) {
		console.info('[mailer] SENDGRID_API_KEY no configurada; email omitido →', opts.to, opts.subject);
		return false;
	}

	const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			personalizations: [{ to: [{ email: opts.to }] }],
			from: { email: from, name: 'Trámites DGT Online' },
			subject: opts.subject,
			content: [
				{ type: 'text/plain', value: opts.text },
				...(opts.html ? [{ type: 'text/html', value: opts.html }] : [])
			],
			...(opts.attachments?.length
				? {
						attachments: opts.attachments.map((a) => ({
							content: a.content.toString('base64'),
							filename: a.filename,
							type: a.type || 'application/pdf',
							disposition: 'attachment'
						}))
					}
				: {})
		})
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		console.error('[mailer] SendGrid error', res.status, body);
		return false;
	}
	return true;
}

function tipoLabel(tipo: string) {
	return SOLICITUD_TIPO_LABELS[tipo] || tipo;
}

export async function sendSolicitudReceivedEmail(opts: {
	to: string;
	solicitudId: string;
	tipo: string;
	nombre?: string | null;
	accessToken?: string | null;
}) {
	const base = siteOrigin();
	const pagoUrl = opts.accessToken
		? `${base}/pago/${opts.solicitudId}?t=${encodeURIComponent(opts.accessToken)}`
		: `${base}/pago/${opts.solicitudId}`;
	const cuentaUrl = `${base}/cuenta/tramites/${opts.solicitudId}`;
	const label = tipoLabel(opts.tipo);
	const hello = opts.nombre?.trim() ? `Hola ${opts.nombre.trim()},` : 'Hola,';

	return sendEmail({
		to: opts.to,
		subject: `Solicitud recibida: ${label}`,
		text: [
			hello,
			'',
			`Hemos registrado tu solicitud de «${label}».`,
			`Referencia: ${opts.solicitudId}`,
			'',
			`Continuar al pago: ${pagoUrl}`,
			`Ver en tu área (si tienes cuenta): ${cuentaUrl}`,
			'',
			'Trámites DGT Online'
		].join('\n')
	});
}

export async function sendPagoConfirmadoEmail(opts: {
	to: string;
	solicitudId: string;
	tipo: string;
	nombre?: string | null;
}) {
	const base = siteOrigin();
	const cuentaUrl = `${base}/cuenta/tramites/${opts.solicitudId}`;
	const label = tipoLabel(opts.tipo);
	const hello = opts.nombre?.trim() ? `Hola ${opts.nombre.trim()},` : 'Hola,';

	return sendEmail({
		to: opts.to,
		subject: `Pago confirmado: ${label}`,
		text: [
			hello,
			'',
			`Tu pago del trámite «${label}» se ha confirmado correctamente.`,
			`Referencia: ${opts.solicitudId}`,
			'',
			`Ver estado: ${cuentaUrl}`,
			'',
			'Trámites DGT Online'
		].join('\n')
	});
}

export async function sendOtraParteInviteEmail(opts: {
	to: string;
	fromNombre: string;
	solicitudId: string;
	accessToken?: string | null;
}) {
	const base = siteOrigin();
	const url = opts.accessToken
		? `${base}/pago/${opts.solicitudId}?t=${encodeURIComponent(opts.accessToken)}`
		: `${base}/cuenta/tramites/${opts.solicitudId}`;

	return sendEmail({
		to: opts.to,
		subject: 'Te han invitado a un trámite de transferencia',
		text: [
			`Hola,`,
			'',
			`${opts.fromNombre || 'Alguien'} te ha incluido en un trámite de transferencia de vehículo en Trámites DGT Online.`,
			`Referencia: ${opts.solicitudId}`,
			'',
			`Accede aquí: ${url}`,
			'',
			'Trámites DGT Online'
		].join('\n')
	});
}

/** Aviso interno: nuevo usuario registrado. */
export async function sendAdminUserRegisteredEmail(opts: {
	nombre: string;
	apellido1: string;
	apellido2?: string;
	email: string;
}) {
	const to = await getAdminNotifyEmail();
	const full = [opts.nombre, opts.apellido1, opts.apellido2]
		.map((s) => (s || '').trim())
		.filter(Boolean)
		.join(' ');

	return sendEmail({
		to,
		subject: `Nuevo usuario registrado: ${opts.email}`,
		text: [
			'Se ha registrado un nuevo usuario en Trámites DGT Online.',
			'',
			`Nombre: ${opts.nombre.trim() || '—'}`,
			`Apellidos: ${[opts.apellido1, opts.apellido2].map((s) => (s || '').trim()).filter(Boolean).join(' ') || '—'}`,
			`Nombre completo: ${full || '—'}`,
			`Email: ${opts.email.trim()}`,
			'',
			'Trámites DGT Online — aviso automático'
		].join('\n')
	});
}

/** Aviso interno: venta / pago confirmado. */
export async function sendAdminSalePaidEmail(opts: {
	email?: string | null;
	nombre?: string | null;
	apellido1?: string | null;
	apellido2?: string | null;
	tipo: string;
	solicitudId: string;
	amountEur?: number | null;
	factura?: {
		razonSocial: string;
		nif: string;
		email: string;
		direccion: string;
	} | null;
}) {
	const to = await getAdminNotifyEmail();
	const base = siteOrigin();
	const label = tipoLabel(opts.tipo);
	const clientName = [opts.nombre, opts.apellido1, opts.apellido2]
		.map((s) => (s || '').trim())
		.filter(Boolean)
		.join(' ');
	const amount =
		opts.amountEur != null && Number.isFinite(opts.amountEur)
			? `${opts.amountEur.toFixed(2)} €`
			: null;
	const gestorUrl = `${base}/gestor/${opts.solicitudId}`;
	const pideFactura = Boolean(opts.factura);

	return sendEmail({
		to,
		subject: pideFactura ? `Venta confirmada (pide factura): ${label}` : `Venta confirmada: ${label}`,
		text: [
			'Un usuario ha finalizado un trámite y lo ha pagado.',
			'',
			`Cliente: ${clientName || '—'}`,
			`Email: ${(opts.email || '').trim() || '—'}`,
			`Trámite: ${label}`,
			`Referencia: ${opts.solicitudId}`,
			...(amount ? [`Importe: ${amount}`] : []),
			...(pideFactura && opts.factura
				? [
						'',
						'El cliente ha pedido factura del servicio:',
						`Razón social: ${opts.factura.razonSocial || '—'}`,
						`NIF/CIF: ${opts.factura.nif || '—'}`,
						`Email factura: ${opts.factura.email || '—'}`,
						`Dirección: ${opts.factura.direccion || '—'}`,
						'Emitir desde el gestor cuando corresponda.'
					]
				: []),
			'',
			`Ver en gestor: ${gestorUrl}`,
			'',
			'Trámites DGT Online — aviso automático'
		].join('\n')
	});
}

export async function sendFacturaClienteEmail(opts: {
	to: string;
	numero: string;
	tipo: string;
	solicitudId: string;
	nombre?: string | null;
	pdf: Buffer;
}) {
	const label = tipoLabel(opts.tipo);
	const hello = opts.nombre?.trim() ? `Hola ${opts.nombre.trim()},` : 'Hola,';
	const filename = `factura-${opts.numero}.pdf`;

	return sendEmail({
		to: opts.to,
		subject: `Factura ${opts.numero} — ${label}`,
		text: [
			hello,
			'',
			`Adjuntamos la factura ${opts.numero} del trámite «${label}».`,
			`Referencia: ${opts.solicitudId}`,
			'',
			'Trámites DGT Online'
		].join('\n'),
		attachments: [{ filename, content: opts.pdf, type: 'application/pdf' }]
	});
}

/** Aviso del gestor al ciudadano (bandeja + email). */
export async function sendGestorAvisoEmail(opts: {
	to: string;
	titulo: string;
	cuerpo?: string | null;
	nombre?: string | null;
	link?: string | null;
}) {
	const base = siteOrigin();
	const inboxUrl = `${base}/cuenta/notificaciones`;
	const actionUrl =
		opts.link && opts.link.startsWith('/')
			? `${base}${opts.link}`
			: opts.link?.startsWith('http')
				? opts.link
				: inboxUrl;
	const hello = opts.nombre?.trim() ? `Hola ${opts.nombre.trim()},` : 'Hola,';
	const body = (opts.cuerpo || '').trim();

	return sendEmail({
		to: opts.to,
		subject: opts.titulo.trim() || 'Aviso de tu trámite',
		text: [
			hello,
			'',
			opts.titulo.trim(),
			...(body ? ['', body] : []),
			'',
			`Ver en tu área: ${actionUrl}`,
			`Todas las notificaciones: ${inboxUrl}`,
			'',
			'Trámites DGT Online'
		].join('\n')
	});
}

export async function sendContactoAckEmail(opts: { to: string; nombre?: string | null }) {
	const hello = opts.nombre?.trim() ? `Hola ${opts.nombre.trim()},` : 'Hola,';
	return sendEmail({
		to: opts.to,
		subject: 'Hemos recibido tu mensaje',
		text: [
			hello,
			'',
			'Hemos recibido tu consulta y te responderemos lo antes posible.',
			'',
			'Trámites DGT Online'
		].join('\n')
	});
}

export async function sendAdminContactoEmail(opts: {
	nombre: string;
	email: string;
	mensaje: string;
}) {
	const to = await getAdminNotifyEmail();
	return sendEmail({
		to,
		subject: `Contacto web: ${opts.email}`,
		text: [
			'Nuevo mensaje desde el formulario de contacto.',
			'',
			`Nombre: ${opts.nombre.trim() || '—'}`,
			`Email: ${opts.email.trim() || '—'}`,
			'',
			opts.mensaje.trim() || '—',
			'',
			'Trámites DGT Online — aviso automático'
		].join('\n')
	});
}

export async function sendAdminPagoIncidenciaEmail(opts: {
	solicitudId: string;
	tipo: string;
	expectedCents: number;
	paidCents: number;
	provider: string;
}) {
	const to = await getAdminNotifyEmail();
	const base = siteOrigin();
	return sendEmail({
		to,
		subject: `Incidencia de pago: ${opts.solicitudId}`,
		text: [
			'Un pago se ha cobrado con un importe distinto al esperado.',
			'',
			`Proveedor: ${opts.provider}`,
			`Trámite: ${tipoLabel(opts.tipo)}`,
			`Referencia: ${opts.solicitudId}`,
			`Esperado: ${(opts.expectedCents / 100).toFixed(2)} €`,
			`Cobrado: ${(opts.paidCents / 100).toFixed(2)} €`,
			'',
			`Ver en gestor: ${base}/gestor/${opts.solicitudId}`,
			'',
			'Trámites DGT Online — aviso automático'
		].join('\n')
	});
}
