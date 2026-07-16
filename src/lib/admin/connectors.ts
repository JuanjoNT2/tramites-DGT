import { env } from '$env/dynamic/private';
import { ga4Configured } from './metrics';
import type { ConnectorStatus } from './types';

export function getConnectorStatuses(): ConnectorStatus[] {
	const ga4Live = ga4Configured();
	const gsc =
		Boolean(env.GSC_SITE_URL && (env.GA4_ACCESS_TOKEN || env.GOOGLE_SERVICE_ACCOUNT_EMAIL));
	const ads = Boolean(
		env.GOOGLE_ADS_DEVELOPER_TOKEN && env.GOOGLE_ADS_CUSTOMER_ID && env.GA4_ACCESS_TOKEN
	);
	const meta = Boolean(env.META_ADS_ACCESS_TOKEN && env.META_AD_ACCOUNT_ID);

	return [
		{
			id: 'ga4',
			label: 'Google Analytics 4',
			description: 'Métricas web, canales, eventos y conversiones (GA4 Data API).',
			connected: ga4Live,
			mode: ga4Live ? 'live' : 'demo',
			lastSync: ga4Live ? new Date().toISOString() : null,
			detail: ga4Live
				? `Property ${env.GA4_PROPERTY_ID}`
				: 'Modo demo. Configura GA4_PROPERTY_ID + GA4_ACCESS_TOKEN.'
		},
		{
			id: 'search_console',
			label: 'Search Console',
			description: 'Clicks, impresiones, CTR y posición por consulta/página.',
			connected: gsc,
			mode: gsc ? 'live' : 'demo',
			lastSync: gsc ? new Date().toISOString() : null,
			detail: gsc
				? `Site ${env.GSC_SITE_URL}`
				: 'Modo demo. Configura GSC_SITE_URL + token OAuth.'
		},
		{
			id: 'google_ads',
			label: 'Google Ads',
			description: 'Gasto, clics e impresiones de campañas (histórico de la cuenta Ads).',
			connected: ads,
			mode: ads ? 'live' : 'demo',
			lastSync: ads ? new Date().toISOString() : null,
			detail: ads
				? `Customer ${env.GOOGLE_ADS_CUSTOMER_ID}`
				: 'Modo demo. Configura GOOGLE_ADS_* + token. El link Ads↔GA4 en Google es opcional y mejora la atribución.'
		},
		{
			id: 'meta_ads',
			label: 'Meta Ads',
			description: 'Campañas Facebook/Instagram: gasto, impresiones y clics.',
			connected: meta,
			mode: meta ? 'live' : 'demo',
			lastSync: meta ? new Date().toISOString() : null,
			detail: meta
				? `Ad account ${env.META_AD_ACCOUNT_ID}`
				: 'Modo demo. Configura META_ADS_ACCESS_TOKEN + META_AD_ACCOUNT_ID.'
		}
	];
}
