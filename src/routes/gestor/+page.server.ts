import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { loadGestorClientes, type GestorVista } from '$lib/gestor/clients';

export const load: PageServerLoad = async ({ url }) => {
	const raw = url.searchParams.get('vista') || 'todos';
	const vista: GestorVista =
		raw === 'en_curso' ||
		raw === 'finalizados' ||
		raw === 'sin_tramites' ||
		raw === 'pendientes'
			? raw === 'pendientes'
				? 'en_curso'
				: raw
			: 'todos';
	const q = (url.searchParams.get('q') || '').trim();

	const { items, counts, error } = await loadGestorClientes(vista, q);

	const titles: Record<GestorVista, string> = {
		todos: 'Todos los usuarios',
		en_curso: 'Usuarios con trámites en curso',
		finalizados: 'Usuarios con trámites finalizados',
		sin_tramites: 'Usuarios sin trámites'
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

export const actions: Actions = {
	logout: async ({ locals }) => {
		if (locals.supabase) await locals.supabase.auth.signOut();
		throw redirect(303, '/login');
	}
};
