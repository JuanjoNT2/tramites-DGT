import { getServiceSupabase } from '$lib/supabase/admin';
import { FRECUENCIAS, type Frecuencia } from '$lib/proveedor/schedule';

const KEY = 'proveedor_excel_report';

export type ProveedorReportConfig = {
	/** Interruptor del envío programado. Apagado por defecto. */
	enabled: boolean;
	frecuencia: Frecuencia;
	/** Destinatario; si está vacío se usa PROVEEDOR_NOTIFY_EMAIL o la cuenta del proveedor. */
	email: string | null;
	lastSentAt: string | null;
};

export const DEFAULT_REPORT_CONFIG: ProveedorReportConfig = {
	enabled: false,
	frecuencia: 'semanal',
	email: null,
	lastSentAt: null
};

function normalizeEmail(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim().toLowerCase();
	return trimmed.includes('@') ? trimmed : null;
}

function fromValue(value: unknown): ProveedorReportConfig {
	if (!value || typeof value !== 'object') return { ...DEFAULT_REPORT_CONFIG };
	const v = value as Record<string, unknown>;
	const frecuencia = FRECUENCIAS.includes(v.frecuencia as Frecuencia)
		? (v.frecuencia as Frecuencia)
		: DEFAULT_REPORT_CONFIG.frecuencia;
	return {
		enabled: v.enabled === true,
		frecuencia,
		email: normalizeEmail(v.email),
		lastSentAt: typeof v.lastSentAt === 'string' ? v.lastSentAt : null
	};
}

export async function getProveedorReportConfig(): Promise<ProveedorReportConfig> {
	const sb = getServiceSupabase();
	if (!sb) return { ...DEFAULT_REPORT_CONFIG };

	const { data, error } = await sb
		.from('site_settings')
		.select('value')
		.eq('key', KEY)
		.maybeSingle();

	if (error) {
		console.error('[proveedor-report] get', error.message);
		return { ...DEFAULT_REPORT_CONFIG };
	}
	return fromValue(data?.value);
}

export async function setProveedorReportConfig(
	patch: Partial<ProveedorReportConfig>
): Promise<ProveedorReportConfig> {
	const sb = getServiceSupabase();
	if (!sb) throw new Error('Supabase no configurado');

	const current = await getProveedorReportConfig();
	const next: ProveedorReportConfig = {
		enabled: patch.enabled ?? current.enabled,
		frecuencia: patch.frecuencia ?? current.frecuencia,
		email: patch.email === undefined ? current.email : normalizeEmail(patch.email),
		lastSentAt: patch.lastSentAt === undefined ? current.lastSentAt : patch.lastSentAt
	};

	const { error } = await sb.from('site_settings').upsert(
		{ key: KEY, value: next, updated_at: new Date().toISOString() },
		{ onConflict: 'key' }
	);

	if (error) {
		console.error('[proveedor-report] set', error.message);
		throw new Error(error.message);
	}
	return next;
}
