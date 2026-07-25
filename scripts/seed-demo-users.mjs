#!/usr/bin/env node
/**
 * Seed: 5 usuarios demo + 1 gestor + vehículos.
 * Uso: npm run seed:demo-users
 * Requiere SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en .env o .env.local
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(name) {
	const path = resolve(process.cwd(), name);
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split('\n')) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const i = t.indexOf('=');
		if (i < 0) continue;
		const key = t.slice(0, i).trim();
		let val = t.slice(i + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		if (!(key in process.env)) process.env[key] = val;
	}
}

loadEnvFile('.env');
loadEnvFile('.env.local');
loadEnvFile('.env.vercel.pull');

const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
	console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
	console.error('');
	console.error('Añádelas a .env.local (desde Vercel → Settings → Environment Variables)');
	console.error('y vuelve a ejecutar: npm run seed:demo-users');
	process.exit(1);
}

if (!/^https?:\/\//i.test(url) || key.length < 20) {
	console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY parecen inválidos o vacíos.');
	process.exit(1);
}

const sb = createClient(url, key, {
	auth: { persistSession: false, autoRefreshToken: false }
});

const DEMO_USER_PASSWORD = 'DemoUser2026!';
const GESTOR_PASSWORD = 'GestorDemo2026!';

/** @type {{ email: string, password: string, fullName: string, role: 'user'|'gestor', vehicles: { matricula: string, tipo: string, marca: string, modelo: string, bastidor?: string }[] }[]} */
const ACCOUNTS = [
	{
		email: 'demo1@tramitesdgtonline.com',
		password: DEMO_USER_PASSWORD,
		fullName: 'Ana Demo Uno',
		role: 'user',
		vehicles: [
			{ matricula: '1234ABC', tipo: 'coche', marca: 'Seat', modelo: 'León', bastidor: 'VSSZZZ5FZJR000001' },
			{ matricula: '5678DEF', tipo: 'moto', marca: 'Yamaha', modelo: 'MT-07' }
		]
	},
	{
		email: 'demo2@tramitesdgtonline.com',
		password: DEMO_USER_PASSWORD,
		fullName: 'Bruno Demo Dos',
		role: 'user',
		vehicles: [
			{ matricula: '2345BCD', tipo: 'coche', marca: 'Volkswagen', modelo: 'Golf', bastidor: 'WVWZZZ1KZAW000002' }
		]
	},
	{
		email: 'demo3@tramitesdgtonline.com',
		password: DEMO_USER_PASSWORD,
		fullName: 'Carla Demo Tres',
		role: 'user',
		vehicles: [
			{ matricula: '3456CDE', tipo: 'coche', marca: 'Renault', modelo: 'Clio', bastidor: 'VF1RJA00000000003' },
			{ matricula: '9012GHI', tipo: 'coche', marca: 'Toyota', modelo: 'Yaris' }
		]
	},
	{
		email: 'demo4@tramitesdgtonline.com',
		password: DEMO_USER_PASSWORD,
		fullName: 'Diego Demo Cuatro',
		role: 'user',
		vehicles: [
			{ matricula: '4567DEF', tipo: 'moto', marca: 'Honda', modelo: 'CB500', bastidor: 'JH2PC350000000004' }
		]
	},
	{
		email: 'demo5@tramitesdgtonline.com',
		password: DEMO_USER_PASSWORD,
		fullName: 'Elena Demo Cinco',
		role: 'user',
		vehicles: [
			{ matricula: '6789EFG', tipo: 'coche', marca: 'Ford', modelo: 'Focus', bastidor: 'WF0XXXGCDX0000005' },
			{ matricula: '1122JKL', tipo: 'coche', marca: 'Peugeot', modelo: '208' }
		]
	},
	{
		email: 'gestor@tramitesdgtonline.com',
		password: GESTOR_PASSWORD,
		fullName: 'Gestor Demo',
		role: 'gestor',
		vehicles: [
			{ matricula: '9999GST', tipo: 'coche', marca: 'Skoda', modelo: 'Octavia', bastidor: 'TMBZZZ1Z000000099' }
		]
	}
];

async function findUserIdByEmail(email) {
	const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
	if (error) throw error;
	const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
	return found?.id ?? null;
}

async function ensureUser(account) {
	let id = await findUserIdByEmail(account.email);
	let created = false;

	if (!id) {
		const { data, error } = await sb.auth.admin.createUser({
			email: account.email,
			password: account.password,
			email_confirm: true,
			user_metadata: { full_name: account.fullName }
		});
		if (error) throw new Error(`createUser ${account.email}: ${error.message}`);
		id = data.user.id;
		created = true;
	} else {
		// Asegurar password y confirmación en re-runs de demo
		await sb.auth.admin.updateUserById(id, {
			password: account.password,
			email_confirm: true,
			user_metadata: { full_name: account.fullName }
		});
	}

	// Esperar a que el trigger cree el profile (reintento corto)
	for (let i = 0; i < 5; i++) {
		const { data: profile } = await sb.from('profiles').select('id, role').eq('id', id).maybeSingle();
		if (profile) break;
		await new Promise((r) => setTimeout(r, 300));
	}

	const { error: upErr } = await sb
		.from('profiles')
		.update({
			role: account.role,
			full_name: account.fullName,
			email: account.email
		})
		.eq('id', id);

	if (upErr) {
		// Si el profile aún no existe, insertar
		const { error: insErr } = await sb.from('profiles').upsert({
			id,
			email: account.email,
			full_name: account.fullName,
			role: account.role
		});
		if (insErr) throw new Error(`profiles ${account.email}: ${insErr.message}`);
	}

	for (const v of account.vehicles) {
		const { error: vErr } = await sb.from('vehiculos').upsert(
			{
				user_id: id,
				matricula: v.matricula,
				tipo: v.tipo,
				marca: v.marca,
				modelo: v.modelo,
				bastidor: v.bastidor ?? null,
				meta: { seed: true }
			},
			{ onConflict: 'user_id,matricula' }
		);
		if (vErr) throw new Error(`vehiculos ${account.email} ${v.matricula}: ${vErr.message}`);
	}

	return { id, created, email: account.email, role: account.role, password: account.password };
}

async function main() {
	console.log('Seeding demo users…\n');
	const rows = [];
	for (const account of ACCOUNTS) {
		const row = await ensureUser(account);
		rows.push(row);
		console.log(
			`${row.created ? 'CREATED' : 'UPDATED'}  ${row.email}  role=${row.role}  id=${row.id.slice(0, 8)}…`
		);
	}

	console.log('\n========== CREDENCIALES DEMO ==========\n');
	console.log('Ciudadanos (/login → /cuenta):');
	for (const r of rows.filter((x) => x.role === 'user')) {
		console.log(`  ${r.email}  /  ${r.password}`);
	}
	console.log('\nGestor (/login → /gestor):');
	const g = rows.find((x) => x.role === 'gestor');
	if (g) console.log(`  ${g.email}  /  ${g.password}`);
	console.log('\nNOTA: /admin (analítica) usa ADMIN_PASSWORD, no estas cuentas.');
	console.log('=========================================\n');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
