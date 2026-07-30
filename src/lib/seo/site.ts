import { env } from '$env/dynamic/public';

/** Dominio canónico de producción (nunca *.vercel.app). Configurable vía PUBLIC_SITE_ORIGIN. */
export const SITE_ORIGIN = (env.PUBLIC_SITE_ORIGIN || 'https://tramitesdgtonline.com').replace(
	/\/$/,
	''
);
export const SITE_NAME = 'Trámites DGT Online';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/hero.webp`;
export const DEFAULT_DESCRIPTION =
	'Realiza trámites de vehículo 100% online: transferencias, etiqueta medioambiental, informe DGT y más. Sin cita previa, sin esperas.';

/** Canonical absoluto con trailing slash (excepto origin raíz con /). */
export function canonical(path = '/'): string {
	const clean = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}/`;
	return `${SITE_ORIGIN}${clean === '//' ? '/' : clean}`;
}

export function pageTitle(topic: string): string {
	return `${topic} | ${SITE_NAME}`;
}

export type StaticSeoPage = {
	path: string;
	title: string;
	description: string;
	changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	priority?: number;
};

/** Páginas estáticas indexables (sin aliases redirigidos, sin /admin). */
export const STATIC_SEO_PAGES: StaticSeoPage[] = [
	{
		path: '/',
		title: `${SITE_NAME} | Trámites de Vehículo en Pocos Minutos`,
		description: DEFAULT_DESCRIPTION,
		changefreq: 'weekly',
		priority: 1
	},
	{
		path: '/transferencia-vehiculos',
		title: pageTitle('Transferencia de Vehículos'),
		description:
			'Cambia la titularidad de tu vehículo 100% online, sin desplazamientos. Servicio disponible los 365 días del año.',
		priority: 0.9
	},
	{
		path: '/distintivo-medioambiental',
		title: pageTitle('Etiqueta Medioambiental'),
		description:
			'Solicita la etiqueta medioambiental oficial de la DGT para tu vehículo y recíbela en casa sin citas ni esperas.',
		priority: 0.9
	},
	{
		path: '/etiqueta-vmp',
		title: pageTitle('Etiqueta VMP (patinete)'),
		description:
			'Inscribe tu patinete eléctrico (VMP) y obtén la etiqueta identificativa DGT. Gestión online y envío a domicilio.',
		priority: 0.9
	},
	{
		path: '/informe-trafico',
		title: pageTitle('Informe de Vehículo DGT'),
		description:
			'Consulta el informe de tráfico oficial de la DGT: historial, cargas, kilometraje y datos técnicos del vehículo.',
		priority: 0.9
	},
	{
		path: '/duplicado-de-carnet-de-conducir',
		title: pageTitle('Duplicado permiso de circulación'),
		description:
			'Solicita el duplicado del permiso de circulación de tu vehículo online, de forma rápida y segura.',
		priority: 0.9
	},
	{
		path: '/cancelacion-de-reserva-de-dominio',
		title: pageTitle('Cancelación Reserva de Dominio'),
		description:
			'Cancela la reserva de dominio de tu vehículo ante la entidad de crédito con gestión online guiada.',
		priority: 0.9
	},
	{
		path: '/notificacion-de-venta',
		title: pageTitle('Notificación de venta'),
		description:
			'Notifica la venta de tu vehículo ante la DGT 100% online. Evita responsabilidades tras la compraventa.',
		priority: 0.9
	},
	{
		path: '/nota-simple-vehiculo',
		title: pageTitle('Nota simple de vehículo'),
		description:
			'Solicita la nota simple de un vehículo online y conoce su situación registral de forma rápida.',
		priority: 0.9
	},
	{
		path: '/baja-temporal-vehiculo',
		title: pageTitle('Baja temporal de vehículo'),
		description:
			'Tramita la baja temporal de tu vehículo ante la DGT sin citas ni desplazamientos.',
		priority: 0.9
	},
	{
		path: '/noticias',
		title: pageTitle('Noticias'),
		description:
			'Noticias y guías sobre trámites DGT, transferencia de vehículos, normativa y consejos para conductores.',
		changefreq: 'daily',
		priority: 0.8
	},
	{
		path: '/preguntas-frecuentes',
		title: pageTitle('Preguntas frecuentes'),
		description:
			'Resolvemos las dudas más habituales sobre transferencias, documentos, plazos, ITP y trámites DGT online.',
		priority: 0.7
	},
	{
		path: '/quienes-somos',
		title: pageTitle('Quiénes somos'),
		description:
			'Conoce Trámites DGT Online: plataforma para transferencias, informes, etiquetas y más trámites de vehículo 100% online.',
		priority: 0.6
	},
	{
		path: '/contacto',
		title: pageTitle('Contacto'),
		description:
			'Contacta con Trámites DGT Online. Te ayudamos con transferencias, informes y otros trámites de vehículo.',
		priority: 0.6
	},
	{
		path: '/calcular/precio-transferencia',
		title: pageTitle('Calcular precio de transferencia'),
		description:
			'Calcula el precio de una transferencia de vehículo: ITP, tasas DGT y gestión online en pocos pasos.',
		priority: 0.7
	},
	{
		path: '/calcular/valor-venal',
		title: pageTitle('Calcular valor venal'),
		description:
			'Calcula el valor venal de tu vehículo según Hacienda para transferencias e impuestos de transmisiones.',
		priority: 0.7
	},
	{
		path: '/calcular/potencia-fiscal',
		title: pageTitle('Calcular potencia fiscal'),
		description:
			'Calcula la potencia fiscal de un vehículo a partir de sus datos técnicos de forma rápida y online.',
		priority: 0.6
	},
	{
		path: '/calcular/itp',
		title: pageTitle('Calculadora de ITP'),
		description:
			'Estima el Impuesto de Transmisiones Patrimoniales (ITP) al comprar un vehículo de segunda mano.',
		priority: 0.7
	},
	{
		path: '/aviso-legal',
		title: pageTitle('Aviso legal'),
		description: 'Aviso legal de Trámites DGT Online: información societaria y condiciones de uso del sitio.',
		changefreq: 'yearly',
		priority: 0.3
	},
	{
		path: '/politica-de-privacidad',
		title: pageTitle('Política de privacidad'),
		description:
			'Política de privacidad de Trámites DGT Online: tratamiento de datos personales y derechos del usuario.',
		changefreq: 'yearly',
		priority: 0.3
	},
	{
		path: '/politica-de-cookies',
		title: pageTitle('Política de cookies'),
		description:
			'Información sobre el uso de cookies en Trámites DGT Online y cómo gestionar tus preferencias.',
		changefreq: 'yearly',
		priority: 0.3
	},
	{
		path: '/politica-de-devoluciones',
		title: pageTitle('Política de devoluciones'),
		description:
			'Condiciones de devolución y reembolso de los servicios de tramitación online de Trámites DGT Online.',
		changefreq: 'yearly',
		priority: 0.3
	},
	{
		path: '/tramitar/transferencia',
		title: pageTitle('Transferencia de vehículos online'),
		description:
			'Inicia el trámite de transferencia de vehículo paso a paso: presupuesto, datos, identidad y pago online.',
		priority: 0.8
	},
	{
		path: '/tramitar/etiqueta',
		title: pageTitle('Solicitar etiqueta medioambiental'),
		description:
			'Solicita la etiqueta medioambiental DGT online. Formulario guiado y envío a domicilio.',
		priority: 0.7
	},
	{
		path: '/tramitar/etiqueta-vmp',
		title: pageTitle('Solicitar etiqueta VMP (patinete)'),
		description:
			'Formulario guiado para inscripción y etiqueta identificativa de tu patinete eléctrico (VMP).',
		priority: 0.7
	},
	{
		path: '/tramitar/informe-dgt',
		title: pageTitle('Solicitar informe de vehículo DGT'),
		description:
			'Pide el informe oficial de tráfico DGT online y conoce el historial completo del vehículo.',
		priority: 0.7
	},
	{
		path: '/tramitar/duplicado-carnet',
		title: pageTitle('Solicitar duplicado permiso circulación'),
		description:
			'Tramita el duplicado del permiso de circulación de tu vehículo online, sin citas ni desplazamientos.',
		priority: 0.7
	},
	{
		path: '/tramitar/cancelacion-reserva',
		title: pageTitle('Cancelar reserva de dominio'),
		description:
			'Gestiona la cancelación de reserva de dominio de tu vehículo de forma online y guiada.',
		priority: 0.7
	},
	{
		path: '/tramitar/notificacion-venta',
		title: pageTitle('Tramitar notificación de venta'),
		description:
			'Formulario guiado para notificar la venta de tu vehículo ante la DGT de forma online.',
		priority: 0.7
	},
	{
		path: '/tramitar/nota-simple',
		title: pageTitle('Solicitar nota simple de vehículo'),
		description: 'Pide la nota simple de un vehículo online con un formulario guiado paso a paso.',
		priority: 0.7
	},
	{
		path: '/tramitar/baja-temporal',
		title: pageTitle('Tramitar baja temporal de vehículo'),
		description:
			'Inicia la baja temporal de tu vehículo ante la DGT con un formulario online guiado.',
		priority: 0.7
	}
];

