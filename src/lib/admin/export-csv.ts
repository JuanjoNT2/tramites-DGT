export function toCsv(rows: Record<string, unknown>[]): string {
	if (!rows.length) return '';
	const headers = Object.keys(rows[0]);
	const escape = (v: unknown) => {
		const s = v == null ? '' : String(v);
		if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
		return s;
	};
	const lines = [headers.join(',')];
	for (const row of rows) {
		lines.push(headers.map((h) => escape(row[h])).join(','));
	}
	return lines.join('\n') + '\n';
}
