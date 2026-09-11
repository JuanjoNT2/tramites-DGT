<script lang="ts">
	import type { PageData } from './$types';
	import StatusBadge from '$lib/components/gestor/StatusBadge.svelte';
	import { rangeQuery, toIsoWeekValue } from '$lib/admin/dates';

	let { data }: { data: PageData } = $props();

	let preset = $state(data.range.preset);
	let enviando = $state(false);
	let aviso = $state<{ ok: boolean; text: string } | null>(null);

	const currentYear = new Date().getFullYear();
	const exportQuery = $derived(rangeQuery(data.range));

	$effect(() => {
		preset = data.range.preset;
	});

	async function enviarExcel() {
		if (enviando) return;
		enviando = true;
		aviso = null;
		try {
			const res = await fetch('/proveedor/api/enviar-excel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					preset: data.range.preset,
					start: data.range.startDate,
					end: data.range.endDate
				})
			});
			const body = await res.json().catch(() => ({}));
			aviso = res.ok
				? { ok: true, text: body.message || 'Excel enviado.' }
				: { ok: false, text: body.error || 'No se pudo enviar el Excel.' };
		} catch {
			aviso = { ok: false, text: 'No se pudo conectar con el servidor.' };
		} finally {
			enviando = false;
		}
	}
</script>

<header class="head">
	<div>
		<h1>Distintivos ambientales</h1>
		<p class="sub">{data.rangeLabel} · {data.total} solicitudes</p>
	</div>
	<div class="auto" class:on={data.envioAutomatico}>
		{#if data.envioAutomatico}
			Envío automático activo ({data.frecuencia})
		{:else}
			Envío automático desactivado
		{/if}
		<a href="/proveedor/ajustes">Ajustes</a>
	</div>
</header>

<form class="filters" method="GET">
	<label class="field">
		<span>Ver por</span>
		<select name="preset" bind:value={preset}>
			<option value="day">Día</option>
			<option value="week">Semana</option>
			<option value="month">Mes</option>
			<option value="year">Año</option>
		</select>
	</label>
	<div class="range-fields">
		{#if preset === 'day'}
			<label class="field">
				<span>Desde</span>
				<input type="date" name="start" value={data.range.startDate} />
			</label>
			<label class="field">
				<span>Hasta</span>
				<input type="date" name="end" value={data.range.endDate} />
			</label>
		{:else if preset === 'week'}
			<label class="field">
				<span>Desde</span>
				<input type="week" name="start" value={toIsoWeekValue(data.range.startDate)} />
			</label>
			<label class="field">
				<span>Hasta</span>
				<input type="week" name="end" value={toIsoWeekValue(data.range.endDate)} />
			</label>
		{:else if preset === 'month'}
			<label class="field">
				<span>Desde</span>
				<input type="month" name="start" value={data.range.startDate.slice(0, 7)} />
			</label>
			<label class="field">
				<span>Hasta</span>
				<input type="month" name="end" value={data.range.endDate.slice(0, 7)} />
			</label>
		{:else}
			<label class="field">
				<span>Desde</span>
				<input
					class="year"
					type="number"
					name="start"
					min="2018"
					max={currentYear}
					step="1"
					value={data.range.startDate.slice(0, 4)}
				/>
			</label>
			<label class="field">
				<span>Hasta</span>
				<input
					class="year"
					type="number"
					name="end"
					min="2018"
					max={currentYear}
					step="1"
					value={data.range.endDate.slice(0, 4)}
				/>
			</label>
		{/if}
	</div>
	<button type="submit" class="btn secondary">Aplicar</button>
</form>

<div class="actions">
	<a class="btn" href="/proveedor/api/export/excel?{exportQuery}">Descargar Excel</a>
	<a class="btn secondary" href="/proveedor/api/export/csv?{exportQuery}">Descargar CSV</a>
	<button type="button" class="btn secondary" onclick={enviarExcel} disabled={enviando}>
		{enviando ? 'Enviando…' : 'Enviar ahora por email'}
	</button>
</div>

{#if aviso}
	<p class="aviso" class:err={!aviso.ok}>{aviso.text}</p>
{/if}

{#if data.porEstado.length}
	<div class="counters">
		{#each data.porEstado as c (c.status)}
			<div class="counter">
				<StatusBadge status={c.status} />
				<strong>{c.count}</strong>
			</div>
		{/each}
	</div>
{/if}

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Fecha</th>
				<th>Estado</th>
				<th>Matrícula</th>
				<th>Distintivo</th>
				<th>Titular</th>
				<th>Envío</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.items as t (t.id)}
				<tr>
					<td>{new Date(t.createdAt).toLocaleString('es-ES')}</td>
					<td><StatusBadge status={t.status} /></td>
					<td>{t.matricula || '—'}</td>
					<td>{t.distintivo || '—'}</td>
					<td>{t.nombre || t.email || '—'}</td>
					<td>{t.tipoEnvio || '—'}</td>
					<td><a href="/proveedor/{t.id}">Abrir</a></td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="empty">No hay distintivos en este periodo.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}
	h1 {
		margin: 0 0 6px;
		color: #000038;
		font-size: 1.5rem;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.9rem;
	}
	.auto {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		border-radius: 999px;
		background: #eef1f5;
		color: #5a6b7d;
		font-size: 0.82rem;
		font-weight: 600;
	}
	.auto.on {
		background: #e4f3ea;
		color: #2f7a4f;
	}
	.auto a {
		color: #397ab2;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
		margin-bottom: 14px;
	}
	.range-fields {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		align-items: flex-end;
	}
	.field {
		display: grid;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #5a6b7d;
	}
	.field select,
	.field input {
		padding: 8px 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		font-size: 0.9rem;
		background: #fff;
	}
	.field input.year {
		width: 110px;
	}
	.actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		padding: 8px 14px;
		background: #397ab2;
		color: #fff;
		font-weight: 700;
		border-radius: 8px;
		text-decoration: none;
		border: none;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
	}
	.btn.secondary {
		background: #e8eef3;
		color: #000038;
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: progress;
	}
	.aviso {
		background: #e4f3ea;
		color: #2f7a4f;
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 0.88rem;
	}
	.aviso.err {
		background: #f8e4e4;
		color: #a05050;
	}
	.counters {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}
	.counter {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 10px;
		padding: 8px 12px;
	}
	.counter strong {
		color: #000038;
		font-size: 1.05rem;
	}
	.table-wrap {
		overflow: auto;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 12px 14px;
		border-bottom: 1px solid #e8eef3;
		vertical-align: top;
	}
	th {
		background: #f4f7fb;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #5a6b7d;
	}
	.empty {
		color: #5a6b7d;
		text-align: center;
		padding: 28px !important;
	}
	td a {
		color: #397ab2;
		font-weight: 700;
		text-decoration: none;
	}
</style>
