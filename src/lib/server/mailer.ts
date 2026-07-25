import { env } from '$env/dynamic/private';
import { siteOrigin } from '$lib/auth/urls';
import { SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';

async function sendEmail(opts: {
	to: string;
	subject: string;
	text: string;
	html?: string;
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
			]
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
