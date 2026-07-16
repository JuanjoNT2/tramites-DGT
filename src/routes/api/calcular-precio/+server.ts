import { json, type RequestHandler } from '@sveltejs/kit';
import { calculateTransferPrice } from '$lib/utils/pricing';

export const POST: RequestHandler = async ({ request }) => {
	let body: {
		precioVenta?: number;
		ccaaId?: string;
		tipoVehiculo?: 'coche' | 'moto';
		incluirInforme?: boolean;
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Petición inválida' }, { status: 400 });
	}

	if (!body.precioVenta || !body.ccaaId || !body.tipoVehiculo) {
		return json({ error: 'Faltan datos obligatorios' }, { status: 400 });
	}

	const breakdown = calculateTransferPrice({
		precioVenta: body.precioVenta,
		ccaaId: body.ccaaId,
		tipoVehiculo: body.tipoVehiculo,
		incluirInforme: body.incluirInforme ?? false
	});

	return json({ ok: true, breakdown });
};
