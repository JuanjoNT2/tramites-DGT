<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const s = $derived(data.item);

	function entries(obj: Record<string, unknown>, prefix = ''): [string, string][] {
		const out: [string, string][] = [];
		for (const [k, v] of Object.entries(obj)) {
			const key = prefix ? `${prefix}.${k}` : k;
			if (v != null && typeof v === 'object' && !Array.isArray(v)) {
				out.push(...entries(v as Record<string, unknown>, key));
			} else if (Array.isArray(v)) {
				out.push([key, JSON.stringify(v)]);
			} else {
				out.push([key, v == null ? '' : String(v)]);
			}
		}
		return out;
	}

	const fields = $derived(entries(s.payload || {}));
</script>

<p class="back"><a href="/gestor">← Volver al listado</a></p>

<header class="head">
	<div>
		<h1>{data.label}</h1>
		<p class="sub">ID {s.id}</p>
	</div>
	<a class="btn" href={`/gestor/api/export/pdf?id=${s.id}`}>Descargar PDF</a>
</header>

<dl class="meta">
	<div><dt>Estado</dt><dd>{s.status}</dd></div>
	<div><dt>Email</dt><dd>{s.email || '—'}</dd></div>
	<div><dt>Usuario</dt><dd>{s.user_id || 'anónimo'}</dd></div>
	<div><dt>Fecha</dt><dd>{new Date(s.created_at).toLocaleString('es-ES')}</dd></div>
</dl>

<section class="card">
	<h2>Campos del formulario</h2>
	<table>
		<tbody>
			{#each fields as [k, v]}
				<tr>
					<th>{k}</th>
					<td>{v}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<style>
	.back {
		margin: 0 0 16px;
	}
	.back a {
		color: #003050;
		font-weight: 600;
		text-decoration: none;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	h1 {
		margin: 0 0 4px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.85rem;
		word-break: break-all;
	}
	.btn {
		display: inline-flex;
		padding: 8px 14px;
		background: #00c6d1;
		color: #003050;
		font-weight: 700;
		border-radius: 8px;
		text-decoration: none;
	}
	.meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 12px;
		margin: 0 0 20px;
	}
	.meta div {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 10px;
		padding: 12px 14px;
	}
	dt {
		font-size: 0.75rem;
		color: #5a6b7d;
		font-weight: 700;
		text-transform: uppercase;
	}
	dd {
		margin: 4px 0 0;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px 18px;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1rem;
		color: #003050;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 8px 6px;
		border-bottom: 1px solid #e8eef3;
		vertical-align: top;
	}
	th {
		width: 30%;
		color: #5a6b7d;
		font-weight: 600;
	}
</style>
