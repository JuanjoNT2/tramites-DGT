import { error, json, type RequestHandler } from '@sveltejs/kit';
import {
	canUserUploadDocs,
	getUserSolicitud,
	listDocsForSolicitud,
	listDocsForUser,
	requireService,
	requireUser
} from '$lib/cuenta/data';
import { upsertProfileNifDocument } from '$lib/cuenta/profile-docs';
import { shouldSaveDocTypeToProfile } from '$lib/cuenta/profile-prefill';
import { canManageAllDocs, isStaffRole } from '$lib/auth/roles';
import { fetchSolicitudById } from '$lib/gestor/access';
import { canAccessPagoSolicitud } from '$lib/pago/access';
import { getServiceSupabase } from '$lib/supabase/admin';
import { verifyDocumentUpload } from '$lib/server/doc-verify';
import type { Profile, Solicitud } from '$lib/supabase/types';

const BUCKET = 'tramite-docs';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals);
	const solicitudId = url.searchParams.get('solicitud_id');
	const downloadId = url.searchParams.get('download');

	if (downloadId) {
		const sb = requireService();
		const { data: doc, error: err } = await sb
			.from('solicitud_documentos')
			.select('*')
			.eq('id', downloadId)
			.maybeSingle();
		if (err || !doc) throw error(404, 'Documento no encontrado');

		const staff = isStaffRole(locals.profile?.role);
		if (!staff && doc.user_id !== user.id) throw error(403, 'No autorizado');

		const { data: file, error: dlErr } = await sb.storage.from(BUCKET).download(doc.path);
		if (dlErr || !file) throw error(500, dlErr?.message || 'No se pudo descargar');

		return new Response(file, {
			headers: {
				'Content-Type': doc.mime || 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${doc.nombre}"`
			}
		});
	}

	if (solicitudId) {
		const staff = canManageAllDocs(locals.profile);
		if (!staff) await getUserSolicitud(user.id, solicitudId);
		else await fetchSolicitudById(solicitudId);
		const items = await listDocsForSolicitud(solicitudId);
		return json({ items });
	}

	const items = await listDocsForUser(user.id);
	return json({ items });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const form = await request.formData();
	const solicitudId = String(form.get('solicitud_id') || '');
	const file = form.get('file');
	const docType = String(form.get('doc_type') || '')
		.trim()
		.replace(/[^\w\-]+/g, '_')
		.slice(0, 64);
	const accessToken = String(form.get('accessToken') || '').trim() || null;
	const rolHint = String(form.get('rol') || '').trim() || null;
	const saveProfileFlag = String(form.get('save_to_profile') || '').trim();

	if (!solicitudId || !(file instanceof File)) {
		return json({ error: 'solicitud_id y file obligatorios' }, { status: 400 });
	}

	const sb = getServiceSupabase();
	if (!sb) return json({ error: 'Supabase no configurado' }, { status: 503 });

	const { data: solRaw, error: solErr } = await sb
		.from('solicitudes')
		.select('*')
		.eq('id', solicitudId)
		.maybeSingle();
	if (solErr || !solRaw) return json({ error: 'Solicitud no encontrada' }, { status: 404 });
	const sol = solRaw as Solicitud;

	const user = locals.user;
	const staff = canManageAllDocs(locals.profile);
	const viaToken = canAccessPagoSolicitud({ sol, userId: user?.id, token: accessToken });

	if (!staff && !viaToken) {
		if (!user) return json({ error: 'Debes iniciar sesión' }, { status: 401 });
		if (sol.user_id !== user.id) return json({ error: 'No autorizado' }, { status: 403 });
	}

	if (!staff && !canUserUploadDocs(String(sol.status))) {
		return json({ error: 'No puedes subir documentos en este estado' }, { status: 403 });
	}

	const buffer = new Uint8Array(await file.arrayBuffer());
	const verify = await verifyDocumentUpload({
		docType: docType || 'other',
		mime: file.type || 'application/octet-stream',
		bytes: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
		filename: file.name
	});
	if (!verify.ok) {
		return json(
			{
				error: verify.message || 'El documento no coincide con el tipo esperado',
				verify
			},
			{ status: 422 }
		);
	}

	const ownerId = sol.user_id || user?.id || null;
	const safeName = file.name.replace(/[^\w.\-áéíóúüñÁÉÍÓÚÜÑ ]+/g, '_').slice(0, 120);
	const storedName = docType ? `${docType}__${safeName}` : safeName;
	const path = `${solicitudId}/${crypto.randomUUID()}-${safeName}`;

	const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buffer, {
		contentType: file.type || 'application/octet-stream',
		upsert: false
	});
	if (upErr) {
		console.error('[docs] upload', upErr.message);
		return json({ error: upErr.message }, { status: 500 });
	}

	const uploaded_by = locals.profile?.role === 'admin' ? 'admin' : staff ? 'gestor' : 'user';
	const { data, error: insErr } = await sb
		.from('solicitud_documentos')
		.insert({
			solicitud_id: solicitudId,
			user_id: ownerId,
			nombre: storedName,
			path,
			mime: file.type || null,
			uploaded_by,
			meta: {
				doc_type: docType || null,
				verify: {
					expected: verify.expected,
					detected: verify.detected,
					confidence: verify.confidence,
					skipped: verify.skipped ?? false
				}
			}
		})
		.select('*')
		.maybeSingle();

	if (insErr) {
		// Si la columna meta no existe aún, reintentar sin meta
		if (insErr.message?.includes('meta')) {
			const retry = await sb
				.from('solicitud_documentos')
				.insert({
					solicitud_id: solicitudId,
					user_id: ownerId,
					nombre: storedName,
					path,
					mime: file.type || null,
					uploaded_by
				})
				.select('*')
				.maybeSingle();
			if (retry.error) return json({ error: retry.error.message }, { status: 500 });
			await maybeSyncProfileNif();
			return json({ ok: true, item: retry.data, verify });
		}
		return json({ error: insErr.message }, { status: 500 });
	}

	await maybeSyncProfileNif();
	return json({ ok: true, item: data, verify });

	async function maybeSyncProfileNif() {
		const uid = user?.id || ownerId;
		if (!uid || uploaded_by !== 'user' || saveProfileFlag === '0') return;
		const profileKey = shouldSaveDocTypeToProfile(docType, { rol: rolHint });
		if (!profileKey || !(file instanceof File)) return;
		await upsertProfileNifDocument({
			userId: uid,
			key: profileKey,
			bytes: buffer,
			mime: file.type || null,
			nombre: file.name,
			existing: locals.profile as Profile | null
		}).catch((e) => console.error('[docs] profile nif sync', e));
	}
};
