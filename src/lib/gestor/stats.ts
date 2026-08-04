import { classifySolicitud } from '$lib/gestor/clients';
import { getServiceSupabase } from '$lib/supabase/admin';
import { SOLICITUD_TIPO_LABELS, SOLICITUD_TIPOS } from '$lib/supabase/types';

export type ChartGroup = 'mes' | 'tipo';
export type ChartMetric = 'realizadas' | 'creadas' | 'pendientes';
export type ChartOrder = 'valor' | 'nombre' | 'cronologico';

export type GestorBar = {
	key: string;
	label: string;
	count: number;
};

export type GestorDashboardFilters = {
	rango: number;
	tipo: string;
	metrica: ChartMetric;
	agrupar: ChartGroup;
	orden: ChartOrder;
};

export type GestorDashboardKpis = {
	pendientes: number;
	realizadas: number;
	finalizados: number;
	usuarios: number;
	usuariosConPendientes: number;
	sinTramites: number;
	creadasMes: number;
	realizadasMes: number;
	realizadasMesAnterior: number;
	/** Variación % del mes actual vs el anterior (realizadas). null si no hay base. */
	evolucionPct: number | null;
};

export type GestorDashboardPreview = {
	id: string;
	tipo: string;
	tipoLabel: string;
	status: string;
	email: string | null;
	userId: string | null;
	matricula: string | null;
	createdAt: string;
};

export type GestorDashboard = {
	kpis: GestorDashboardKpis;
	filters: GestorDashboardFilters;
	chart: {
		title: string;
		subtitle: string;
		bars: GestorBar[];
		max: number;
	};
	recentPendientes: GestorDashboardPreview[];
	tipoOptions: { value: string; label: string }[];
	rangoOptions: { value: string; label: string }[];
	error: string | null;
};

type SolRow = {
	id: string;
	tipo: string;
	status: string;
	email: string | null;
	user_id: string | null;
	created_at: string;
	updated_at: string | null;
	payload?: Record<string, unknown> | null;
};

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

export function monthKey(year: number, month: number): string {
	return `${year}-${String(month).padStart(2, '0')}`;
}

export function monthLabel(year: number, month: number): string {
	const d = new Date(year, month - 1, 1);
	const label = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
	return label.charAt(0).toUpperCase() + label.slice(1);
}

function parseMonthKey(iso: string | null | undefined): string | null {
	if (!iso) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	return monthKey(d.getFullYear(), d.getMonth() + 1);
}

function monthsBack(from: Date, n: number): { year: number; month: number; key: string; label: string }[] {
	const out: { year: number; month: number; key: string; label: string }[] = [];
	for (let i = n - 1; i >= 0; i--) {
		const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
		const year = d.getFullYear();
		const month = d.getMonth() + 1;
		out.push({ year, month, key: monthKey(year, month), label: monthLabel(year, month) });
	}
	return out;
}

function rangeStartIso(months: number, from = new Date()): string {
	const d = new Date(from.getFullYear(), from.getMonth() - (months - 1), 1, 0, 0, 0, 0);
	return d.toISOString();
}

function matchesTipo(rowTipo: string, filterTipo: string): boolean {
	if (!filterTipo || filterTipo === 'todos') return true;
	return normalizeTipo(rowTipo) === filterTipo;
}

function metricDate(row: SolRow, metrica: ChartMetric): string | null {
	if (metrica === 'creadas' || metrica === 'pendientes') return row.created_at;
	return row.updated_at || row.created_at;
}

function matchesMetric(row: SolRow, metrica: ChartMetric): boolean {
	const kind = classifySolicitud(row.status);
	if (metrica === 'realizadas') return row.status === 'realizada';
	if (metrica === 'pendientes') return kind === 'pendiente';
	return true; // creadas = todas en el rango temporal
}

function metricLabel(metrica: ChartMetric): string {
	if (metrica === 'realizadas') return 'realizados con éxito';
	if (metrica === 'pendientes') return 'pendientes (creados en el periodo)';
	return 'creados';
}

