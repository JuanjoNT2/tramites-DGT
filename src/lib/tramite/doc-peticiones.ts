import type { SolicitudDocPeticion, SolicitudDocumento } from '$lib/supabase/types';

export const DOC_REJECTION_REASONS = [
	{ id: 'borrosa', label: 'Foto borrosa o desenfocada' },
	{ id: 'recortada', label: 'Documento recortado o incompleto' },
	{ id: 'reflejos', label: 'Reflejos o flash' },
	{ id: 'ilegible', label: 'Texto ilegible' },
	{ id: 'no_corresponde', label: 'No es el documento solicitado' },
	{ id: 'otro', label: 'Otro motivo' }
] as const;

export type DocRejectionReasonId = (typeof DOC_REJECTION_REASONS)[number]['id'];

export function rejectionReasonLabel(id: string): string {
	return DOC_REJECTION_REASONS.find((r) => r.id === id)?.label ?? id;
}

export function formatRejectionMotivo(reasonId: string, extra?: string): string {
	const base = rejectionReasonLabel(reasonId);
	const t = (extra || '').trim();
	return t ? `${base}. ${t}` : base;
}

export function sanitizeDocType(raw: string): string {
	return raw
		.trim()
		.replace(/[^\w\-]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 64);
}

export function slugOtroDocType(label: string): string {
	const slug = sanitizeDocType(
		label
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
	);
	if (!slug) return 'otro';
	const withPrefix = slug.startsWith('otro') ? slug : `otro_${slug}`;
	return withPrefix.slice(0, 64);
}

export function inferDocTypeFromNombre(nombre: string): string | null {
	const m = nombre.match(/^([a-zA-Z0-9_-]+)__/);
	return m?.[1] ?? null;
}

export function docTypeOf(
	doc: Pick<SolicitudDocumento, 'nombre'> & {
		doc_type?: string | null;
		meta?: Record<string, unknown> | null;
	}
): string | null {
	const col = (doc.doc_type || '').trim();
	if (col) return col;
	const meta = doc.meta?.doc_type;
	if (typeof meta === 'string' && meta.trim()) return meta.trim();
	return inferDocTypeFromNombre(doc.nombre);
}

export function isDocumentoRechazado(doc: Pick<SolicitudDocumento, 'status'>): boolean {
	return doc.status === 'rechazado';
}

export function documentoCubreSlot(doc: SolicitudDocumento, slotId: string): boolean {
	if (isDocumentoRechazado(doc)) return false;
	return docTypeOf(doc) === slotId;
}

export function displayDocNombre(nombre: string): string {
	return nombre.replace(/^[a-zA-Z0-9_-]+__/, '');
}

export function peticionAbiertaPorTipo(
	peticiones: SolicitudDocPeticion[],
	docType: string
): SolicitudDocPeticion | undefined {
	return peticiones.find((p) => p.status === 'abierta' && p.doc_type === docType);
}

export function tituloAvisoPeticion(kind: 'pendiente' | 'rechazado', label: string): string {
	return kind === 'rechazado'
		? `La DGT no ha aceptado: ${label}`
		: `Falta un documento: ${label}`;
}

export function cuerpoAvisoPeticion(opts: {
	kind: 'pendiente' | 'rechazado';
	label: string;
	motivo?: string | null;
}): string {
	const motivo = (opts.motivo || '').trim();
	if (opts.kind === 'rechazado') {
		const causa = motivo ? ` Motivo: ${motivo}.` : '';
		return `El documento «${opts.label}» no es válido para la DGT.${causa} Vuelve a fotografiarlo (entero, nítido y sin recortes) y súbelo en tu área.`;
	}
	const extra = motivo ? ` ${motivo}` : '';
	return `Necesitamos que subas «${opts.label}» a tu trámite.${extra}`;
}
