<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { resolveDateRange } from '$lib/admin/dates';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const range = $derived(resolveDateRange(page.url));
	let profiles = $state<PageData['profiles']>([]);
	let saving = $state<string | null>(null);
	let message = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);

	$effect(() => {
		profiles = data.profiles;
		errorMsg = data.error;
	});

	async function setRole(id: string, role: string) {
		saving = id;
		message = null;
		errorMsg = null;
		try {
			const res = await fetch('/admin/api/usuarios', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, role })
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || 'Error al actualizar');
			message = `Rol actualizado: ${body.email ?? id} → ${role}`;
			profiles = profiles.map((p) => (p.id === id ? { ...p, role: role as typeof p.role } : p));
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Error';
		} finally {
			saving = null;
		}
	}
</script>

<AdminShell {range} title="Usuarios y permisos">
	<p class="intro">
		Eleva ciudadanos a <strong>gestor</strong> para dar acceso al panel de documentación de
		solicitudes. El panel de analítica sigue usando la contraseña compartida.
	</p>

	{#if message}
		<p class="ok">{message}</p>
	{/if}
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
					<th>Acción</th>
				</tr>
			</thead>
			<tbody>
				{#each profiles as p (p.id)}
					<tr>
						<td>{p.email ?? '—'}</td>
						<td>{p.full_name || '—'}</td>
						<td><code>{p.role}</code></td>
						<td>{new Date(p.created_at).toLocaleDateString('es-ES')}</td>
						<td class="actions">
							<select
								value={p.role}
								disabled={saving === p.id}
								onchange={(e) => setRole(p.id, (e.currentTarget as HTMLSelectElement).value)}
							>
								<option value="user">user</option>
								<option value="gestor">gestor</option>
								<option value="admin">admin</option>
							</select>
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
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px 12px;
		border-radius: 8px;
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
	select {
		padding: 6px 8px;
		border-radius: 6px;
		border: 1px solid #c5d0da;
		font: inherit;
	}
</style>
