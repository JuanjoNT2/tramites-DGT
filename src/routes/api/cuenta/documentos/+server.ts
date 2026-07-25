import { error, json, type RequestHandler } from '@sveltejs/kit';
import {
	canUserUploadDocs,
	getUserSolicitud,
	listDocsForSolicitud,
	listDocsForUser,
	requireService,
	requireUser
} from '$lib/cuenta/data';
import { canManageAllDocs, isStaffRole } from '$lib/auth/roles';
import { fetchSolicitudById } from '$lib/gestor/access';

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
	const user = requireUser(locals);
	const form = await request.formData();
	const solicitudId = String(form.get('solicitud_id') || '');
	const file = form.get('file');
	if (!solicitudId || !(file instanceof File)) {
		return json({ error: 'solicitud_id y file obligatorios' }, { status: 400 });
	}

	const staff = canManageAllDocs(locals.profile);
	let ownerId = user.id;
	if (staff) {
		const sol = await fetchSolicitudById(solicitudId);
		ownerId = sol.user_id || user.id;
	} else {
		const sol = await getUserSolicitud(user.id, solicitudId);
		if (!canUserUploadDocs(String(sol.status))) {
			return json({ error: 'No puedes subir documentos en este estado' }, { status: 403 });
		}
	}

	const sb = requireService();
	const safeName = file.name.replace(/[^\w.\-áéíóúüñÁÉÍÓÚÜÑ ]+/g, '_').slice(0, 120);
	const path = `${solicitudId}/${crypto.randomUUID()}-${safeName}`;
	const buffer = new Uint8Array(await file.arrayBuffer());

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
			nombre: safeName,
			path,
			mime: file.type || null,
			uploaded_by
		})
		.select('*')
		.maybeSingle();

	if (insErr) return json({ error: insErr.message }, { status: 500 });
	return json({ ok: true, item: data });
};
