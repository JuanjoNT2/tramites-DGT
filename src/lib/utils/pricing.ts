import { ccaaList, tramitacionFee, informeDgtFee } from '$lib/data/vehicles';

export type PriceBreakdown = {
	precioVenta: number;
	precioBase: number | null;
	factorCorreccion: number | null;
	valorSegunPrecioVenta: number | null;
	valoracionReal: number | null;
	baseImponible: number;
	itpRate: number;
	itpAmount: number;
	facturaEmpresa: boolean;
	sinValorBoe: boolean;
	/** Incluido en tramitación; se deja a 0 para no duplicar en el desglose. */
	tasaDgt: number;
	informeDgt: number;
	tramitacion: number;
	total: number;
	fuente?: {
		precios: string | null;
		depreciacion: string | null;
	};
};

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

function parsePrecioBase(raw: string | number | null | undefined): number | null {
	if (raw == null || raw === '') return null;
	if (typeof raw === 'number') {
		return Number.isFinite(raw) && raw > 0 ? raw : null;
	}
	const cleaned = String(raw).trim().replace(/\s/g, '').replace(/€/g, '');
	// Formato ES con miles: 20.600 o 20.600,50
	const n = /,\d+$/.test(cleaned)
		? Number(cleaned.replace(/\./g, '').replace(',', '.'))
		: /^\d{1,3}(\.\d{3})+$/.test(cleaned)
			? Number(cleaned.replace(/\./g, ''))
			: Number(cleaned.replace(',', '.'));
	if (!Number.isFinite(n) || n <= 0) return null;
	return n;
}

export function calculateTransferPrice(opts: {
	precioVenta: number;
	ccaaId: string;
	tipoVehiculo: 'coche' | 'moto';
	incluirInforme: boolean;
	precioBase?: string | number | null;
	factorCorreccion?: number | null;
	facturaEmpresa?: boolean;
	fuenteDepreciacion?: string | null;
}): PriceBreakdown {
	const ccaa = ccaaList.find((c) => c.id === opts.ccaaId) ?? ccaaList[0];
	const facturaEmpresa = opts.facturaEmpresa === true;
	const precioBase = parsePrecioBase(opts.precioBase);
	const factor =
		opts.factorCorreccion != null && Number.isFinite(opts.factorCorreccion)
			? Number(opts.factorCorreccion)
			: null;

	const sinValorBoe = precioBase == null || factor == null;
	const valorSegunPrecioVenta = precioBase;
	const valoracionReal =
		precioBase != null && factor != null ? round2(precioBase * (factor / 100)) : null;

	let baseImponible: number;
	let itpAmount: number;

	if (facturaEmpresa) {
		baseImponible = 0;
		itpAmount = 0;
	} else if (valoracionReal != null) {
		baseImponible = round2(Math.max(opts.precioVenta, valoracionReal));
		itpAmount = round2(baseImponible * ccaa.itpRate);
	} else {
		baseImponible = round2(opts.precioVenta);
		itpAmount = round2(opts.precioVenta * ccaa.itpRate);
	}

	const informeDgt = opts.incluirInforme ? informeDgtFee : 0;
	const tramitacion = tramitacionFee;
	const total = round2(itpAmount + informeDgt + tramitacion);

	return {
		precioVenta: opts.precioVenta,
		precioBase,
		factorCorreccion: factor,
		valorSegunPrecioVenta,
		valoracionReal,
		baseImponible,
		itpRate: ccaa.itpRate,
		itpAmount,
		facturaEmpresa,
		sinValorBoe,
		tasaDgt: 0,
		informeDgt,
		tramitacion,
		total,
		fuente: {
			precios: precioBase != null ? 'Orden HAC Anexo I (vía catálogo gestión)' : null,
			depreciacion: factor != null ? (opts.fuenteDepreciacion ?? 'Orden HAC Anexo IV') : null
		}
	};
}

export function formatEur(n: number): string {
	return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}
