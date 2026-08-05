import { getServiceSupabase } from '$lib/supabase/admin';
import type { Profile, ProfileDocumentoRef, ProfileDocumentos } from '$lib/supabase/types';
import { updateProfileFields } from '$lib/cuenta/data';

export const PROFILE_DOCS_BUCKET = 'tramite-docs';

export type ProfileNifKey = 'nif_frontal' | 'nif_trasero';

function extFromName(name: string, mime: string | null | undefined): string {
	const fromName = name.split('.').pop()?.toLowerCase();
	if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
	if (mime === 'image/png') return 'png';
	if (mime === 'image/webp') return 'webp';
	if (mime === 'application/pdf') return 'pdf';
	return 'jpg';
}

/** Guarda (o sustituye) el NIF del perfil en storage + columna documentos. */
export async function upsertProfileNifDocument(opts: {
	userId: string;
	key: ProfileNifKey;
	bytes: Uint8Array;
	mime: string | null;
	nombre: string;
	existing?: Profile | null;
}): Promise<ProfileDocumentoRef | null> {
	const sb = getServiceSupabase();
	if (!sb) return null;

	const ext = extFromName(opts.nombre, opts.mime);
	const path = `profiles/${opts.userId}/${opts.key}.${ext}`;
	const contentType = opts.mime || 'application/octet-stream';

	const { error: upErr } = await sb.storage.from(PROFILE_DOCS_BUCKET).upload(path, opts.bytes, {
		contentType,
		upsert: true
	});
	if (upErr) {
		console.error('[profile-docs] upload', upErr.message);
		return null;
	}

	const ref: ProfileDocumentoRef = {
		path,
		mime: contentType,
		nombre: opts.nombre.slice(0, 120),
		updated_at: new Date().toISOString()
	};

	const prev = (opts.existing?.documentos || {}) as ProfileDocumentos;
	const documentos: ProfileDocumentos = { ...prev, [opts.key]: ref };

	try {
		await updateProfileFields(opts.userId, { documentos });
	} catch (e) {
		// Columna aún no migrada: el archivo queda en storage; se ignora el fallo de meta.
		console.error('[profile-docs] profile update', e);
	}

	return ref;
}

export async function downloadProfileNifDocument(
	userId: string,
	key: ProfileNifKey,
	profile?: Profile | null
): Promise<{ blob: Blob; ref: ProfileDocumentoRef } | null> {
	const sb = getServiceSupabase();
	if (!sb) return null;

	let ref = (profile?.documentos as ProfileDocumentos | null | undefined)?.[key];
	if (!ref?.path) {
		const { data } = await sb
			.from('profiles')
			.select('documentos')
			.eq('id', userId)
			.maybeSingle();
		ref = (data?.documentos as ProfileDocumentos | null | undefined)?.[key];
	}
	if (!ref?.path) return null;
	if (!ref.path.startsWith(`profiles/${userId}/`)) return null;

	const { data: file, error } = await sb.storage.from(PROFILE_DOCS_BUCKET).download(ref.path);
	if (error || !file) return null;
	return { blob: file, ref };
}
