import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listMotoModels } from '$lib/server/vehicles-catalog';

export const GET: RequestHandler = async ({ url }) => {
	const marcaId = url.searchParams.get('marcaId')?.trim();
	if (!marcaId) throw error(400, 'Falta marcaId');

	try {
		const models = await listMotoModels(marcaId);
		return json({ models, allowCustom: models.length === 0 || marcaId.startsWith('es-') });
	} catch (e) {
		console.error('[vehicles/moto/models]', e);
		throw error(502, e instanceof Error ? e.message : 'Error al cargar modelos de moto');
	}
};
