import { resolveDateRange } from '$lib/admin/dates';
import type { GestorSolicitudesFilter } from '$lib/gestor/access';
import { SOLICITUD_STATUSES, type SolicitudStatus } from '$lib/supabase/types';

const STATUSES = new Set<string>(SOLICITUD_STATUSES as readonly string[]);

/** Opciones del selector de estado en el formulario de descarga del gestor. */
export const EXPORT_ESTADO_OPTIONS: { value: string; label: string }[] = [
	{ value: 'todos', label: 'Todos los estados' },
	{ value: 'nueva', label: 'Nuevos' },
	{ value: 'pendiente_pago', label: 'Pendiente de pago' },
	{ value: 'pagada', label: 'Pagada' },
	{ value: 'en_curso', label: 'En curso' },
	{ value: 'realizada', label: 'Realizada' },
	{ value: 'cancelada', label: 'Cancelada' }
];

export function normalizeExportEstado(value: string | null | undefined): string {
	const v = (value || '').trim();
	return STATUSES.has(v) ? (v as SolicitudStatus) : 'todos';
}

/**
 * Filtros del export del gestor. El rango de fechas solo se aplica si la URL
 * lo pide; sin parámetros de fecha se descarga el histórico completo.
 */
export function parseGestorExportFilter(url: URL): GestorSolicitudesFilter {
	const params = url.searchParams;
	// Un formulario GET manda los campos vacíos: solo cuenta lo que trae valor
	const hasRange = Boolean(
		(params.get('preset') || '').trim() ||
			(params.get('start') || '').trim() ||
			(params.get('end') || '').trim()
	);
	return {
		tipo: params.get('tipo') || 'todos',
		estado: normalizeExportEstado(params.get('estado')),
		range: hasRange ? resolveDateRange(url) : null
	};
}

/** `tramites-en_curso-2026-09-01_2026-09-30.xls` */
export function exportFilename(filter: GestorSolicitudesFilter, ext: string): string {
	const parts = ['tramites'];
	const tipo = (filter.tipo || 'todos').trim();
	if (tipo && tipo !== 'todos') parts.push(tipo);
	const estado = (filter.estado || 'todos').trim();
	if (estado && estado !== 'todos') parts.push(estado);
	parts.push(
		filter.range
			? `${filter.range.startDate}_${filter.range.endDate}`
			: new Date().toISOString().slice(0, 10)
	);
	return `${parts.join('-')}.${ext}`;
}
