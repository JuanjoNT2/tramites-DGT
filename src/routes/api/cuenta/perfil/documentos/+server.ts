import { error, json, type RequestHandler } from '@sveltejs/kit';
import { requireUser } from '$lib/cuenta/data';
import { downloadProfileNifDocument, upsertProfileNifDocument } from '$lib/cuenta/profile-docs';
import { shouldSaveDocTypeToProfile } from '$lib/cuenta/profile-prefill';
import { verifyDocumentUpload } from '$lib/server/doc-verify';
import type { Profile } from '$lib/supabase/types';

const KEYS = new Set(['nif_frontal', 'nif_trasero']);

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals);
	const tipo = String(url.searchParams.get('tipo') || '').trim();
	if (!KEYS.has(tipo)) {
		return json({ error: 'tipo debe ser nif_frontal o nif_trasero' }, { status: 400 });
	}

	const result = await downloadProfileNifDocument(
		user.id,
		tipo as 'nif_frontal' | 'nif_trasero',
		locals.profile as Profile | null
	);
	if (!result) throw error(404, 'Documento no encontrado');

	const filename = result.ref.nombre || `${tipo}.jpg`;
	return new Response(result.blob, {
		headers: {
			'Content-Type': result.ref.mime || result.blob.type || 'application/octet-stream',
			'Content-Disposition': `inline; filename="${filename}"`,
			'X-Filename': filename,
			'Cache-Control': 'private, max-age=60'
		}
	});
};

/** Subida directa del NIF al perfil (página Mis datos / reutilización). */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	const form = await request.formData();
	const file = form.get('file');
	const docType = String(form.get('doc_type') || form.get('tipo') || '')
		.trim()
		.replace(/[^\w\-]+/g, '_')
		.slice(0, 64);

	const key =
		shouldSaveDocTypeToProfile(docType) ||
		(KEYS.has(docType) ? (docType as 'nif_frontal' | 'nif_trasero') : null);

	if (!key || !(file instanceof File)) {
		return json({ error: 'file y tipo nif_frontal/nif_trasero obligatorios' }, { status: 400 });
	}

	const buffer = new Uint8Array(await file.arrayBuffer());
	const verify = await verifyDocumentUpload({
		docType: key,
		mime: file.type || 'application/octet-stream',
		bytes: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
		filename: file.name
	});
	if (!verify.ok) {
		return json(
			{ error: verify.message || 'El documento no coincide con el tipo esperado', verify },
			{ status: 422 }
		);
	}

	const ref = await upsertProfileNifDocument({
		userId: user.id,
		key,
		bytes: buffer,
		mime: file.type || null,
		nombre: file.name,
		existing: locals.profile as Profile | null
	});
	if (!ref) return json({ error: 'No se pudo guardar el documento' }, { status: 500 });

	return json({ ok: true, item: ref, verify });
};
