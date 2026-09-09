export const ccaaList = [
	{ id: 'andalucia', name: 'Andalucía', itpRate: 0.04 },
	{ id: 'aragon', name: 'Aragón', itpRate: 0.04 },
	{ id: 'asturias', name: 'Asturias', itpRate: 0.04 },
	{ id: 'cantabria', name: 'Cantabria', itpRate: 0.08 },
	{ id: 'clm', name: 'Castilla-La Mancha', itpRate: 0.06 },
	{ id: 'cyl', name: 'Castilla y León', itpRate: 0.05 },
	{ id: 'cataluna', name: 'Cataluña', itpRate: 0.05 },
	{ id: 'madrid', name: 'Comunidad de Madrid', itpRate: 0.04 },
	{ id: 'valencia', name: 'Comunidad Valenciana', itpRate: 0.06 },
	{ id: 'extremadura', name: 'Extremadura', itpRate: 0.06 },
	{ id: 'galicia', name: 'Galicia', itpRate: 0.08 },
	{ id: 'baleares', name: 'Islas Baleares', itpRate: 0.04 },
	{ id: 'rioja', name: 'La Rioja', itpRate: 0.04 },
	{ id: 'navarra', name: 'Navarra', itpRate: 0.04 },
	{ id: 'pais-vasco', name: 'País Vasco', itpRate: 0.04 },
	{ id: 'murcia', name: 'Región de Murcia', itpRate: 0.04 },
	{ id: 'canarias', name: 'Canarias', itpRate: 0 },
	{ id: 'ceuta', name: 'Ceuta', itpRate: 0 },
	{ id: 'melilla', name: 'Melilla', itpRate: 0 }
] as const;

export const combustibles = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'GLP', 'GNC'] as const;

function foldFuelKey(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

/**
 * Etiqueta de UI para el select de combustible.
 * Hacienda llama «Híbrido Gasolina Eléctrico» a todos los híbridos/PHEV de esa
 * tabla, incluidos diésel enchufables (p. ej. Mercedes E 300 de).
 */
export function displayFuelLabel(name: string): string {
	const key = foldFuelKey(name);
	if (!key) return name;
	if (key === 'diesel' || key === 'gasoleo') return 'Diésel';
	if (key.includes('hibrido') && (key.includes('diesel') || key.includes('gasoleo'))) {
		return 'Híbrido diésel';
	}
	if (key.includes('hibrido') && (key.includes('gasolina') || key.includes('electric'))) {
		return 'Híbrido / enchufable';
	}
	if (key === 'gasolina glp' || (key.includes('gasolina') && key.includes('glp'))) {
		return 'Gasolina / GLP';
	}
	return name.trim();
}

export function fuelCatalogHint(fuels: { name: string }[]): string | undefined {
	const keys = fuels.map((f) => foldFuelKey(f.name));
	const hasHybridBucket = keys.some(
		(k) => k.includes('hibrido') && (k.includes('gasolina') || k.includes('electric'))
	);
	if (hasHybridBucket) {
		return 'Híbrido / enchufable cubre gasolina y diésel (PHEV). Si no ves tu versión, prueba Diésel y busca Hybrid.';
	}
	return undefined;
}

/** Tramitación (incluye tasas DGT en el importe mostrado al cliente, como en gestión). */
export const tramitacionFee = 144.95;
export const informeDgtFee = 15.95;
/** Conservadas por si se desglosan aparte en el futuro. */
export const tasaDgtCoche = 55.7;
export const tasaDgtMoto = 27.85;
