/**
 * Calendario del envío automático del Excel de Ideauto. Módulo puro, sin imports
 * de $lib/$env, para poder testearlo con node:test.
 */

export const FRECUENCIAS = ['diario', 'semanal', 'mensual'] as const;
export type Frecuencia = (typeof FRECUENCIAS)[number];

export const FRECUENCIA_LABELS: Record<Frecuencia, string> = {
	diario: 'Cada día (con los distintivos del día anterior)',
	semanal: 'Cada lunes (con la semana anterior)',
	mensual: 'El día 1 de cada mes (con el mes anterior)'
};

export type ReportRange = { startDate: string; endDate: string };

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

function iso(d: Date): string {
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function utcDay(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, days: number): Date {
	const x = new Date(d);
	x.setUTCDate(x.getUTCDate() + days);
	return x;
}

/**
 * Rango que toca enviar hoy, o null si hoy no toca (o el envío está apagado).
 * Los periodos siempre están cerrados, así no se solapan entre envíos.
 */
export function dueReportRange(
	cfg: { enabled: boolean; frecuencia: Frecuencia },
	today: Date
): ReportRange | null {
	if (!cfg.enabled) return null;

	const hoy = utcDay(today);

	if (cfg.frecuencia === 'diario') {
		const ayer = addDays(hoy, -1);
		return { startDate: iso(ayer), endDate: iso(ayer) };
	}

	if (cfg.frecuencia === 'semanal') {
		// getUTCDay: 0 domingo, 1 lunes
		if (hoy.getUTCDay() !== 1) return null;
		const lunesPasado = addDays(hoy, -7);
		const domingoPasado = addDays(hoy, -1);
		return { startDate: iso(lunesPasado), endDate: iso(domingoPasado) };
	}

	if (hoy.getUTCDate() !== 1) return null;
	const finMesAnterior = addDays(hoy, -1);
	const inicioMesAnterior = new Date(
		Date.UTC(finMesAnterior.getUTCFullYear(), finMesAnterior.getUTCMonth(), 1)
	);
	return { startDate: iso(inicioMesAnterior), endDate: iso(finMesAnterior) };
}
