<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { resolveDateRange } from '$lib/admin/dates';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const range = $derived(resolveDateRange(page.url));
	let profiles = $state<PageData['profiles']>([]);
	let errorMsg = $state<string | null>(null);

	$effect(() => {
		profiles = data.profiles;
		errorMsg = data.error;
	});
</script>

<AdminShell {range} title="Usuarios">
	<p class="intro">
		Consulta perfiles, vehículos y trámites. Los roles <strong>gestor</strong> /
		<strong>admin</strong> Auth no se cambian desde la web: se asignan con el script de seed o en
		Supabase.
	</p>

	{#if errorMsg}
		<p class="err">{errorMsg}</p>
	{/if}

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Email</th>
					<th>Nombre</th>
					<th>Rol</th>
					<th>Alta</th>
					<th>Detalle</th>
				</tr>
			</thead>
			<tbody>
				{#each profiles as p (p.id)}
					<tr>
						<td>{p.email ?? '—'}</td>
						<td>{p.full_name || '—'}</td>
						<td><code>{p.role}</code></td>
						<td>{new Date(p.created_at).toLocaleDateString('es-ES')}</td>
						<td>
							<a href="/admin/usuarios/{p.id}?{page.url.searchParams}">Ver vehículos y trámites</a>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5">No hay perfiles (¿migración aplicada?).</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</AdminShell>

<style>
	.intro {
		margin: 0 0 16px;
		color: #5a6b7d;
		max-width: 720px;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
	}
	.table-wrap {
		overflow: auto;
		background: #fff;
		border-radius: 12px;
		border: 1px solid #d8e0e8;
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
	th {
		background: #f4f7fa;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #5a6b7d;
	}
	a {
		color: #003050;
		font-weight: 600;
		font-size: 0.85rem;
	}
</style>
