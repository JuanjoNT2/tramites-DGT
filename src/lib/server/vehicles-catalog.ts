import brands from '$lib/data/vehicle-brands.json';
import motoBrands from '$lib/data/vehicle-moto-brands.json';

const UPSTREAM = 'https://gestion.tramitesdgtonline.com/components/post';
const REFERER = 'https://gestion.tramitesdgtonline.com/precio-de-transferencia/index.php';
const NHTSA = 'https://vpic.nhtsa.dot.gov/api/vehicles';

export type VehicleBrand = { id: string; name: string; source?: string };

export type VehicleFuel = { id: string; name: string };

export type VehicleModel = {
	id: string;
	label: string;
	cilindrada: string;
	cilindros: string;
	combustible: string;
	potenciaKw: string;
	potenciaCv: string;
	potenciaCvf: string;
	precioBase: string;
	categoria: string;
};

export type MotoModel = { id: string; label: string };

const fuelsCache = new Map<string, { at: number; fuels: VehicleFuel[] }>();
const modelsCache = new Map<string, { at: number; models: VehicleModel[] }>();
const motoModelsCache = new Map<string, { at: number; models: MotoModel[] }>();
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

function stillFresh(at: number) {
	return Date.now() - at < TTL_MS;
}

async function postUpstream(path: string, body: Record<string, string>): Promise<unknown> {
	const res = await fetch(`${UPSTREAM}/${path}?noselect=1`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json, text/plain, */*',
			Referer: REFERER,
			Origin: 'https://gestion.tramitesdgtonline.com'
		},
		body: new URLSearchParams(body).toString()
	});

	if (!res.ok) {
		throw new Error(`Catálogo de vehículos no disponible (${res.status})`);
	}

	const text = await res.text();
	try {
		return JSON.parse(text);
	} catch {
		throw new Error('Respuesta inválida del catálogo de vehículos');
	}
}

function parseOptions(html: string): { value: string; label: string; attrs: Record<string, string> }[] {
	const out: { value: string; label: string; attrs: Record<string, string> }[] = [];
	const re = /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html))) {
		const attrsHtml = m[1];
		const label = m[2].replace(/\s+/g, ' ').trim();
		const valueMatch = attrsHtml.match(/\bvalue="([^"]*)"/i);
		const value = valueMatch?.[1] ?? '';
		if (!value) continue;
		const attrs: Record<string, string> = {};
		for (const am of attrsHtml.matchAll(/data-([a-z0-9-]+)="([^"]*)"/gi)) {
			attrs[am[1].toLowerCase()] = am[2];
		}
		out.push({ value, label, attrs });
	}
	return out;
}

export function listBrands(): VehicleBrand[] {
	return brands as VehicleBrand[];
}

export function listMotoBrands(): VehicleBrand[] {
	return motoBrands as VehicleBrand[];
}

export async function listFuels(marcaId: string): Promise<VehicleFuel[]> {
	const cached = fuelsCache.get(marcaId);
	if (cached && stillFresh(cached.at)) return cached.fuels;

	const data = (await postUpstream('ajax_post_tipo_combustible_anidado.php', {
		id_marca: marcaId
	})) as { error?: number; html_select_tipo_combustible?: string };

	if (data.error === 1 || !data.html_select_tipo_combustible) {
		throw new Error('No se pudieron cargar los combustibles');
	}

	const fuels = parseOptions(data.html_select_tipo_combustible).map((o) => ({
		id: o.value,
		name: o.label
	}));
	fuelsCache.set(marcaId, { at: Date.now(), fuels });
	return fuels;
}

export async function listModels(marcaId: string, combustibleId: string): Promise<VehicleModel[]> {
	const key = `${marcaId}:${combustibleId}`;
	const cached = modelsCache.get(key);
	if (cached && stillFresh(cached.at)) return cached.models;

	const data = (await postUpstream('ajax_post_modelo_anidado.php', {
		id_marca: marcaId,
		id_tipo_combustible: combustibleId
	})) as { error?: number; html_select_modelo?: string };

	if (data.error === 1 || !data.html_select_modelo) {
		throw new Error('No se pudieron cargar los modelos');
	}

	const models = parseOptions(data.html_select_modelo).map((o) => ({
		id: o.value,
		label: o.label,
		cilindrada: o.attrs['cilindrada'] ?? '',
		cilindros: o.attrs['cilindros'] ?? '',
		combustible: o.attrs['combustible'] ?? '',
		potenciaKw: o.attrs['potencia-kw'] ?? '',
		potenciaCv: o.attrs['potencia-cv'] ?? '',
		potenciaCvf: o.attrs['potencia-cvf'] ?? '',
		precioBase: o.attrs['precio-base'] ?? '',
		categoria: o.attrs['nom-categoria-vehiculo'] ?? ''
	}));

	modelsCache.set(key, { at: Date.now(), models });
	return models;
}

export type FactorCorreccion = {
	factor: number;
	fechaMatricula: string;
	fechaVenta: string;
	diffAniosDias: string | null;
	fuente: string;
};

const factorCache = new Map<string, { at: number; value: FactorCorreccion }>();

/** Convierte yyyy-mm-dd o dd/mm/yyyy a dd/mm/yyyy (formato del upstream). */
export function toUpstreamDate(input: string): string | null {
	const s = input.trim();
	if (!s) return null;
	const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
	const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
	if (dmy) {
		const d = dmy[1].padStart(2, '0');
		const m = dmy[2].padStart(2, '0');
		return `${d}/${m}/${dmy[3]}`;
	}
	return null;
}

/**
 * Factor de corrección Anexo IV (Orden Hacienda precios medios),
 * vía el mismo upstream oficial que usa la web de gestión.
 */
export async function getFactorCorreccion(
	fechaMatriculaRaw: string,
	fechaVentaRaw?: string | null
): Promise<FactorCorreccion> {
	const fechaMatricula = toUpstreamDate(fechaMatriculaRaw);
	if (!fechaMatricula) {
		throw new Error('Fecha de matrícula inválida (usa dd/mm/aaaa o aaaa-mm-dd)');
	}

	const ventaRaw =
		fechaVentaRaw?.trim() ||
		(() => {
			const n = new Date();
			return `${String(n.getDate()).padStart(2, '0')}/${String(n.getMonth() + 1).padStart(2, '0')}/${n.getFullYear()}`;
		})();
	const fechaVenta = toUpstreamDate(ventaRaw);
	if (!fechaVenta) {
		throw new Error('Fecha de venta inválida (usa dd/mm/aaaa o aaaa-mm-dd)');
	}

	const cacheKey = `${fechaMatricula}|${fechaVenta}`;
	const cached = factorCache.get(cacheKey);
	if (cached && stillFresh(cached.at)) return cached.value;

	const data = (await postUpstream('ajax_post_depreciacion_fecha_primera_matricula.php', {
		fecha_matricula: fechaMatricula,
		fecha_venta: fechaVenta
	})) as {
		error?: number;
		error_fecha_mayor?: number;
		factor_correcion_porcent?: number | null;
		fecha_matricula?: string | null;
		fecha_venta?: string | null;
		diff_anios_dias?: string | null;
	};

	if (data.error === 1 || data.factor_correcion_porcent == null) {
		if (data.error_fecha_mayor === 1) {
			throw new Error('La fecha de matrícula no puede ser posterior a la de venta');
		}
		throw new Error('No se pudo obtener la depreciación oficial');
	}

	const value: FactorCorreccion = {
		factor: Number(data.factor_correcion_porcent),
		fechaMatricula: data.fecha_matricula ?? fechaMatricula,
		fechaVenta: data.fecha_venta ?? fechaVenta,
		diffAniosDias: data.diff_anios_dias ?? null,
		fuente: 'Orden HAC Anexo IV (vía gestión.tramitesdgtonline.com)'
	};

	factorCache.set(cacheKey, { at: Date.now(), value });
	return value;
}

export async function listMotoModels(marcaId: string): Promise<MotoModel[]> {
	const brand = listMotoBrands().find((b) => b.id === marcaId);
	if (!brand) throw new Error('Marca de moto no encontrada');

	// Marcas añadidas a mano (mercado ES) sin catálogo NHTSA
	if (marcaId.startsWith('es-')) return [];

	const cached = motoModelsCache.get(marcaId);
	if (cached && stillFresh(cached.at)) return cached.models;

	const url = `${NHTSA}/GetModelsForMake/${encodeURIComponent(brand.name)}?format=json`;
	const res = await fetch(url, { headers: { Accept: 'application/json' } });
	if (!res.ok) throw new Error(`Catálogo de motos no disponible (${res.status})`);

	const data = (await res.json()) as {
		Results?: { Model_ID: number; Model_Name: string }[];
	};

	const seen = new Set<string>();
	const models: MotoModel[] = [];
	for (const row of data.Results ?? []) {
		const label = (row.Model_Name ?? '').trim();
		if (!label) continue;
		const key = label.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		models.push({ id: String(row.Model_ID), label });
	}
	models.sort((a, b) => a.label.localeCompare(b.label, 'es'));

	motoModelsCache.set(marcaId, { at: Date.now(), models });
	return models;
}
