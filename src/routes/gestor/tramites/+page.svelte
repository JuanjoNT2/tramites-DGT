<script lang="ts">
	import type { PageData } from './$types';
	import StatusBadge from '$lib/components/gestor/StatusBadge.svelte';
	import TramiteKanban from '$lib/components/gestor/TramiteKanban.svelte';
	import { EXPORT_ESTADO_OPTIONS } from '$lib/gestor/export-filters';
	import { SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();

	const qParam = $derived(encodeURIComponent(data.q));
	const listaHref = $derived(`/gestor/tramites?modo=lista&vista=todos&q=${qParam}`);

	function tipoLabel(tipo: string) {
		return SOLICITUD_TIPO_LABELS[tipo] || tipo;
	}

	function clienteHref(t: PageData['items'][number]) {
		if (t.userId) return `/gestor/cliente/${t.userId}`;
		if (t.email) return `/gestor/cliente/anonimo?email=${encodeURIComponent(t.email)}`;
		return null;
	}
</script>

<header class="head">
	<div>
		<h1>{data.title}</h1>
		<p class="sub">Cola de trabajo: todas las solicitudes del sistema.</p>
	</div>
	<div class="exports">
		<a class="btn secondary" href="/gestor/usuarios?vista=todos">Ver usuarios</a>
	</div>
</header>

<details class="export-panel">
	<summary>Descargar trámites</summary>
	<form class="export-form" method="GET" action="/gestor/api/export/excel">
		<label>
			Estado
			<select name="estado">
				{#each EXPORT_ESTADO_OPTIONS as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</label>
		<label>
			Periodo
			<select name="preset">
				<option value="">Todo el histórico</option>
				<option value="day">Días exactos</option>
				<option value="week">Semanas completas</option>
				<option value="month">Meses completos</option>
				<option value="year">Años completos</option>
			</select>
		</label>
		<label>
			Desde
			<input type="date" name="start" />
		</label>
		<label>
			Hasta
			<input type="date" name="end" />
		</label>
		<div class="export-actions">
			<button type="submit" class="btn">Excel</button>
			<button type="submit" class="btn secondary" formaction="/gestor/api/export/csv">CSV</button>
		</div>
	</form>
	<p class="hint">
		Las fechas se ajustan al periodo elegido: con semanas, meses o años se descarga el periodo
		completo que contiene cada fecha. Los distintivos ambientales no se incluyen: los lleva Ideauto
		en su propio panel.
	</p>
</details>

{#if data.error}
	<p class="err">{data.error}</p>
{/if}

<nav class="modes" aria-label="Modo de visualización">
	<a
		href="/gestor/tramites?modo=kanban&vista={data.vista}&q={qParam}"
		class:active={data.modo === 'kanban'}
	>
		Kanban
	</a>
	<a
		href="/gestor/tramites?modo=lista&vista={data.vista}&q={qParam}"
		class:active={data.modo === 'lista'}
	>
		Lista
	</a>
</nav>

{#if data.modo === 'lista'}
	<nav class="tabs" aria-label="Vistas de trámites">
		<a
			href="/gestor/tramites?modo=lista&vista=pendientes&q={qParam}"
			class:active={data.vista === 'pendientes'}
		>
			Pendientes <span>{data.counts.pendientes}</span>
		</a>
		<a
			href="/gestor/tramites?modo=lista&vista=finalizados&q={qParam}"
			class:active={data.vista === 'finalizados'}
		>
			Finalizados <span>{data.counts.finalizados}</span>
		</a>
		<a
			href="/gestor/tramites?modo=lista&vista=todos&q={qParam}"
			class:active={data.vista === 'todos'}
		>
			Todos <span>{data.counts.todos}</span>
		</a>
	</nav>
{/if}

<form class="filters" method="GET">
	<input type="hidden" name="modo" value={data.modo} />
	<input type="hidden" name="vista" value={data.vista} />
	<label>
		Buscar trámite
		<input
			type="search"
			name="q"
			value={data.q}
			placeholder="email, matrícula, tipo, estado…"
		/>
	</label>
	<button type="submit" class="btn secondary">Filtrar</button>
</form>

{#if data.modo === 'kanban'}
	{#if data.canChangeStatus}
		<p class="hint">
			Arrastra una tarjeta entre columnas o usa su selector para cambiar el estado. El ciudadano
			recibe aviso en cada cambio.
		</p>
	{:else}
		<p class="hint">Solo lectura: tu perfil no puede cambiar el estado de los trámites.</p>
	{/if}
	<TramiteKanban
		board={data.board}
		canChangeStatus={data.canChangeStatus}
		listHref={listaHref}
	/>
{:else}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Fecha</th>
					<th>Tipo</th>
					<th>Estado</th>
					<th>Cliente</th>
					<th>Matrícula</th>
					<th>Factura</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.items as t}
					{@const cliente = clienteHref(t)}
					<tr>
						<td>{new Date(t.createdAt).toLocaleString('es-ES')}</td>
						<td>{tipoLabel(t.tipo)}</td>
						<td><StatusBadge status={t.status} /></td>
						<td>
							{#if cliente}
								<a href={cliente}>{t.email || 'Ver cliente'}</a>
							{:else}
								{t.email || '—'}
							{/if}
						</td>
						<td>{t.matricula || '—'}</td>
						<td>
							{#if t.solicitaFactura && t.facturaEmitida}
								<span class="badge ok">Emitida</span>
							{:else if t.solicitaFactura}
								<span class="badge warn">Pendiente</span>
							{:else}
								—
							{/if}
						</td>
						<td><a href="/gestor/{t.id}">Abrir</a></td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="empty">No hay trámites en esta vista.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

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
		color: #003050;
		font-size: 1.5rem;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.9rem;
	}
	.exports {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.btn {
		display: inline-flex;
		padding: 8px 14px;
		background: #00c6d1;
		color: #003050;
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
	}
	.export-panel {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 12px 16px;
		margin-bottom: 18px;
	}
	.export-panel summary {
		cursor: pointer;
		font-weight: 700;
		color: #003050;
		font-size: 0.9rem;
	}
	.export-form {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
		margin-top: 14px;
	}
	.export-form label {
		display: grid;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #5a6b7d;
	}
	.export-form select,
	.export-form input {
		padding: 8px 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		font-size: 0.9rem;
		background: #fff;
	}
	.export-actions {
		display: flex;
		gap: 8px;
	}
	.export-panel .hint {
		margin: 12px 0 0;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
	}
	.modes {
		display: inline-flex;
		gap: 4px;
		padding: 4px;
		margin-bottom: 16px;
		background: #e8eef3;
		border-radius: 999px;
	}
	.modes a {
		padding: 6px 16px;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 700;
		color: #3d4f5f;
		text-decoration: none;
	}
	.modes a.active {
		background: #fff;
		color: #003050;
	}
	.hint {
		margin: 0 0 14px;
		font-size: 0.85rem;
		color: #5a6b7d;
	}
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 16px;
	}
	.tabs a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 999px;
		background: #fff;
		border: 1px solid #d8e0e8;
		color: #003050;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.85rem;
	}
	.tabs a.active {
		background: #003050;
		color: #fff;
		border-color: #003050;
	}
	.tabs span {
		background: rgba(0, 0, 0, 0.08);
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.75rem;
	}
	.tabs a.active span {
		background: rgba(255, 255, 255, 0.2);
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
		margin-bottom: 16px;
	}
	.filters label {
		display: grid;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #5a6b7d;
	}
	.filters input {
		padding: 8px 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		min-width: 260px;
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
		background: #f4f7fa;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #5a6b7d;
	}
	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
	}
	.badge.warn {
		background: #fff3cd;
		color: #7a5b00;
	}
	.badge.ok {
		background: #e8f5ee;
		color: #0f5132;
	}
	.empty {
		color: #5a6b7d;
		text-align: center;
		padding: 28px !important;
	}
	a {
		color: #003050;
		font-weight: 700;
		text-decoration: none;
	}
</style>
