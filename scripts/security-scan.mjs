#!/usr/bin/env node
/**
 * Escáner anti-hardcoded (secretos / credenciales).
 * Uso: npm run security:scan
 * Exit 1 si hay hallazgos CRITICAL.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'scripts', 'static'];
const SKIP_DIRS = new Set([
	'node_modules',
	'.git',
	'.svelte-kit',
	'.vercel',
	'.data',
	'dist',
	'build'
]);
const SKIP_FILES = new Set(['posts.json', 'package-lock.json']);
const TEXT_EXT = new Set([
	'.ts',
	'.js',
	'.mjs',
	'.cjs',
	'.svelte',
	'.json',
	'.md',
	'.txt',
	'.html',
	'.css',
	'.env',
	'.example',
	'.yml',
	'.yaml',
	'.toml'
]);

/** @typedef {{ id: string, severity: 'CRITICAL'|'HIGH'|'MEDIUM', re: RegExp, tip: string }} Rule */

/** @type {Rule[]} */
const RULES = [
	{
		id: 'aws-access-key',
		severity: 'CRITICAL',
		re: /\bAKIA[0-9A-Z]{16}\b/,
		tip: 'Posible AWS Access Key. Usa variables de entorno.'
	},
	{
		id: 'private-key-block',
		severity: 'CRITICAL',
		re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
		tip: 'Bloque de clave privada en el repo.'
	},
	{
		id: 'generic-api-key-assign',
		severity: 'CRITICAL',
		re: /(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*['"`][^'"`]{12,}['"`]/i,
		tip: 'Asignación literal de API key/token. Muévelo a env.'
	},
	{
		id: 'bearer-literal',
		severity: 'CRITICAL',
		re: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/,
		tip: 'Bearer token literal.'
	},
	{
		id: 'supabase-service-role-jwt',
		severity: 'CRITICAL',
		re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
		tip: 'Posible JWT (p. ej. service_role). Nunca en código.'
	},
	{
		id: 'hardcoded-admin-password-default',
		severity: 'HIGH',
		re: /ADMIN_PASSWORD\s*\|\|\s*['"`]admin['"`]|return\s+['"`]admin['"`]\s*;/,
		tip: 'Password admin por defecto hardcodeado. Solo permitido en dev con fail-closed en prod.'
	},
	{
		id: 'hardcoded-dev-session-secret',
		severity: 'HIGH',
		re: /['"`]dev-admin-secret-change-me['"`]/,
		tip: 'Secret de sesión de desarrollo hardcodeado.'
	},
	{
		id: 'password-literal-assign',
		severity: 'HIGH',
		re: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`]{4,}['"`]/i,
		tip: 'Password literal en código.'
	},
	{
		id: 'connection-string-secrets',
		severity: 'CRITICAL',
		re: /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^:\s]+:[^@\s]+@/i,
		tip: 'Connection string con credenciales embebidas.'
	},
	{
		id: 'slack-webhook',
		severity: 'CRITICAL',
		re: /hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+/,
		tip: 'Slack webhook URL.'
	}
];

/** Allowlist: path relativo + id de regla (o '*'). */
const ALLOWLIST = [
	// Fallbacks de auth solo si production fail-closed está documentado en el mismo archivo
	{ file: 'src/lib/admin/auth.ts', id: 'hardcoded-admin-password-default' },
	{ file: 'src/lib/admin/auth.ts', id: 'hardcoded-dev-session-secret' },
	{ file: 'src/lib/admin/auth.ts', id: 'password-literal-assign' },
	// UI de login menciona el default de docs
	{ file: 'src/routes/admin/login/+page.svelte', id: 'hardcoded-admin-password-default' },
	{ file: 'README.md', id: '*' },
	{ file: '.env.example', id: '*' },
	{ file: 'scripts/security-scan.mjs', id: '*' }
];

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		if (SKIP_DIRS.has(name)) continue;
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
}

function shouldScan(file) {
	const base = file.split(/[/\\]/).pop() || '';
	if (SKIP_FILES.has(base)) return false;
	if (base.startsWith('.env') && !base.endsWith('.example')) return true;
	const ext = base.includes('.') ? `.${base.split('.').pop()}` : '';
	return TEXT_EXT.has(ext) || base === 'Dockerfile';
}

function isAllowed(rel, ruleId) {
	return ALLOWLIST.some(
		(a) => a.file === rel && (a.id === '*' || a.id === ruleId)
	);
}

function main() {
	const files = [];
	for (const d of SCAN_DIRS) {
		const full = join(ROOT, d);
		try {
			walk(full, files);
		} catch {
			/* dir opcional */
		}
	}
	// raíz: .env.example, README
	for (const f of ['.env.example', 'README.md', 'package.json']) {
		files.push(join(ROOT, f));
	}

	/** @type {{ file: string, line: number, id: string, severity: string, tip: string, snippet: string }[]} */
	const findings = [];

	for (const file of files) {
		if (!shouldScan(file)) continue;
		let text;
		try {
			text = readFileSync(file, 'utf8');
		} catch {
			continue;
		}
		const rel = relative(ROOT, file).replaceAll('\\', '/');
		const lines = text.split(/\r?\n/);

		for (const rule of RULES) {
			if (isAllowed(rel, rule.id)) continue;
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (rule.re.test(line)) {
					findings.push({
						file: rel,
						line: i + 1,
						id: rule.id,
						severity: rule.severity,
						tip: rule.tip,
						snippet: line.trim().slice(0, 160)
					});
				}
			}
		}
	}

	const critical = findings.filter((f) => f.severity === 'CRITICAL');
	const high = findings.filter((f) => f.severity === 'HIGH');
	const medium = findings.filter((f) => f.severity === 'MEDIUM');

	console.log('=== security:scan (anti-hardcoded) ===');
	console.log(`Archivos revisados: ${files.filter(shouldScan).length}`);
	console.log(`CRITICAL: ${critical.length}  HIGH: ${high.length}  MEDIUM: ${medium.length}`);

	for (const f of findings) {
		console.log(`\n[${f.severity}] ${f.id}`);
		console.log(`  ${f.file}:${f.line}`);
		console.log(`  ${f.snippet}`);
		console.log(`  → ${f.tip}`);
	}

	if (critical.length) {
		console.error('\nFAIL: hay hallazgos CRITICAL. Elimina secretos hardcodeados.');
		process.exit(1);
	}

	if (high.length) {
		console.warn('\nWARN: hay hallazgos HIGH. Revisa antes de producción.');
		// Auth fallbacks deben estar allowlisteados; otros HIGH fallan
		const unallowedHigh = high.filter((f) => !isAllowed(f.file, f.id));
		if (unallowedHigh.length) {
			process.exit(1);
		}
	}

	console.log('\nOK: sin secretos hardcodeados CRITICAL/HIGH no allowlisteados.');
	process.exit(0);
}

main();