export function getStaticSeo(path: string): StaticSeoPage | undefined {
	const normalized = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`;
	return STATIC_SEO_PAGES.find((p) => p.path === normalized);
}

export function organizationJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		logo: `${SITE_ORIGIN}/favicon.png`,
		email: 'info@tramitesdgtonline.com',
		contactPoint: {
			'@type': 'ContactPoint',
			email: 'info@tramitesdgtonline.com',
			contactType: 'customer service',
			availableLanguage: 'Spanish'
		}
	};
}

export function websiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		inLanguage: 'es-ES'
	};
}

export function articleJsonLd(input: {
	title: string;
	description: string;
	path: string;
	image?: string;
	datePublished?: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: input.title,
		description: input.description,
		image: input.image || DEFAULT_OG_IMAGE,
		datePublished: input.datePublished || undefined,
		mainEntityOfPage: canonical(input.path),
		author: { '@type': 'Organization', name: SITE_NAME },
		publisher: {
			'@type': 'Organization',
			name: SITE_NAME,
			logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/favicon.png` }
		}
	};
}

export function faqPageJsonLd(faqs: { q: string; a: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a }
		}))
	};
}

export function serviceJsonLd(input: {
	name: string;
	description: string;
	path: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Service',
		name: input.name,
		description: input.description,
		provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_ORIGIN },
		areaServed: 'ES',
		url: canonical(input.path)
	};
}
