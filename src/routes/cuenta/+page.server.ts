import type { PageServerLoad } from './$types';
import {
	listNotificaciones,
	listUserSolicitudes,
	listVehiculos
} from '$lib/cuenta/data';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const [enCurso, realizados, vehiculos, notificaciones] = await Promise.all([
		listUserSolicitudes(userId, 'en_curso').catch(() => []),
		listUserSolicitudes(userId, 'realizados').catch(() => []),
		listVehiculos(userId).catch(() => []),
		listNotificaciones(userId).catch(() => [])
	]);

	return {
		counts: {
			enCurso: enCurso.length,
			realizados: realizados.length,
			vehiculos: vehiculos.length,
			unread: notificaciones.filter((n) => !n.read_at).length
		},
		recientes: [...enCurso, ...realizados]
			.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
			.slice(0, 5),
		notificaciones: notificaciones.slice(0, 5),
		emailConfirmed: Boolean(locals.user?.email_confirmed_at),
		profile: locals.profile
	};
};
