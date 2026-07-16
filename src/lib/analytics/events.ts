/**
 * Catálogo canónico de nombres de evento.
 * Fuente de verdad para PostHog, dataLayer/GTM y el equipo SEO.
 * No renombrar sin actualizar el mapa por URL y GTM.
 */
export const Events = {
	/** Vista de página (SPA + carga inicial) */
	PAGE_VIEW: 'page_view',
	/** Clic en CTA / enlace medido */
	CTA_CLICK: 'cta_click',
	/** Embudo formularios */
	FORM_STARTED: 'form_started',
	FORM_STEP_VIEWED: 'form_step_viewed',
	FORM_STEP_COMPLETED: 'form_step_completed',
	FORM_ABANDONED: 'form_abandoned',
	FORM_SUBMITTED: 'form_submitted',
	PAYMENT_STARTED: 'payment_started'
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

/** IDs estables de CTA (cta_id). Usar siempre estos valores en trackClick. */
export const CtaIds = {
	NAV_LOGIN: 'nav_iniciar_sesion',
	NAV_TRAMITE: 'nav_tramite',
	NAV_CALCULADOR: 'nav_calculador',
	NAV_LINK: 'nav_link',
	HOME_TRAMITAR: 'home_tramitar',
	HOME_VER_TRAMITE: 'home_ver_tramite',
	LANDING_SOLICITAR: 'landing_solicitar_ahora',
	LANDING_CALCULAR: 'landing_calcular_precio',
	BLOG_RELATED: 'blog_noticia_relacionada',
	BLOG_TRAMITE: 'blog_tramite_cta',
	FOOTER_LINK: 'footer_link',
	NOTICIAS_POST: 'noticias_abrir_post'
} as const;

export type CtaId = (typeof CtaIds)[keyof typeof CtaIds];
