import { Events } from '$lib/analytics/events';

export type DataLayerEventContract = {
	event: string;
	description: string;
	requiredParams: string[];
	optionalParams: string[];
	isConversion: boolean;
	gtmTrigger: string;
	example: Record<string, unknown>;
};

export const DATALAYER_CONTRACT: DataLayerEventContract[] = [
	{
		event: Events.PAGE_VIEW,
		description: 'Vista de página (SPA). Sustituye el page_view automático de GA4 si se configura en GTM.',
		requiredParams: ['page_path', 'page_type', 'content_group', 'page_label'],
		optionalParams: ['tramite'],
		isConversion: false,
		gtmTrigger: 'Custom Event = page_view',
		example: {
			event: 'page_view',
			page_path: '/transferencia-vehiculos',
			page_type: 'landing_servicio',
			content_group: 'servicios',
			page_label: 'Transferencia de vehículos',
			tramite: 'transferencia'
		}
	},
	{
		event: Events.CTA_CLICK,
		description: 'Clic en CTA medido (nav, landings, blog).',
		requiredParams: ['cta_id', 'page_path', 'page_type'],
		optionalParams: ['tramite', 'destination', 'post_slug'],
		isConversion: false,
		gtmTrigger: 'Custom Event = cta_click',
		example: {
			event: 'cta_click',
			cta_id: 'landing_solicitar_ahora',
			page_path: '/transferencia-vehiculos',
			page_type: 'landing_servicio',
			content_group: 'servicios',
			tramite: 'transferencia',
			destination: '/tramitar/transferencia'
		}
	},
	{
		event: Events.FORM_STARTED,
		description: 'Inicio de embudo en /tramitar/*.',
		requiredParams: ['tramite', 'total_steps'],
		optionalParams: ['page_path'],
		isConversion: false,
		gtmTrigger: 'Custom Event = form_started',
		example: { event: 'form_started', tramite: 'transferencia', total_steps: 9 }
	},
	{
		event: Events.FORM_STEP_VIEWED,
		description: 'Paso del formulario visto.',
		requiredParams: ['tramite', 'step', 'total_steps'],
		optionalParams: ['step_name'],
		isConversion: false,
		gtmTrigger: 'Custom Event = form_step_viewed',
		example: {
			event: 'form_step_viewed',
			tramite: 'transferencia',
			step: 2,
			step_name: 'datos',
			total_steps: 9
		}
	},
	{
		event: Events.FORM_STEP_COMPLETED,
		description: 'Paso del formulario completado.',
		requiredParams: ['tramite', 'step', 'total_steps'],
		optionalParams: ['step_name'],
		isConversion: false,
		gtmTrigger: 'Custom Event = form_step_completed',
		example: {
			event: 'form_step_completed',
			tramite: 'etiqueta',
			step: 1,
			step_name: 'matricula',
			total_steps: 5
		}
	},
	{
		event: Events.FORM_ABANDONED,
		description: 'Abandono del embudo (salida de página).',
		requiredParams: ['tramite', 'step', 'total_steps'],
		optionalParams: [],
		isConversion: false,
		gtmTrigger: 'Custom Event = form_abandoned',
		example: { event: 'form_abandoned', tramite: 'informe', step: 2, total_steps: 4 }
	},
	{
		event: Events.FORM_SUBMITTED,
		description: 'Solicitud enviada. Marcar como conversión en GA4.',
		requiredParams: ['tramite'],
		optionalParams: ['step', 'total_steps', 'order_id'],
		isConversion: true,
		gtmTrigger: 'Custom Event = form_submitted → Conversion',
		example: {
			event: 'form_submitted',
			tramite: 'transferencia',
			step: 9,
			total_steps: 9
		}
	},
	{
		event: Events.PAYMENT_STARTED,
		description: 'Inicio de pago. Marcar como conversión en GA4.',
		requiredParams: ['tramite'],
		optionalParams: ['step', 'total_steps'],
		isConversion: true,
		gtmTrigger: 'Custom Event = payment_started → Conversion',
		example: {
			event: 'payment_started',
			tramite: 'duplicado',
			step: 5,
			total_steps: 5
		}
	}
];
