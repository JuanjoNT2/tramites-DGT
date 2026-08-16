import { json, type RequestHandler } from '@sveltejs/kit';
import { calculateTransferPrice } from '$lib/utils/pricing';
import { getFactorCorreccion } from '$lib/server/vehicles-catalog';

export const POST: RequestHandler = async ({ request }) => {
	let body: {
		precioVenta?: number;
		ccaaId?: string;
		tipoVehiculo?: 'coche' | 'moto';
		incluirInforme?: boolean;
		precioBase?: string | number | null;
		fechaMatricula?: string;
		fechaVenta?: string;
		facturaEmpresa?: boolean;
		factorCorreccion?: number | null;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Petición inválida' }, { status: 400 });
	}

	if (!(Number(body.precioVenta) > 0) || !body.ccaaId || !body.tipoVehiculo) {
		return json({ error: 'Faltan datos obligatorios' }, { status: 400 });
	}

	let factorCorreccion = body.factorCorreccion ?? null;
	let fuenteDepreciacion: string | null = null;

	if (body.fechaMatricula?.trim()) {
		try {
			const dep = await getFactorCorreccion(body.fechaMatricula, body.fechaVenta ?? null);
			factorCorreccion = dep.factor;
			fuenteDepreciacion = dep.fuente;
		} catch (e) {
			return json(
				{
					error: e instanceof Error ? e.message : 'No se pudo obtener la depreciación oficial',
					code: 'depreciacion'
				},
				{ status: 502 }
			);
		}
	}

	try {
		const breakdown = calculateTransferPrice({
			precioVenta: Number(body.precioVenta),
			ccaaId: body.ccaaId,
			tipoVehiculo: body.tipoVehiculo,
			incluirInforme: body.incluirInforme ?? false,
			precioBase: body.precioBase,
			factorCorreccion,
			facturaEmpresa: body.facturaEmpresa ?? false,
			fuenteDepreciacion
		});

		return json({
			ok: true,
			breakdown,
			meta: {
				ordenReferencia: 'HAC/1501/2025',
				vigencia: 2026
			}
		});
	} catch (e) {
		return json(
			{ error: e instanceof Error ? e.message : 'No se pudo calcular el precio' },
			{ status: 400 }
		);
	}
};
