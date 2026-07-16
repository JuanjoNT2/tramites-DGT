import { Events } from './events';
import { track } from './track';

export type FunnelProps = {
	tramite: string;
	step?: number;
	step_name?: string;
	total_steps?: number;
	[key: string]: unknown;
};

/** Eventos de embudo de formulario (declarados en URLs /tramitar/*). */
export const funnel = {
	started: (p: FunnelProps) => track(Events.FORM_STARTED, p),
	stepViewed: (p: FunnelProps) => track(Events.FORM_STEP_VIEWED, p),
	stepCompleted: (p: FunnelProps) => track(Events.FORM_STEP_COMPLETED, p),
	abandoned: (p: FunnelProps) => track(Events.FORM_ABANDONED, p),
	submitted: (p: FunnelProps) => track(Events.FORM_SUBMITTED, p),
	paymentStarted: (p: FunnelProps) => track(Events.PAYMENT_STARTED, p)
};
