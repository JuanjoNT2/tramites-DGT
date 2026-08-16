import { shippingOptions, tramitePricing } from '$lib/data/tramite-options';
import { calculateTransferPrice, findCcaa } from '$lib/utils/pricing';
import { getFactorCorreccion } from '$lib/server/vehicles-catalog';

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

function str(v: unknown): string {
	return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function shippingFrom(body: Record<string, unknown>): number {
	const id = str(body.tipoEnvio) || 'postal';
	return shippingOptions.find((o) => o.value === id)?.price ?? shippingOptions[0].price;
}

function truthyFlag(v: unknown): boolean {
	return v === true || v === 'si' || v === 'sí' || v === 'true';
}

/** Importe de catálogo para trámites de tarifa fija (envío incluido si aplica). */
export function catalogAmountForTipo(tipo: string, body: Record<string, unknown>): number | null {
	const shipping = shippingFrom(body);
	switch (tipo) {
		case 'etiqueta':
			return round2(tramitePricing.etiqueta.service + shipping);
		case 'etiqueta-vmp':
		case 'vmp':
			return round2(tramitePricing.etiquetaVmp.service + shipping);
		case 'informe-dgt':
		case 'informe':
			return round2(tramitePricing.informe.service + tramitePricing.informe.dgt);
		case 'duplicado-carnet':
		case 'duplicado':
			return tramitePricing.duplicado.total;
		case 'cancelacion-reserva':
		case 'cancelacion':
			return tramitePricing.cancelacion.total;
		case 'notificacion-venta':
			return tramitePricing.notificacionVenta.total;
		case 'nota-simple':
			return tramitePricing.notaSimple.total;
		case 'baja-temporal':
			return tramitePricing.bajaTemporal.total;
		case 'contacto':
			return null;
		default:
			return null;
	}
}

export async function resolveTransferAmount(
	body: Record<string, unknown>
): Promise<{ ok: true; amount: number } | { ok: false; error: string }> {
	const ccaaId = str(body.ccaaId);
	if (!findCcaa(ccaaId)) {
		return { ok: false, error: 'Comunidad autónoma no válida' };
	}
	const precioVenta = Number(body.precioVenta);
	if (!(precioVenta > 0)) {
		return { ok: false, error: 'Indica un precio de venta mayor que 0' };
	}

	const fechaMatricula = str(body.fechaMatricula);
	const fechaVenta = str(body.fechaVenta);
	let factorCorreccion: number | null = null;
	let fuenteDepreciacion: string | null = null;
	if (fechaMatricula.trim()) {
		try {
			const dep = await getFactorCorreccion(fechaMatricula, fechaVenta || null);
			factorCorreccion = dep.factor;
			fuenteDepreciacion = dep.fuente;
		} catch {
			factorCorreccion = null;
		}
	}

	const tipoVehiculo = str(body.tipoVehiculo) === 'moto' ? 'moto' : 'coche';
	const donacion = str(body.motivoTransferencia) === 'donacion';
	const liquidarItp = !donacion && str(body.liquidarItp) !== 'no' && body.liquidarItp !== false;
	const meta =
		body.modeloMeta && typeof body.modeloMeta === 'object'
			? (body.modeloMeta as { precioBase?: string })
			: null;
	const precioBase =
		tipoVehiculo === 'coche'
			? typeof body.precioBase === 'string' || typeof body.precioBase === 'number'
				? body.precioBase
				: (meta?.precioBase ?? null)
			: null;

	try {
		const breakdown = calculateTransferPrice({
			precioVenta,
			ccaaId,
			tipoVehiculo,
			incluirInforme: truthyFlag(body.incluirInforme),
			precioBase,
			factorCorreccion,
			facturaEmpresa: truthyFlag(body.facturaEmpresa),
			liquidarItp,
			fuenteDepreciacion
		});
		return { ok: true, amount: breakdown.total };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : 'No se pudo calcular el importe'
		};
	}
}

/** Importe canónico. Nunca se usa el amount enviado por el cliente. */
export async function resolveCanonicalAmount(
	tipo: string,
	body: Record<string, unknown>
): Promise<{ ok: true; amount: number | null } | { ok: false; error: string }> {
	if (tipo === 'contacto') return { ok: true, amount: null };
	if (tipo === 'transferencia') return resolveTransferAmount(body);
	const catalog = catalogAmountForTipo(tipo, body);
	if (catalog == null || !(catalog > 0)) {
		return { ok: false, error: 'Tipo de trámite no válido' };
	}
	return { ok: true, amount: catalog };
}
