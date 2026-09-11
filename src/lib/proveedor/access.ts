import { error } from '@sveltejs/kit';
import { canAccessProveedorPanel } from '$lib/auth/roles';

export function requireProveedor(locals: App.Locals) {
	if (!locals.user || !canAccessProveedorPanel(locals.profile)) {
		throw error(401, 'No autorizado');
	}
}
