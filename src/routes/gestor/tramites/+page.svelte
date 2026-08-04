<script lang="ts">
	import type { PageData } from './$types';
	import { SOLICITUD_STATUS_LABELS, SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();

	function tipoLabel(tipo: string) {
		return SOLICITUD_TIPO_LABELS[tipo] || tipo;
	}

	function statusLabel(status: string) {
		return SOLICITUD_STATUS_LABELS[status as SolicitudStatus] || status;
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
		<a class="btn" href="/gestor/api/export/csv?tipo=todos">CSV</a>
		<a class="btn secondary" href="/gestor/api/export/excel?tipo=todos">Excel</a>
	</div>
</header>

{#if data.error}
	<p class="err">{data.error}</p>
{/if}

<nav class="tabs" aria-label="Vistas de trámites">
	<a
		href="/gestor/tramites?vista=pendientes&q={encodeURIComponent(data.q)}"
		class:active={data.vista === 'pendientes'}
	>
		Pendientes <span>{data.counts.pendientes}</span>
	</a>
	<a
		href="/gestor/tramites?vista=finalizados&q={encodeURIComponent(data.q)}"
		class:active={data.vista === 'finalizados'}
	>
		Finalizados <span>{data.counts.finalizados}</span>
	</a>
	<a
		href="/gestor/tramites?vista=todos&q={encodeURIComponent(data.q)}"
		class:active={data.vista === 'todos'}
	>
		Todos <span>{data.counts.todos}</span>
	</a>
</nav>

<form class="filters" method="GET">
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

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Fecha</th>
				<th>Tipo</th>
				<th>Estado</th>
				<th>Cliente</th>
				<th>Matrícula</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.items as t}
				{@const cliente = clienteHref(t)}
				<tr>
					<td>{new Date(t.createdAt).toLocaleString('es-ES')}</td>
					<td>{tipoLabel(t.tipo)}</td>
					<td><span class="status">{statusLabel(t.status)}</span></td>
					<td>
						{#if cliente}
							<a href={cliente}>{t.email || 'Ver cliente'}</a>
						{:else}
							{t.email || '—'}
						{/if}
					</td>
					<td>{t.matricula || '—'}</td>
					<td><a href="/gestor/{t.id}">Abrir</a></td>
				</tr>
			{:else}
				<tr>
					<td colspan="6" class="empty">No hay trámites en esta vista.</td>
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
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
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
	.status {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		background: #e8eef3;
		font-size: 0.8rem;
		font-weight: 600;
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
