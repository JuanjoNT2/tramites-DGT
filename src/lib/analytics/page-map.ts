import { CtaIds, Events, type CtaId, type EventName } from './events';

export type PageType =
	| 'home'
	| 'landing_servicio'
	| 'funnel_tramite'
	| 'funnel_pago'
	| 'calculadora'
	| 'noticias_listado'
	| 'noticias_pagina'
	| 'blog_post'
	| 'institucional'
	| 'legal'
	| 'contacto'
	| 'faq'
	| 'other';

export type ContentGroup =
	| 'home'
	| 'servicios'
	| 'conversion'
	| 'herramientas'
	| 'contenido'
	| 'institucional'
	| 'legal'
	| 'other';

export type PageTag = {
	/** Path canónico sin query (con leading slash, sin trailing slash salvo /) */
	path: string;
	page_type: PageType;
	content_group: ContentGroup;
	/** Trámite asociado si aplica */
	tramite?: string;
	/** Título legible para reporting */
	label: string;
	/** Eventos que esta URL puede disparar (declaración SEO) */
	events: EventName[];
	/** CTAs esperados en esta URL */
	ctas: CtaId[];
};

function tag(
	path: string,
	page_type: PageType,
	content_group: ContentGroup,
	label: string,
	opts: {
		tramite?: string;
		events?: EventName[];
		ctas?: CtaId[];
	} = {}
): PageTag {
	const baseEvents: EventName[] = [Events.PAGE_VIEW, Events.CTA_CLICK];
	return {
		path,
		page_type,
		content_group,
		label,
		tramite: opts.tramite,
		events: opts.events ?? baseEvents,
		ctas: opts.ctas ?? []
	};
}

const funnelEvents: EventName[] = [
	Events.PAGE_VIEW,
	Events.CTA_CLICK,
	Events.FORM_STARTED,
	Events.FORM_STEP_VIEWED,
	Events.FORM_STEP_COMPLETED,
	Events.FORM_ABANDONED,
	Events.FORM_SUBMITTED,
	Events.PAYMENT_STARTED
];

