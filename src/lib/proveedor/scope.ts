/**
 * Alcance del proveedor externo (Ideauto). Módulo puro, sin imports de $lib/$env,
 * para poder testearlo con node:test.
 */

/** Tipos de trámite que gestiona el proveedor externo. `etiqueta-vmp` (patinetes) no entra. */
export const PROVEEDOR_TIPOS = ['etiqueta'] as const;

export function isProveedorTipo(tipo: string | null | undefined): boolean {
	return (PROVEEDOR_TIPOS as readonly string[]).includes((tipo || '').trim());
}
