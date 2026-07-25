#!/usr/bin/env node
/**
 * Seed: 10 trámites de ejemplo en distintos estados.
 * Uso: npm run seed:demo-solicitudes
 * Requiere SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Idealmente tras: npm run seed:demo-users
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

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
	process.exit(1);
}

const sb = createClient(url, key, {
	auth: { persistSession: false, autoRefreshToken: false }
});

const DEMO_EMAILS = [
	'demo1@tramitesdgtonline.com',
	'demo2@tramitesdgtonline.com',
	'demo3@tramitesdgtonline.com',
	'demo4@tramitesdgtonline.com',
	'demo5@tramitesdgtonline.com'
];

async function findUserIdByEmail(email) {
	const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
	if (error) throw error;
	const u = (data?.users || []).find((x) => (x.email || '').toLowerCase() === email.toLowerCase());
	return u?.id ?? null;
}

function daysAgo(n) {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d.toISOString();
}

/** @returns {Promise<void>} */
async function main() {
	/** @type {Record<string, string|null>} */
	const userIds = {};
	for (const email of DEMO_EMAILS) {
		userIds[email] = await findUserIdByEmail(email);
		if (!userIds[email]) {
			console.warn(`⚠ Usuario no encontrado: ${email} (el trámite quedará sin user_id)`);
		}
	}

	// Quitar seeds previos para poder reejecutar
	const { data: prev } = await sb
		.from('solicitudes')
		.select('id, payload')
		.limit(5000);
	const prevIds = (prev || [])
		.filter((r) => r.payload && r.payload.demoSeed === true)
		.map((r) => r.id);
	if (prevIds.length) {
		const { error: delErr } = await sb.from('solicitudes').delete().in('id', prevIds);
		if (delErr) {
			console.error('No se pudieron borrar seeds previos:', delErr.message);
			process.exit(1);
		}
		console.log(`Eliminados ${prevIds.length} trámites demo anteriores.`);
	}

	const rows = [
		{
			tipo: 'transferencia',
			status: 'nueva',
			email: DEMO_EMAILS[0],
			created_at: daysAgo(1),
			payload: {
				demoSeed: true,
				nombre: 'Ana Demo Uno',
				email: DEMO_EMAILS[0],
				telefono: '600111001',
				matricula: '1234ABC',
				marca: 'Seat',
				modelo: 'León'
			}
		},
		{
			tipo: 'etiqueta',
			status: 'en_curso',
			email: DEMO_EMAILS[1],
			created_at: daysAgo(3),
			payload: {
				demoSeed: true,
				nombre: 'Bruno Demo Dos',
				email: DEMO_EMAILS[1],
				telefono: '600111002',
				matricula: '2345BCD',
				marca: 'Volkswagen',
				modelo: 'Golf'
			}
		},
		{
			tipo: 'informe-dgt',
			status: 'pendiente_pago',
			email: DEMO_EMAILS[2],
			created_at: daysAgo(2),
			payload: {
				demoSeed: true,
				nombre: 'Carla Demo Tres',
				email: DEMO_EMAILS[2],
				telefono: '600111003',
				matricula: '3456CDE',
				importe: 15.95
			}
		},
		{
			tipo: 'duplicado-carnet',
			status: 'pagada',
			email: DEMO_EMAILS[3],
			created_at: daysAgo(5),
			payload: {
				demoSeed: true,
				nombre: 'Diego Demo Cuatro',
				email: DEMO_EMAILS[3],
				telefono: '600111004',
				nif: '12345678Z',
				motivo: 'Pérdida'
			}
		},
		{
			tipo: 'cancelacion-reserva',
			status: 'realizada',
			email: DEMO_EMAILS[4],
			created_at: daysAgo(12),
			payload: {
				demoSeed: true,
				nombre: 'Elena Demo Cinco',
				email: DEMO_EMAILS[4],
				telefono: '600111005',
				matricula: '6789EFG',
				bastidor: 'WF0XXXGCDX0000005'
			}
		},
		{
			tipo: 'etiqueta-vmp',
			status: 'cancelada',
			email: DEMO_EMAILS[0],
			created_at: daysAgo(20),
			payload: {
				demoSeed: true,
				nombre: 'Ana Demo Uno',
				email: DEMO_EMAILS[0],
				telefono: '600111001',
				matricula: '5678DEF',
				motivoCancelacion: 'Cliente desistió'
			}
		},
		{
			tipo: 'transferencia',
			status: 'en_curso',
			email: DEMO_EMAILS[2],
			created_at: daysAgo(4),
			payload: {
				demoSeed: true,
				nombre: 'Carla Demo Tres',
				email: DEMO_EMAILS[2],
				telefono: '600111003',
				matricula: '9012GHI',
				marca: 'Toyota',
				modelo: 'Yaris',
				comprador: 'Pedro Comprador'
			}
		},
		{
			tipo: 'informe-dgt',
			status: 'realizada',
			email: DEMO_EMAILS[1],
			created_at: daysAgo(15),
			payload: {
				demoSeed: true,
				nombre: 'Bruno Demo Dos',
				email: DEMO_EMAILS[1],
				telefono: '600111002',
				matricula: '2345BCD'
			}
		},
		{
			tipo: 'etiqueta',
			status: 'nueva',
			email: 'anonimo.demo@example.com',
			created_at: daysAgo(0),
			payload: {
				demoSeed: true,
				nombre: 'Visitante Anónimo',
				email: 'anonimo.demo@example.com',
				telefono: '600999888',
				matricula: '8888ZZZ',
				sinCuenta: true
			}
		},
		{
			tipo: 'contacto',
			status: 'pendiente_pago',
			email: DEMO_EMAILS[4],
			created_at: daysAgo(6),
			payload: {
				demoSeed: true,
				nombre: 'Elena Demo Cinco',
				email: DEMO_EMAILS[4],
				telefono: '600111005',
				mensaje: 'Consulta sobre transferencia de vehículo de empresa'
			}
		}
	];

	const inserts = rows.map((r) => ({
		id: randomUUID(),
		tipo: r.tipo,
		status: r.status,
		email: r.email,
		user_id: userIds[r.email] ?? null,
		payload: r.payload,
		created_at: r.created_at
	}));

	const { data, error } = await sb.from('solicitudes').insert(inserts).select('id, tipo, status, email');
	if (error) {
		console.error('Error insertando trámites:', error.message);
		process.exit(1);
	}

	const byStatus = {};
	for (const row of data || []) {
		byStatus[row.status] = (byStatus[row.status] || 0) + 1;
		console.log(`✓ ${row.status.padEnd(16)} ${row.tipo.padEnd(22)} ${row.email}`);
	}

	console.log('\nResumen por estado:');
	for (const [k, v] of Object.entries(byStatus).sort()) {
		console.log(`  ${k}: ${v}`);
	}
	console.log(`\nTotal insertados: ${(data || []).length}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
