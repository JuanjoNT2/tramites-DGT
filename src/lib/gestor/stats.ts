import { getServiceSupabase } from '$lib/supabase/admin';
import { SOLICITUD_TIPO_LABELS, SOLICITUD_TIPOS } from '$lib/supabase/types';

export type GestorMonthStat = {
	tipo: string;
	label: string;
	count: number;
};

export type GestorMonthlyReport = {
	year: number;
	month: number;
	/** YYYY-MM */
	monthKey: string;
	label: string;
	total: number;
	byTipo: GestorMonthStat[];
	error: string | null;
};

function monthBounds(year: number, month: number): { start: string; end: string } {
	const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
	const end = new Date(year, month, 0, 23, 59, 59, 999);
	return { start: start.toISOString(), end: end.toISOString() };
}

function normalizeTipo(tipo: string): string {
	const t = (tipo || 'desconocido').trim().toLowerCase();
	if (t === 'informe') return 'informe-dgt';
	if (t === 'vmp') return 'etiqueta-vmp';
	if (t === 'duplicado') return 'duplicado-carnet';
	if (t === 'cancelacion') return 'cancelacion-reserva';
	return t;
}

function labelFor(tipo: string): string {
	return SOLICITUD_TIPO_LABELS[tipo] || tipo;
}

/** Mes calendario actual o el indicado (1–12). */
export function resolveReportMonth(raw: string | null): { year: number; month: number } {
	const now = new Date();
	if (raw && /^\d{4}-\d{2}$/.test(raw)) {
		const year = Number(raw.slice(0, 4));
		const month = Number(raw.slice(5, 7));
		if (year >= 2020 && year <= now.getFullYear() + 1 && month >= 1 && month <= 12) {
			return { year, month };
		}
	}
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthKey(year: number, month: number): string {
	return `${year}-${String(month).padStart(2, '0')}`;
}

export function monthLabel(year: number, month: number): string {
	const d = new Date(year, month - 1, 1);
	const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
	return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Trámites realizados con éxito (status = realizada) en el mes calendario,
 * agrupados por tipo.
 */
export async function loadGestorMonthlyReport(
	year: number,
	month: number
): Promise<GestorMonthlyReport> {
	const key = monthKey(year, month);
	const label = monthLabel(year, month);
	const empty: GestorMonthlyReport = {
		year,
		month,
		monthKey: key,
		label,
		total: 0,
		byTipo: [],
		error: null
	};

	const sb = getServiceSupabase();
	if (!sb) {
		return { ...empty, error: 'Supabase no configurado.' };
	}

	const { start, end } = monthBounds(year, month);
	const { data, error } = await sb
		.from('solicitudes')
		.select('id,tipo,status,updated_at')
		.eq('status', 'realizada')
		.gte('updated_at', start)
		.lte('updated_at', end)
		.limit(8000);

	if (error) {
		console.error('[gestor/stats]', error.message);
		return { ...empty, error: error.message };
	}

	const counts = new Map<string, number>();
	for (const row of data ?? []) {
		const tipo = normalizeTipo(String((row as { tipo?: string }).tipo || 'desconocido'));
		counts.set(tipo, (counts.get(tipo) || 0) + 1);
	}

	const known = new Set<string>(SOLICITUD_TIPOS as readonly string[]);
	const byTipo: GestorMonthStat[] = [...counts.entries()]
		.map(([tipo, count]) => ({
			tipo,
			label: labelFor(tipo),
			count
		}))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));

	// Incluir tipos conocidos a 0 para lectura estable del informe
	for (const tipo of SOLICITUD_TIPOS) {
		if (tipo === 'contacto') continue;
		if (!counts.has(tipo) && known.has(tipo)) {
			byTipo.push({ tipo, label: labelFor(tipo), count: 0 });
		}
	}
	byTipo.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));

	const total = [...counts.values()].reduce((s, n) => s + n, 0);
	return { ...empty, total, byTipo, error: null };
}

/** Opciones de selector: últimos 12 meses. */
export function recentMonthOptions(from = new Date()): { value: string; label: string }[] {
	const opts: { value: string; label: string }[] = [];
	for (let i = 0; i < 12; i++) {
		const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
		const year = d.getFullYear();
		const month = d.getMonth() + 1;
		opts.push({ value: monthKey(year, month), label: monthLabel(year, month) });
	}
	return opts;
}
