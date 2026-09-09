import { json, type RequestHandler } from '@sveltejs/kit';
import { isStaffRole } from '$lib/auth/roles';
import {
	createNotificacion,
	getProfileById,
	markDocumentoRechazado,
	requireService,
	upsertDocPeticion
} from '$lib/cuenta/data';
import { displayFirstName } from '$lib/cuenta/profile-prefill';
import { sendGestorAvisoEmail } from '$lib/server/mailer';
import {
	cuerpoAvisoPeticion,
	docTypeOf,
	displayDocNombre,
	formatRejectionMotivo,
	sanitizeDocType,
	slugOtroDocType,
	tituloAvisoPeticion
} from '$lib/tramite/doc-peticiones';
import { documentGroupsForSolicitud, flattenDocSlots } from '$lib/tramite/documentos';
import type { Solicitud, SolicitudDocumento } from '$lib/supabase/types';

/**
 * Gestor pide un documento o rechaza uno (DGT) y avisa al ciudadano (bandeja + email).
 * Body pendiente: { solicitudId, kind: 'pendiente', docType, docLabel?, motivo? }
 * Body rechazado: { solicitudId, kind: 'rechazado', documentoId, reasonId, motivo? }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !isStaffRole(locals.profile?.role)) {
		return json({ error: 'No autorizado' }, { status: 403 });
	}

	let body: {
		solicitudId?: string;
		kind?: string;
		docType?: string;
		docLabel?: string;
		motivo?: string;
		documentoId?: string;
		reasonId?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const solicitudId = (body.solicitudId || '').trim();
	const kind = body.kind === 'rechazado' ? 'rechazado' : body.kind === 'pendiente' ? 'pendiente' : null;
	if (!solicitudId || !kind) {
		return json({ error: 'solicitudId y kind (pendiente|rechazado) son obligatorios' }, { status: 400 });
	}

	const extraMotivo = (body.motivo || '').trim();
	if (extraMotivo.length > 2000) {
		return json({ error: 'El motivo es demasiado largo.' }, { status: 400 });
	}

	const sb = requireService();
	const { data: solRaw, error: solErr } = await sb
		.from('solicitudes')
		.select('*')
		.eq('id', solicitudId)
		.maybeSingle();
	if (solErr || !solRaw) return json({ error: 'Trámite no encontrado' }, { status: 404 });
	const sol = solRaw as Solicitud;

	const slots = flattenDocSlots(
		documentGroupsForSolicitud(sol.tipo, (sol.payload || {}) as Record<string, unknown>)
	);
	const slotById = new Map(slots.map((s) => [s.id, s]));

	let docType = sanitizeDocType(body.docType || '');
	let docLabel = (body.docLabel || '').trim().slice(0, 160);
	let motivo: string | null = extraMotivo || null;
	let documentoId: string | null = null;

	if (kind === 'rechazado') {
		const documentoIdRaw = (body.documentoId || '').trim();
		if (!documentoIdRaw) {
			return json({ error: 'documentoId es obligatorio para rechazar' }, { status: 400 });
		}
		const { data: docRaw, error: docErr } = await sb
			.from('solicitud_documentos')
			.select('*')
			.eq('id', documentoIdRaw)
			.maybeSingle();
		if (docErr || !docRaw) return json({ error: 'Documento no encontrado' }, { status: 404 });
		const doc = docRaw as SolicitudDocumento;
		if (doc.solicitud_id !== solicitudId) {
			return json({ error: 'El documento no pertenece a este trámite' }, { status: 400 });
		}

		const reasonId = (body.reasonId || 'otro').trim();
		motivo = formatRejectionMotivo(reasonId, extraMotivo);
		documentoId = doc.id;
		const inferred = docTypeOf(doc);
		if (inferred) {
			docType = sanitizeDocType(inferred);
			docLabel = docLabel || slotById.get(docType)?.label || displayDocNombre(doc.nombre);
		} else {
			docType = slugOtroDocType(displayDocNombre(doc.nombre) || 'documento');
			docLabel = docLabel || displayDocNombre(doc.nombre) || 'Documento';
		}

		await markDocumentoRechazado(doc.id, motivo);
	} else {
		if (docType === 'otro' || (!docType && docLabel)) {
			if (!docLabel) {
				return json({ error: 'Indica el nombre del documento a solicitar' }, { status: 400 });
			}
			docType = slugOtroDocType(docLabel);
		}
		if (!docType) {
			return json({ error: 'docType es obligatorio' }, { status: 400 });
		}
		const slot = slotById.get(docType);
		if (slot) docLabel = slot.label;
		else if (!docLabel) docLabel = displayDocNombre(docType);
	}

	const toEmail = (sol.email || '').trim().toLowerCase();
	if (!sol.user_id && !toEmail) {
		return json(
			{
				error:
					'Este trámite no tiene cuenta ni email. No se puede notificar al ciudadano.'
			},
			{ status: 400 }
		);
	}

	const peticion = await upsertDocPeticion({
		solicitud_id: solicitudId,
		user_id: sol.user_id,
		kind,
		doc_type: docType,
		doc_label: docLabel,
		motivo,
		documento_id: documentoId
	});

	const titulo = tituloAvisoPeticion(kind, docLabel);
	const cuerpo = cuerpoAvisoPeticion({ kind, label: docLabel, motivo });
	const link = `/cuenta/tramites/${solicitudId}`;

	if (sol.user_id) {
		await createNotificacion({
			user_id: sol.user_id,
			tipo: 'documento',
			titulo,
			cuerpo,
			link
		});
	}

	const profile = sol.user_id ? await getProfileById(sol.user_id) : null;
	const to = (profile?.email || toEmail).trim().toLowerCase();
	let emailSent = false;
	if (to) {
		emailSent = await sendGestorAvisoEmail({
			to,
			titulo,
			cuerpo,
			nombre: displayFirstName(profile, to),
			link
		});
	}

	return json({
		ok: true,
		item: peticion,
		emailSent,
		emailSkipped: !to ? 'sin_email' : emailSent ? null : 'resend_omitido',
		inboxSkipped: sol.user_id ? null : 'sin_cuenta'
	});
};
