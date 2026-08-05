<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<header class="head">
	<h1>Documentos</h1>
	<p class="sub">Archivos asociados a tus trámites.</p>
</header>

{#if data.schemaHint}
	<p class="warn">{data.schemaHint}</p>
{/if}

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Nombre</th>
				<th>Trámite</th>
				<th>Fecha</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.items as d}
				<tr>
					<td>{d.nombre}</td>
					<td>
						<a href={`/cuenta/tramites/${d.solicitud_id}`}>{d.solicitud_id.slice(0, 8)}…</a>
					</td>
					<td>{new Date(d.created_at).toLocaleString('es-ES')}</td>
					<td>
						<a href={`/api/cuenta/documentos?download=${d.id}`}>Descargar</a>
					</td>
				</tr>
			{:else}
				<tr><td colspan="4">No hay documentos.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.head {
		margin-bottom: 16px;
	}
	h1 {
		margin: 0 0 6px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
	}
	.table-wrap {
		min-width: 0;
		max-width: 100%;
		overflow-x: auto;
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
	}
	a {
		font-weight: 700;
		color: #003050;
	}
	.warn {
		background: #fff4e5;
		color: #7a4b00;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
	}
</style>
