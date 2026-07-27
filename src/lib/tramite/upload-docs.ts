/** Sube los archivos del wizard a /api/cuenta/documentos. */
export async function uploadTramiteDocuments(opts: {
	solicitudId: string;
	files: Record<string, File | null | undefined>;
	accessToken?: string | null;
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