/** Declaración estática de URLs conocidas (landings, funnels, institucionales). */
export const PAGE_TAGS: PageTag[] = [
	tag('/', 'home', 'home', 'Home', {
		ctas: [CtaIds.HOME_TRAMITAR, CtaIds.HOME_VER_TRAMITE, CtaIds.NAV_LOGIN]
	}),

	// Landings de servicio (SEO)
	tag('/transferencia-vehiculos', 'landing_servicio', 'servicios', 'Transferencia de vehículos', {
		tramite: 'transferencia',
		ctas: [CtaIds.LANDING_SOLICITAR, CtaIds.LANDING_CALCULAR]
	}),
	tag('/distintivo-medioambiental', 'landing_servicio', 'servicios', 'Etiqueta medioambiental', {
		tramite: 'etiqueta',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),
	tag('/etiqueta-vmp', 'landing_servicio', 'servicios', 'Etiqueta VMP (patinete)', {
		tramite: 'etiqueta-vmp',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),
	tag('/informe-trafico', 'landing_servicio', 'servicios', 'Informe de vehículo DGT', {
		tramite: 'informe',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),
	tag(
		'/duplicado-permiso-circulacion',
		'landing_servicio',
		'servicios',
		'Duplicado permiso de circulación',
		{ tramite: 'duplicado', ctas: [CtaIds.LANDING_SOLICITAR] }
	),
	tag(
		'/cancelacion-de-reserva-de-dominio',
		'landing_servicio',
		'servicios',
		'Cancelación reserva de dominio',
		{ tramite: 'cancelacion', ctas: [CtaIds.LANDING_SOLICITAR] }
	),
	tag('/notificacion-de-venta', 'landing_servicio', 'servicios', 'Notificación de venta', {
		tramite: 'notificacion-venta',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),
	tag('/nota-simple-vehiculo', 'landing_servicio', 'servicios', 'Nota simple de vehículo', {
		tramite: 'nota-simple',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),
	tag('/baja-temporal-vehiculo', 'landing_servicio', 'servicios', 'Baja temporal de vehículo', {
		tramite: 'baja-temporal',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),

	// Aliases (mismas métricas; canónica distinta en SEO)
	tag('/etiqueta-medioambiental', 'landing_servicio', 'servicios', 'Etiqueta (alias)', {
		tramite: 'etiqueta',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),
	tag('/informe-vehiculo-dgt', 'landing_servicio', 'servicios', 'Informe (alias)', {
		tramite: 'informe',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),
	tag('/duplicado-carnet', 'landing_servicio', 'servicios', 'Duplicado (alias)', {
		tramite: 'duplicado',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),
	tag(
		'/duplicado-de-carnet-de-conducir',
		'landing_servicio',
		'servicios',
		'Duplicado (alias carnet)',
		{ tramite: 'duplicado', ctas: [CtaIds.LANDING_SOLICITAR] }
	),
	tag('/cancelacion-reserva-dominio', 'landing_servicio', 'servicios', 'Cancelación (alias)', {
		tramite: 'cancelacion',
		ctas: [CtaIds.LANDING_SOLICITAR]
	}),

	// Funnels / conversión
	tag('/tramitar/transferencia', 'funnel_tramite', 'conversion', 'Funnel transferencia', {
		tramite: 'transferencia',
		events: funnelEvents
	}),
	tag('/tramitar/etiqueta', 'funnel_tramite', 'conversion', 'Funnel etiqueta', {
		tramite: 'etiqueta',
		events: funnelEvents
	}),
	tag('/tramitar/etiqueta-vmp', 'funnel_tramite', 'conversion', 'Funnel etiqueta VMP', {
		tramite: 'etiqueta-vmp',
		events: funnelEvents
	}),
	tag('/tramitar/informe-dgt', 'funnel_tramite', 'conversion', 'Funnel informe', {
		tramite: 'informe',
		events: funnelEvents
	}),
	tag('/tramitar/duplicado-carnet', 'funnel_tramite', 'conversion', 'Funnel duplicado', {
		tramite: 'duplicado',
		events: funnelEvents
	}),
	tag('/tramitar/cancelacion-reserva', 'funnel_tramite', 'conversion', 'Funnel cancelación', {
		tramite: 'cancelacion',
		events: funnelEvents
	}),
	tag('/tramitar/notificacion-venta', 'funnel_tramite', 'conversion', 'Funnel notificación venta', {
		tramite: 'notificacion-venta',
		events: funnelEvents
	}),
	tag('/tramitar/nota-simple', 'funnel_tramite', 'conversion', 'Funnel nota simple', {
		tramite: 'nota-simple',
		events: funnelEvents
	}),
	tag('/tramitar/baja-temporal', 'funnel_tramite', 'conversion', 'Funnel baja temporal', {
		tramite: 'baja-temporal',
		events: funnelEvents
	}),
	tag('/pago', 'funnel_pago', 'conversion', 'Pasarela de pago', {
		events: [
			Events.PAGE_VIEW,
			Events.PAYMENT_STARTED,
			Events.PAYMENT_COMPLETED,
			Events.FORM_ABANDONED
		]
	}),

	// Calculadoras
	tag('/calcular/precio-transferencia', 'calculadora', 'herramientas', 'Calc. precio transferencia', {
		tramite: 'transferencia'
	}),
	tag('/calcular/valor-venal', 'calculadora', 'herramientas', 'Calc. valor venal'),
	tag('/calcular/potencia-fiscal', 'calculadora', 'herramientas', 'Calc. potencia fiscal'),
	tag('/calcular/itp', 'calculadora', 'herramientas', 'Calc. ITP', { tramite: 'transferencia' }),

	// Contenido
	tag('/noticias', 'noticias_listado', 'contenido', 'Noticias', {
		ctas: [CtaIds.NOTICIAS_POST]
	}),
	tag('/quienes-somos', 'institucional', 'institucional', 'Quiénes somos'),
	tag('/preguntas-frecuentes', 'faq', 'institucional', 'FAQs'),
	tag('/contacto', 'contacto', 'institucional', 'Contacto'),

	// Legal
	tag('/aviso-legal', 'legal', 'legal', 'Aviso legal'),
	tag('/politica-de-privacidad', 'legal', 'legal', 'Política de privacidad'),
	tag('/politica-de-cookies', 'legal', 'legal', 'Política de cookies'),
	tag('/politica-de-devoluciones', 'legal', 'legal', 'Política de devoluciones'),
	tag('/legal/aviso-legal', 'legal', 'legal', 'Aviso legal (alias)'),
	tag('/legal/privacidad', 'legal', 'legal', 'Privacidad (alias)'),
	tag('/legal/cookies', 'legal', 'legal', 'Cookies (alias)')
];

const byPath = new Map(PAGE_TAGS.map((t) => [t.path, t]));

/** Normaliza pathname de SvelteKit a clave del mapa. */
export function normalizePath(pathname: string): string {
	if (!pathname || pathname === '/') return '/';
	const clean = pathname.split('?')[0].split('#')[0];
	const trimmed = clean.endsWith('/') && clean.length > 1 ? clean.slice(0, -1) : clean;
	return trimmed || '/';
}

/**
 * Resuelve la declaración de taggeado para una URL.
 * Blog posts y /noticias/page/N caen en reglas dinámicas.
 */
export function resolvePageTag(pathname: string): PageTag {
	const path = normalizePath(pathname);

	const exact = byPath.get(path);
	if (exact) return exact;

	// Pasarela de pago: /pago/[id]
	if (path === '/pago' || path.startsWith('/pago/')) {
		return tag(path, 'funnel_pago', 'conversion', 'Pasarela de pago', {
			events: [
				Events.PAGE_VIEW,
				Events.PAYMENT_STARTED,
				Events.PAYMENT_COMPLETED,
				Events.FORM_ABANDONED
			]
		});
	}

	const noticiasPage = path.match(/^\/noticias\/page\/(\d+)$/);
	if (noticiasPage) {
		return tag(path, 'noticias_pagina', 'contenido', `Noticias página ${noticiasPage[1]}`, {
			ctas: [CtaIds.NOTICIAS_POST]
		});
	}

	// Posts del blog: /slug-del-articulo (una sola segmento, no rutas reservadas)
	const segments = path.split('/').filter(Boolean);
	if (segments.length === 1 && !byPath.has(path)) {
		return {
			path,
			page_type: 'blog_post',
			content_group: 'contenido',
			label: `Blog: ${segments[0]}`,
			events: [Events.PAGE_VIEW, Events.CTA_CLICK],
			ctas: [CtaIds.BLOG_RELATED, CtaIds.BLOG_TRAMITE]
		};
	}

	return {
		path,
		page_type: 'other',
		content_group: 'other',
		label: path,
		events: [Events.PAGE_VIEW, Events.CTA_CLICK],
		ctas: []
	};
}

/** Props estándar que acompañan a casi todos los eventos. */
export function pageContext(pathname: string): Record<string, unknown> {
	const tag = resolvePageTag(pathname);
	return {
		page_path: tag.path,
		page_type: tag.page_type,
		content_group: tag.content_group,
		page_label: tag.label,
		...(tag.tramite ? { tramite: tag.tramite } : {})
	};
}

/** Export plano para el equipo SEO / GTM (inventario). */
export function listEventDeclarations(): Array<{
	path: string;
	page_type: PageType;
	content_group: ContentGroup;
	tramite: string | null;
	label: string;
	events: EventName[];
	ctas: CtaId[];
}> {
	return PAGE_TAGS.map((t) => ({
		path: t.path,
		page_type: t.page_type,
		content_group: t.content_group,
		tramite: t.tramite ?? null,
		label: t.label,
		events: t.events,
		ctas: t.ctas
	}));
}
