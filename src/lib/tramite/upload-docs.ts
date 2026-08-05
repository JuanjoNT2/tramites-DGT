/** Sube los archivos del wizard a /api/cuenta/documentos. */
export async function uploadTramiteDocuments(opts: {
	solicitudId: string;
	files: Record<string, File | null | undefined>;
	accessToken?: string | null;
	/** Rol en transferencia (comprador/vendedor) para sync NIF al perfil. */
	rol?: string | null;
}): Promise<{ ok: true; uploaded: number } | { ok: false; error: string }> {
	const entries = Object.entries(opts.files).filter(([, f]) => f instanceof File) as [
		string,
		File
	][];
	if (!entries.length) return { ok: true, uploaded: 0 };

	let uploaded = 0;
	for (const [docType, file] of entries) {
		const fd = new FormData();
		fd.set('solicitud_id', opts.solicitudId);
		fd.set('file', file, file.name);
		fd.set('doc_type', docType);
		if (opts.accessToken) fd.set('accessToken', opts.accessToken);
		if (opts.rol) fd.set('rol', opts.rol);

		const res = await fetch('/api/cuenta/documentos', { method: 'POST', body: fd });
		const data = await res.json().catch(() => ({}));
		if (!res.ok) {
			return {
				ok: false,
				error:
					typeof data.error === 'string'
						? data.error
						: `No se pudo subir ${docType}`
			};
		}
		uploaded++;
	}
	return { ok: true, uploaded };
}

/** Descarga NIF guardado en el perfil y lo asigna a los slots vacíos del titular. */
export async function loadProfileNifIntoSlots(opts: {
	slotIds: string[];
	current: Record<string, File | null | undefined>;
	onfile: (id: string, file: File) => void;
}): Promise<number> {
	let loaded = 0;
	const needed = new Set<'nif_frontal' | 'nif_trasero'>();
	const slotByKey: Record<string, string[]> = { nif_frontal: [], nif_trasero: [] };

	for (const id of opts.slotIds) {
		if (opts.current[id]) continue;
		if (id.endsWith('_nif_frontal') || id === 'nif_frontal') {
			needed.add('nif_frontal');
			slotByKey.nif_frontal.push(id);
		} else if (id.endsWith('_nif_trasero') || id === 'nif_trasero') {
			needed.add('nif_trasero');
			slotByKey.nif_trasero.push(id);
		}
	}

	for (const key of needed) {
		const res = await fetch(`/api/cuenta/perfil/documentos?tipo=${key}`);
		if (!res.ok) continue;
		const blob = await res.blob();
		if (!blob.size) continue;
		const filename =
			res.headers.get('X-Filename') ||
			decodeURIComponent(
				/filename="?([^";]+)"?/i.exec(res.headers.get('Content-Disposition') || '')?.[1] ||
					`${key}.jpg`
			);
		const file = new File([blob], filename, {
			type: blob.type || res.headers.get('Content-Type') || 'application/octet-stream'
		});
		for (const slotId of slotByKey[key]) {
			opts.onfile(slotId, file);
			loaded++;
		}
	}
	return loaded;
}
