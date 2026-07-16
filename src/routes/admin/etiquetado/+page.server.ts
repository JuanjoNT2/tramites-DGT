import { listEventDeclarations } from '$lib/analytics';
import { resolveDateRange } from '$lib/admin/dates';
import { CtaIds, Events } from '$lib/analytics/events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const range = resolveDateRange(url);
	const q = (url.searchParams.get('q') || '').toLowerCase().trim();
	let pages = listEventDeclarations();
	if (q) {
		pages = pages.filter(
			(p) =>
				p.path.includes(q) ||
				p.label.toLowerCase().includes(q) ||
				(p.tramite || '').includes(q) ||
				p.page_type.includes(q)
		);
	}
	return {
		range,
		pages,
		q,
		events: Events,
		ctaIds: CtaIds
	};
};