export function parseDashboardFilters(url: URL): GestorDashboardFilters {
	const rangoRaw = Number(url.searchParams.get('rango') || '6');
	const rango = rangoRaw === 3 || rangoRaw === 12 ? rangoRaw : 6;

	const tipoRaw = (url.searchParams.get('tipo') || 'todos').trim().toLowerCase();
	const known = new Set<string>(SOLICITUD_TIPOS as readonly string[]);
	const tipo = tipoRaw === 'todos' || known.has(tipoRaw) ? tipoRaw : 'todos';

	const metricaRaw = url.searchParams.get('metrica') || 'realizadas';
	const metrica: ChartMetric =
		metricaRaw === 'creadas' || metricaRaw === 'pendientes' ? metricaRaw : 'realizadas';

	const agruparRaw = url.searchParams.get('agrupar') || 'mes';
	const agrupar: ChartGroup = agruparRaw === 'tipo' ? 'tipo' : 'mes';

	const ordenRaw = url.searchParams.get('orden') || (agrupar === 'mes' ? 'cronologico' : 'valor');
	const orden: ChartOrder =
		ordenRaw === 'nombre' || ordenRaw === 'cronologico' || ordenRaw === 'valor'
			? ordenRaw
			: agrupar === 'mes'
				? 'cronologico'
				: 'valor';

	return { rango, tipo, metrica, agrupar, orden };
}

function emptyKpis(): GestorDashboardKpis {
	return {
		pendientes: 0,
		realizadas: 0,
		finalizados: 0,
		usuarios: 0,
		usuariosConPendientes: 0,
		sinTramites: 0,
		creadasMes: 0,
		realizadasMes: 0,
		realizadasMesAnterior: 0,
		evolucionPct: null
	};
}

/**
 * Dashboard del gestor: KPIs globales + serie para diagrama de barras
 * filtrable por rango, tipo, métrica y agrupación.
 */
