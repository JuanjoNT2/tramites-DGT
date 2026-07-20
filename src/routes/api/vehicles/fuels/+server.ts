import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listFuels } from '$lib/server/vehicles-catalog';

export const GET: RequestHandler = async ({ url }) => {
	const marcaId = url.searchParams.get('marcaId')?.trim();
	if (!marcaId) throw error(400, 'Falta marcaId');

	try {
		const fuels = await listFuels(marcaId);
		return json({ fuels });
	} catch (e) {
		console.error('[vehicles/fuels]', e);
		throw error(502, e instanceof Error ? e.message : 'Error al cargar combustibles');
	}
};
