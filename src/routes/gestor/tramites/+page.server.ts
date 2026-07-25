import type { PageServerLoad } from './$types';
import { loadGestorTramites, type GestorTramiteVista } from '$lib/gestor/tramites';

export const load: PageServerLoad = async ({ url }) => {
	const raw = url.searchParams.get('vista') || 'pendientes';
	const vista: GestorTramiteVista =
		raw === 'finalizados' || raw === 'todos' ? raw : 'pendientes';
	const q = (url.searchParams.get('q') || '').trim();

	const { items, counts, error } = await loadGestorTramites(vista, q);

	const titles: Record<GestorTramiteVista, string> = {
		pendientes: 'Trámites pendientes',
		finalizados: 'Trámites finalizados',
		todos: 'Todos los trámites'
	};

	return {
		vista,
		q,
		items,
		counts,
		error,
		title: titles[vista]
	};
};
