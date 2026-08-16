import { getServiceSupabase } from '$lib/supabase/admin';

export const DEFAULT_ADMIN_NOTIFY_EMAIL = 'juanjo.navarro@performanze.com';
const KEY = 'admin_notify_email';

function emailFromValue(value: unknown): string | null {
	if (!value || typeof value !== 'object') return null;
	const email = (value as { email?: unknown }).email;
	if (typeof email !== 'string') return null;
	const trimmed = email.trim().toLowerCase();
	return trimmed.includes('@') ? trimmed : null;
}

/** Email donde recibir avisos de registro y ventas. */
export async function getAdminNotifyEmail(): Promise<string> {
	const sb = getServiceSupabase();
	if (!sb) return DEFAULT_ADMIN_NOTIFY_EMAIL;

	const { data, error } = await sb
		.from('site_settings')
		.select('value')
		.eq('key', KEY)
		.maybeSingle();

	if (error) {
		console.error('[site-settings] getAdminNotifyEmail', error.message);
		return DEFAULT_ADMIN_NOTIFY_EMAIL;
	}

	return emailFromValue(data?.value) || DEFAULT_ADMIN_NOTIFY_EMAIL;
}

export async function setAdminNotifyEmail(email: string): Promise<string> {
	const normalized = email.trim().toLowerCase();
	const sb = getServiceSupabase();
	if (!sb) throw new Error('Supabase no configurado');

	const { error } = await sb.from('site_settings').upsert(
		{
			key: KEY,
			value: { email: normalized },
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'key' }
	);

	if (error) {
		console.error('[site-settings] setAdminNotifyEmail', error.message);
		throw new Error(error.message);
	}
	return normalized;
}

async function bumpFacturaSeqFallback(year: number): Promise<number> {
	const sb = getServiceSupabase();
	if (!sb) throw new Error('Supabase no configurado');
	const key = `factura_seq_${year}`;
	const { data } = await sb.from('site_settings').select('value').eq('key', key).maybeSingle();
	const current = Number((data?.value as { seq?: unknown } | undefined)?.seq);
	const next = (Number.isFinite(current) ? current : 0) + 1;
	const { error } = await sb.from('site_settings').upsert(
		{
			key,
			value: { seq: next },
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'key' }
	);
	if (error) throw new Error(error.message);
	return next;
}

/** Siguiente número de factura TDO-YYYY-NNNNN (secuencia anual en site_settings). */
export async function nextFacturaNumero(): Promise<string> {
	const sb = getServiceSupabase();
	if (!sb) throw new Error('Supabase no configurado');
	const year = new Date().getFullYear();

	const rpc = await sb.rpc('next_factura_seq', { p_year: year });
	let seq: number;
	if (rpc.error) {
		console.warn('[site-settings] next_factura_seq RPC, usando fallback', rpc.error.message);
		seq = await bumpFacturaSeqFallback(year);
	} else {
		seq = Number(rpc.data);
	}
	if (!Number.isInteger(seq) || seq < 1) {
		throw new Error('No se pudo obtener el número de factura');
	}
	return `TDO-${year}-${String(seq).padStart(5, '0')}`;
}
