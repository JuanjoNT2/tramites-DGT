import { error, json, type RequestHandler } from '@sveltejs/kit';
import { getFactorCorreccion } from '$lib/server/vehicles-catalog';

export const GET: RequestHandler = async ({ url }) => {
	const fechaMatricula = url.searchParams.get('fechaMatricula')?.trim();
	const fechaVenta = url.searchParams.get('fechaVenta')?.trim() || null;

	if (!fechaMatricula) throw error(400, 'Falta fechaMatricula');

	try {
		const result = await getFactorCorreccion(fechaMatricula, fechaVenta);
		return json({ ok: true, ...result });
	} catch (e) {
		console.error('[depreciacion]', e);
		throw error(502, e instanceof Error ? e.message : 'Error al obtener depreciación oficial');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	let body: { fechaMatricula?: string; fechaVenta?: string };

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Petición inválida' }, { status: 400 });
	}

	const fechaMatricula = body.fechaMatricula?.trim();
	if (!fechaMatricula) {
		return json({ error: 'Falta fechaMatricula' }, { status: 400 });
	}

	try {
		const result = await getFactorCorreccion(fechaMatricula, body.fechaVenta?.trim() || null);
		return json({ ok: true, ...result });
	} catch (e) {
		console.error('[depreciacion]', e);
		return json(
			{ error: e instanceof Error ? e.message : 'Error al obtener depreciación oficial' },
			{ status: 502 }
		);
	}
};
