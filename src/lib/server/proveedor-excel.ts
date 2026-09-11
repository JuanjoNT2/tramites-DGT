import { formatRangeLabel } from '$lib/admin/dates';
import type { DateRange } from '$lib/admin/types';
import { toCsv } from '$lib/admin/export-csv';
import { toExcelXml } from '$lib/gestor/export';
import { loadProveedorTramites, proveedorExportRow } from '$lib/proveedor/data';

export type ProveedorReport = {
	filename: string;
	xml: string;
	csv: string;
	total: number;
	rangeLabel: string;
};

/**
 * Excel (y CSV) de distintivos del rango. Lo comparten la descarga, el envío
 * manual y el envío programado, así el fichero es idéntico venga de donde venga.
 */
export async function buildProveedorReport(range: DateRange): Promise<ProveedorReport> {
	const solicitudes = await loadProveedorTramites(range);
	const rows = solicitudes.map(proveedorExportRow);

	return {
		filename: `distintivos-${range.startDate}_${range.endDate}`,
		xml: toExcelXml(rows, 'Distintivos'),
		csv: toCsv(rows),
		total: solicitudes.length,
		rangeLabel: formatRangeLabel(range)
	};
}
