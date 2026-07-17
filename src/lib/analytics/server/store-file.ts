import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
	AnalyticsStore,
	DailyAggregate,
	ExternalDailyRow,
	StoredEvent
} from './store';

const ROOT = path.join(process.cwd(), '.data', 'analytics');
const RAW = path.join(ROOT, 'events.jsonl');
const DAILY = path.join(ROOT, 'daily.json');
const EXTERNAL = path.join(ROOT, 'external.json');

async function ensure() {
	await mkdir(ROOT, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
	try {
		const raw = await readFile(file, 'utf8');
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function createFileStore(): AnalyticsStore {
	return {
		async appendRaw(event) {
			await ensure();
			await writeFile(RAW, JSON.stringify(event) + '\n', { flag: 'a' });
		},

		async queryRaw({ start, end, limit = 50000 }) {
			await ensure();
			let text = '';
			try {
				text = await readFile(RAW, 'utf8');
			} catch {
				return [];
			}
			const startMs = new Date(start + 'T00:00:00.000Z').getTime();
			const endMs = new Date(end + 'T23:59:59.999Z').getTime();
			const out: StoredEvent[] = [];
			for (const line of text.split('\n')) {
				if (!line.trim()) continue;
				try {
					const ev = JSON.parse(line) as StoredEvent;
					const t = new Date(ev.ts || ev.received_at).getTime();
					if (t >= startMs && t <= endMs) out.push(ev);
					if (out.length >= limit) break;
				} catch {
					/* skip bad line */
				}
			}
			return out;
		},

		async upsertDaily(rows) {
			await ensure();
			const current = await readJson<DailyAggregate[]>(DAILY, []);
			const map = new Map(
				current.map((r) => [`${r.day}|${r.channel}|${r.page_type}|${r.event_name}`, r])
			);
			for (const row of rows) {
				const key = `${row.day}|${row.channel}|${row.page_type}|${row.event_name}`;
				map.set(key, row);
			}
			await writeFile(DAILY, JSON.stringify([...map.values()], null, 2));
		},

		async queryDaily({ start, end }) {
			const all = await readJson<DailyAggregate[]>(DAILY, []);
			return all.filter((r) => r.day >= start && r.day <= end);
		},

		async upsertExternal(rows) {
			await ensure();
			const current = await readJson<ExternalDailyRow[]>(EXTERNAL, []);
			const map = new Map(
				current.map((r) => [`${r.source}|${r.day}|${r.channel}`, r])
			);
			for (const row of rows) {
				map.set(`${row.source}|${row.day}|${row.channel}`, row);
			}
			await writeFile(EXTERNAL, JSON.stringify([...map.values()], null, 2));
		},

		async queryExternal({ source, start, end }) {
			const all = await readJson<ExternalDailyRow[]>(EXTERNAL, []);
			return all.filter(
				(r) =>
					r.day >= start &&
					r.day <= end &&
					(!source || r.source === source)
			);
		}
	};
}
