import { calculateTransferPrice, type PriceBreakdown } from '$lib/utils/pricing';

export type DepreciacionResult = {
	factor: number;
	fuente: string;
	diffAniosDias: string | null;
};

export function looksLikeDate(s: string): boolean {
	const t = s.trim();
	return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(t) || /^\d{4}-\d{2}-\d{2}$/.test(t);
}

export async function fetchFactorCorreccion(
	fechaMatricula: string,
	fechaVenta?: string | null
): Promise<DepreciacionResult> {
	const params = new URLSearchParams({ fechaMatricula: fechaMatricula.trim() });
	if (fechaVenta?.trim()) params.set('fechaVenta', fechaVenta.trim());

	const res = await fetch(`/api/depreciacion?${params}`);
	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok) {
		const msg =
			(typeof data.error === 'string' && data.error) ||
			(typeof data.message === 'string' && data.message) ||
			'No se pudo obtener la depreciación oficial';
		throw new Error(msg);
	}
	return {
		factor: Number(data.factor),
		fuente: typeof data.fuente === 'string' ? data.fuente : 'Orden HAC Anexo IV',
		diffAniosDias: typeof data.diffAniosDias === 'string' ? data.diffAniosDias : null
	};
}

export function buildTransferBreakdown(opts: {
	precioVenta: number;
	ccaaId: string;
	tipoVehiculo: 'coche' | 'moto';
	incluirInforme: boolean;
	precioBase?: string | number | null;
	factorCorreccion?: number | null;
	facturaEmpresa?: boolean;
	liquidarItp?: boolean;
	fuenteDepreciacion?: string | null;
}): PriceBreakdown {
	return calculateTransferPrice(opts);
}
