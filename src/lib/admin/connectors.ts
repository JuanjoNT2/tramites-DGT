import { analyticsStoreMode } from '$lib/analytics/server/get-store';
import { env } from '$env/dynamic/private';
import type { ConnectorStatus } from './types';

export function getConnectorStatuses(): ConnectorStatus[] {
	const own = true; // siempre hay almacén (file o supabase)
	const mode = analyticsStoreMode();
	const gsc = Boolean(env.GSC_SITE_URL);
	const ads = Boolean(env.GOOGLE_ADS_DEVELOPER_TOKEN && env.GOOGLE_ADS_CUSTOMER_ID);
	const meta = Boolean(env.META_ADS_ACCESS_TOKEN && env.META_AD_ACCOUNT_ID);

	return [
		{
			id: 'ga4',
			label: 'Almacén propio (eventos)',
			description:
				'Carril A: eventos de comportamiento vía /api/collect → crudo → modelo. Fuente de verdad del panel.',
			connected: own,
			mode: mode === 'supabase' ? 'live' : 'demo',
			lastSync: new Date().toISOString(),
			detail:
				mode === 'supabase'
					? 'Supabase (analytics_events / analytics_daily)'
					: 'Ficheros locales .data/analytics (dev). Configura SUPABASE_* para producción.'
		},
		{
			id: 'search_console',
			label: 'Search Console',
			description: 'Carril B: agregados diarios externos (re-escribibles por fecha).',
			connected: gsc,
			mode: gsc ? 'live' : 'demo',
			lastSync: gsc ? new Date().toISOString() : null,
			detail: gsc
				? `Site ${env.GSC_SITE_URL} → analytics_external_daily`
				: 'Modo demo hasta sincronizar agregados GSC en el carril B.'
		},
		{
			id: 'google_ads',
			label: 'Google Ads',
			description: 'Carril B: gasto/clics/impresiones. Independiente del carril de eventos.',
			connected: ads,
			mode: ads ? 'live' : 'demo',
			lastSync: ads ? new Date().toISOString() : null,
			detail: ads
				? `Customer ${env.GOOGLE_ADS_CUSTOMER_ID}`
				: 'Modo demo. El histórico Ads vive en Google; aquí se guardan totales diarios propios.'
		},
		{
			id: 'meta_ads',
			label: 'Meta Ads',
			description: 'Carril B: campañas Meta. Fallo aislado respecto a eventos propios.',
			connected: meta,
			mode: meta ? 'live' : 'demo',
			lastSync: meta ? new Date().toISOString() : null,
			detail: meta
				? `Ad account ${env.META_AD_ACCOUNT_ID}`
				: 'Modo demo. Configura META_* y un job de sync al carril B.'
		}
	];
}
