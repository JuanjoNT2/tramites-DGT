/** Fórmula oficial turismos (RD 2822/1998): PF = 0,08 × n × (D/n)^0,6 */
export function potenciaFiscalTurismo(cilindradaCc: number, cilindros: number): number {
	if (!(cilindradaCc > 0) || !(cilindros > 0)) return 0;
	return round2(0.08 * cilindros * Math.pow(cilindradaCc / cilindros, 0.6));
}

/** Motocicletas: misma base con un cilindro equivalente. */
export function potenciaFiscalMoto(cilindradaCc: number): number {
	if (!(cilindradaCc > 0)) return 0;
	return round2(0.08 * Math.pow(cilindradaCc, 0.6));
}

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

export function parsePositiveNumber(raw: string | number | null | undefined): number | null {
	if (raw == null || raw === '') return null;
	const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(',', '.'));
	if (!Number.isFinite(n) || n <= 0) return null;
	return n;
}
