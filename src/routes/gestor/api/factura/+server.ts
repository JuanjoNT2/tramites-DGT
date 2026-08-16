import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchSolicitudById, requireGestor } from '$lib/gestor/access';
import { sendFacturaClienteEmail } from '$lib/server/mailer';
import {
	amountFromSolicitudPayload,
	buildFacturaPdf,
	facturaFilename,
	getFacturaEmisor
} from '$lib/server/factura-pdf';
import { nextFacturaNumero } from '$lib/server/site-settings';
import { getServiceSupabase } from '$lib/supabase/admin';
import {
	facturaClienteFromPayload,
	facturaEmitidaFromPayload,
	solicitaFacturaFromPayload
} from '$lib/tramite/factura-cliente';
import type { Solicitud } from '$lib/supabase/types';

function pdfResponse(pdf: Buffer, numero: string) {
	return new Response(new Uint8Array(pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${facturaFilename(numero)}"`
		}
	});
}

async function savePayload(id: string, payload: Record<string, unknown>): Promise<Solicitud> {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');
	const { data, error: err } = await sb
		.from('solicitudes')
		.update({ payload, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select('*')
		.maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) throw error(404, 'Solicitud no encontrada');
	return data as Solicitud;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	requireGestor(locals);
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'Falta id');
	const item = await fetchSolicitudById(id);
	const payload = (item.payload || {}) as Record<string, unknown>;
	if (!solicitaFacturaFromPayload(payload) || !facturaEmitidaFromPayload(payload)) {
		throw error(409, 'La factura aún no está emitida');
	}
	const numero = String(payload.facturaNumero || '');
	const emitidaAt = String(payload.facturaEmitidaAt || new Date().toISOString());
	const pdf = await buildFacturaPdf({ solicitud: item, numero, emitidaAt });
	return pdfResponse(pdf, numero);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	requireGestor(locals);
	if (!getFacturaEmisor()) {
		return json(
			{ error: 'Configura FACTURA_EMISOR_NIF y el resto de datos del emisor' },
			{ status: 503 }
		);
	}

	let body: { solicitudId?: string; enviarEmail?: boolean } = {};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON no válido' }, { status: 400 });
	}
	const id = String(body.solicitudId || '').trim();
	if (!id) return json({ error: 'Falta solicitudId' }, { status: 400 });

	try {
		let item = await fetchSolicitudById(id);
		const payload = { ...((item.payload || {}) as Record<string, unknown>) };
		if (!solicitaFacturaFromPayload(payload)) {
			return json({ error: 'Esta solicitud no pide factura' }, { status: 400 });
		}
		if (item.status === 'cancelada') {
			return json({ error: 'No se puede facturar una solicitud cancelada' }, { status: 400 });
		}
		if (amountFromSolicitudPayload(payload) == null) {
			return json({ error: 'No hay importe cobrado para facturar' }, { status: 400 });
		}

		const already = facturaEmitidaFromPayload(payload);
		const numero = already ? String(payload.facturaNumero) : await nextFacturaNumero();
		const emitidaAt = already
			? String(payload.facturaEmitidaAt || new Date().toISOString())
			: new Date().toISOString();
		const emitidaPor =
			already && payload.facturaEmitidaPor
				? String(payload.facturaEmitidaPor)
				: locals.profile?.email || locals.user?.email || locals.profile?.full_name || 'gestor';

		if (!already) {
			payload.facturaNumero = numero;
			payload.facturaEmitidaAt = emitidaAt;
			payload.facturaEmitidaPor = emitidaPor;
			item = await savePayload(item.id, payload);
		}

		const pdf = await buildFacturaPdf({ solicitud: item, numero, emitidaAt });
		let emailed = false;
		if (body.enviarEmail) {
			const fiscal = facturaClienteFromPayload(payload);
			emailed = await sendFacturaClienteEmail({
				to: fiscal.email,
				numero,
				tipo: item.tipo,
				solicitudId: item.id,
				nombre: fiscal.razonSocial,
				pdf
			});
			if (!emailed) {
				return json({
					ok: true,
					numero,
					emailed: false,
					item,
					warning: 'Factura emitida, pero no se pudo enviar el email'
				});
			}
		}

		return json({ ok: true, numero, emailed, item });
	} catch (e) {
		if (isHttpError(e)) throw e;
		const message = e instanceof Error ? e.message : 'Error al emitir la factura';
		console.error('[gestor/factura]', e);
		return json({ error: message }, { status: 500 });
	}
};