export async function loadGestorDashboard(filters: GestorDashboardFilters): Promise<GestorDashboard> {
	const tipoOptions = [
		{ value: 'todos', label: 'Todos los trámites' },
		...SOLICITUD_TIPOS.filter((t) => t !== 'contacto').map((t) => ({
			value: t,
			label: labelFor(t)
		}))
	];
	const rangoOptions = [
		{ value: '3', label: 'Últimos 3 meses' },
		{ value: '6', label: 'Últimos 6 meses' },
		{ value: '12', label: 'Últimos 12 meses' }
	];

	const empty: GestorDashboard = {
		kpis: emptyKpis(),
		filters,
		chart: { title: '', subtitle: '', bars: [], max: 1 },
		recentPendientes: [],
		tipoOptions,
		rangoOptions,
		error: null
	};

	const sb = getServiceSupabase();
	if (!sb) {
		return { ...empty, error: 'Supabase no configurado.' };
	}

	const [{ data: profiles, error: pErr }, { data: sols, error: sErr }] = await Promise.all([
		sb.from('profiles').select('id').eq('role', 'user').limit(5000),
		sb
			.from('solicitudes')
			.select('id,tipo,status,email,user_id,created_at,updated_at,payload')
			.order('created_at', { ascending: false })
			.limit(8000)
	]);

	if (pErr || sErr) {
		return {
			...empty,
			error: pErr?.message || sErr?.message || 'Error al cargar datos'
		};
	}

	const rows = ((sols ?? []) as SolRow[]).map((r) => ({
		...r,
		tipo: normalizeTipo(String(r.tipo || 'desconocido')),
		status: String(r.status || '')
	}));
	const userIds = new Set((profiles ?? []).map((p) => String((p as { id: string }).id)));

	const now = new Date();
	const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);
	const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const prevKey = monthKey(prev.getFullYear(), prev.getMonth() + 1);

	let pendientes = 0;
	let realizadas = 0;
	let finalizados = 0;
	let creadasMes = 0;
	let realizadasMes = 0;
	let realizadasMesAnterior = 0;

	const usersWithAny = new Set<string>();
	const usersWithPending = new Set<string>();

	for (const row of rows) {
		const kind = classifySolicitud(row.status);
		if (kind === 'pendiente') pendientes++;
		if (row.status === 'realizada') realizadas++;
		if (kind === 'finalizado') finalizados++;

		const createdKey = parseMonthKey(row.created_at);
		const doneKey = parseMonthKey(row.updated_at || row.created_at);
		if (createdKey === currentKey) creadasMes++;
		if (row.status === 'realizada' && doneKey === currentKey) realizadasMes++;
		if (row.status === 'realizada' && doneKey === prevKey) realizadasMesAnterior++;

		if (row.user_id && userIds.has(row.user_id)) {
			usersWithAny.add(row.user_id);
			if (kind === 'pendiente') usersWithPending.add(row.user_id);
		}
	}

	const usuarios = userIds.size;
	const usuariosConPendientes = usersWithPending.size;
	const sinTramites = Math.max(0, usuarios - usersWithAny.size);
	const evolucionPct =
		realizadasMesAnterior > 0
			? Math.round(((realizadasMes - realizadasMesAnterior) / realizadasMesAnterior) * 1000) / 10
			: realizadasMes > 0
				? 100
				: null;

	const kpis: GestorDashboardKpis = {
		pendientes,
		realizadas,
		finalizados,
		usuarios,
		usuariosConPendientes,
		sinTramites,
		creadasMes,
		realizadasMes,
		realizadasMesAnterior,
		evolucionPct
	};

	const startIso = rangeStartIso(filters.rango, now);
	const monthAxis = monthsBack(now, filters.rango);

	const scoped = rows.filter((row) => {
		if (!matchesTipo(row.tipo, filters.tipo)) return false;
		if (!matchesMetric(row, filters.metrica)) return false;
		const when = metricDate(row, filters.metrica);
		if (!when) return false;
		return when >= startIso;
	});

	let bars: GestorBar[] = [];

	if (filters.agrupar === 'mes') {
		const counts = new Map(monthAxis.map((m) => [m.key, 0]));
		for (const row of scoped) {
			const key = parseMonthKey(metricDate(row, filters.metrica));
			if (!key || !counts.has(key)) continue;
			counts.set(key, (counts.get(key) || 0) + 1);
		}
		bars = monthAxis.map((m) => ({
			key: m.key,
			label: m.label,
			count: counts.get(m.key) || 0
		}));
	} else {
		const counts = new Map<string, number>();
		for (const row of scoped) {
			counts.set(row.tipo, (counts.get(row.tipo) || 0) + 1);
		}
		const tiposBase =
			filters.tipo !== 'todos'
				? [filters.tipo]
				: SOLICITUD_TIPOS.filter((t) => t !== 'contacto');
		for (const t of tiposBase) {
			if (!counts.has(t)) counts.set(t, 0);
		}
		bars = [...counts.entries()].map(([tipo, count]) => ({
			key: tipo,
			label: labelFor(tipo),
			count
		}));
	}

	if (filters.orden === 'nombre') {
		bars.sort((a, b) => a.label.localeCompare(b.label, 'es'));
	} else if (filters.orden === 'valor') {
		bars.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
	} else if (filters.agrupar === 'tipo') {
		// cronologico no aplica a tipos → valor
		bars.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
	}
	// mes + cronologico: ya viene en orden temporal

	const max = Math.max(1, ...bars.map((b) => b.count));
	const tipoPart =
		filters.tipo === 'todos' ? 'todos los tipos' : labelFor(filters.tipo).toLowerCase();
	const chart = {
		title:
			filters.agrupar === 'mes'
				? `Evolución mensual (${metricLabel(filters.metrica)})`
				: `Por tipo de trámite (${metricLabel(filters.metrica)})`,
		subtitle: `${filters.rango} meses · ${tipoPart}`,
		bars,
		max
	};

	const recentPendientes: GestorDashboardPreview[] = rows
		.filter((r) => classifySolicitud(r.status) === 'pendiente')
		.slice(0, 8)
		.map((r) => ({
			id: r.id,
			tipo: r.tipo,
			tipoLabel: labelFor(r.tipo),
			status: r.status,
			email: r.email,
			userId: r.user_id,
			matricula: String(r.payload?.matricula ?? '').trim() || null,
			createdAt: r.created_at
		}));

	return {
		kpis,
		filters,
		chart,
		recentPendientes,
		tipoOptions,
		rangoOptions,
		error: null
	};
}
