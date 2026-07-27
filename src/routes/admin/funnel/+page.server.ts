import { resolveDateRange } from '$lib/admin/dates';
import { getAnalyticsStore } from '$lib/analytics/server/get-store';
import type { PageServerLoad } from './$types';

type FunnelStep = {
	key: string;
	label: string;
	count: number;
	dropOffPct: number | null;
};

type PageRow = {
	path: string;
	views: number;
	abandoned: number;
};

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url);
	const store = getAnalyticsStore();
	const raw = await store.queryRaw({ start: range.startDate, end: range.endDate });

	const byName = new Map<string, number>();
	const byStep = new Map<number, number>();
	const pageViews = new Map<string, number>();
	const pageAbandoned = new Map<string, number>();

	for (const ev of raw) {
		byName.set(ev.event, (byName.get(ev.event) || 0) + 1);

		if (ev.event === 'form_step_viewed') {
			const step = Number(ev.props?.step ?? 0);
			if (Number.isFinite(step) && step > 0) {
				byStep.set(step, (byStep.get(step) || 0) + 1);
			}
		}

		const path = String(ev.props?.page_path || '').trim() || '(sin path)';
		if (ev.event === 'page_view') {
			pageViews.set(path, (pageViews.get(path) || 0) + 1);
		}
		if (ev.event === 'form_abandoned') {
			pageAbandoned.set(path, (pageAbandoned.get(path) || 0) + 1);
		}
	}

	const counts = {
		form_started: byName.get('form_started') || 0,
		form_submitted: byName.get('form_submitted') || 0,
		payment_started: byName.get('payment_started') || 0,
		payment_completed: byName.get('payment_completed') || 0,
		form_abandoned: byName.get('form_abandoned') || 0
	};

	const orderedSteps = [...byStep.entries()].sort((a, b) => a[0] - b[0]);

	const funnelBase: { key: string; label: string; count: number }[] = [
		{ key: 'form_started', label: 'Formulario iniciado', count: counts.form_started },
		...orderedSteps.map(([step, count]) => ({
			key: `form_step_viewed_${step}`,
			label: `Paso ${step} visto`,
			count
		})),
		{ key: 'form_submitted', label: 'Formulario enviado', count: counts.form_submitted },
		{ key: 'payment_started', label: 'Pago iniciado', count: counts.payment_started },
		{ key: 'payment_completed', label: 'Pago completado', count: counts.payment_completed }
	];

	const funnel: FunnelStep[] = funnelBase.map((row, i) => {
		if (i === 0) return { ...row, dropOffPct: null };
		const prev = funnelBase[i - 1].count;
		const dropOffPct = prev > 0 ? Math.round(((prev - row.count) / prev) * 1000) / 10 : null;
		return { ...row, dropOffPct };
	});

	const paths = new Set([...pageViews.keys(), ...pageAbandoned.keys()]);
	const pages: PageRow[] = [...paths]
		.map((path) => ({
			path,
			views: pageViews.get(path) || 0,
			abandoned: pageAbandoned.get(path) || 0
		}))
		.sort((a, b) => b.abandoned + b.views - (a.abandoned + a.views))
		.slice(0, 40);

	return {
		range,
		funnel,
		counts,
		pages,
		totalEvents: raw.length
	};
};
