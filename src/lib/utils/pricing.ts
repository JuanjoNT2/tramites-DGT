import {
	ccaaList,
	tramitacionFee,
	informeDgtFee,
	tasaDgtCoche,
	tasaDgtMoto
} from '$lib/data/vehicles';

export type PriceBreakdown = {
	precioVenta: number;
	itpRate: number;
	itpAmount: number;
	tasaDgt: number;
	informeDgt: number;
	tramitacion: number;
	total: number;
};

export function calculateTransferPrice(opts: {
	precioVenta: number;
	ccaaId: string;
	tipoVehiculo: 'coche' | 'moto';
	incluirInforme: boolean;
}): PriceBreakdown {
	const ccaa = ccaaList.find((c) => c.id === opts.ccaaId) ?? ccaaList[0];
	const itpAmount = Math.round(opts.precioVenta * ccaa.itpRate);
	const tasaDgt = opts.tipoVehiculo === 'moto' ? tasaDgtMoto : tasaDgtCoche;
	const informeDgt = opts.incluirInforme ? informeDgtFee : 0;
	const total = itpAmount + tasaDgt + informeDgt + tramitacionFee;

	return {
		precioVenta: opts.precioVenta,
		itpRate: ccaa.itpRate,
		itpAmount,
		tasaDgt,
		informeDgt,
		tramitacion: tramitacionFee,
		total: Math.round(total * 100) / 100
	};
}

export function formatEur(n: number): string {
	return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}
