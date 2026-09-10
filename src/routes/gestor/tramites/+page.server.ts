import type { PageServerLoad } from './$types';
import { canChangeSolicitudStatus } from '$lib/auth/roles';
import { loadGestorTramites, type GestorTramiteVista } from '$lib/gestor/tramites';

export type GestorTramiteModo = 'kanban' | 'lista';

export const load: PageServerLoad = async ({ url, locals }) => {
	const raw = url.searchParams.get('vista') || 'pendientes';
	const vista: GestorTramiteVista =
		raw === 'finalizados' || raw === 'todos' ? raw : 'pendientes';
	const modo: GestorTramiteModo = url.searchParams.get('modo') === 'lista' ? 'lista' : 'kanban';
	const q = (url.searchParams.get('q') || '').trim();

	const { items, board, counts, error } = await loadGestorTramites(vista, q);

	const titles: Record<GestorTramiteVista, string> = {
		pendientes: 'Trámites pendientes',
		finalizados: 'Trámites finalizados',
		todos: 'Todos los trámites'
	};

	return {
		vista,
		modo,
		q,
		items,
		board,
		counts,
		error,
		canChangeStatus: canChangeSolicitudStatus(locals.profile),
		title: modo === 'kanban' ? 'Tablero de trámites' : titles[vista]
	};
};
