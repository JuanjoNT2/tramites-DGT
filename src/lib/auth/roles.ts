import type { Profile, UserRole } from '$lib/supabase/types';

export function isStaffRole(role: UserRole | string | null | undefined): boolean {
	return role === 'gestor' || role === 'admin';
}

export function canManageUsers(profile: Profile | null | undefined): boolean {
	return profile?.role === 'admin';
}

/** Gestor y admin pueden cambiar el estado del trámite. */
export function canChangeSolicitudStatus(profile: Profile | null | undefined): boolean {
	return isStaffRole(profile?.role);
}

export function canManageAllDocs(profile: Profile | null | undefined): boolean {
	return isStaffRole(profile?.role);
}
