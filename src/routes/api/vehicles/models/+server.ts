import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listModels } from '$lib/server/vehicles-catalog';

export const GET: RequestHandler = async ({ url }) => {
	const marcaId = url.searchParams.get('marcaId')?.trim();
	const combustibleId = url.searchParams.get('combustibleId')?.trim();
	if (!marcaId || !combustibleId) throw error(400, 'Faltan marcaId o combustibleId');

	try {
		const models = await listModels(marcaId, combustibleId);
		return json({ models });
	} catch (e) {
		console.error('[vehicles/models]', e);
		throw error(502, e instanceof Error ? e.message : 'Error al cargar modelos');
	}
};
