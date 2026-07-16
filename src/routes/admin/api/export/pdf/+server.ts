import { resolveDateRange } from '$lib/admin/dates';
import { buildReportPdf } from '$lib/admin/export-pdf';
import { getChannels, getEvents, getOverview } from '$lib/admin/metrics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const range = resolveDateRange(url);
	const [overview, channels, events] = await Promise.all([
		getOverview(range),
		getChannels(range),
		getEvents(range)
	]);

	const pdf = await buildReportPdf({ range, overview, channels, events });
	const filename = `informe-analitica-${range.startDate}_${range.endDate}.pdf`;

	return new Response(new Uint8Array(pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
