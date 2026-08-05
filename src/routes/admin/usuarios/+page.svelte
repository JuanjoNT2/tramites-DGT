<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { resolveDateRange } from '$lib/admin/dates';
	import { page } from '$app/state';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
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

	<section class="invite card" aria-label="Invitar usuario">
		<h2>Invitar usuario</h2>
		<p class="invite-lead">
			Envía un correo de invitación de Supabase Auth. La persona podrá crear su contraseña y
			activar la cuenta.
		</p>
		{#if form && 'inviteOk' in form && form.inviteOk}
			<p class="ok" role="status">{form.inviteMessage}</p>
		{:else if form && 'inviteError' in form && form.inviteError}
			<p class="err" role="alert">{form.inviteError}</p>
		{/if}
		<form method="POST" action="?/invite" class="invite-form">
			<label>
				Email
				<input
					type="email"
					name="email"
					required
					autocomplete="email"
					placeholder="usuario@ejemplo.com"
					value={form && 'inviteEmail' in form && form.inviteEmail ? form.inviteEmail : ''}
				/>
			</label>
			<button type="submit" class="btn">Enviar invitación</button>
		</form>
	</section>

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
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px 18px;
		margin-bottom: 16px;
		max-width: 560px;
	}
	.invite h2 {
		margin: 0 0 6px;
		font-size: 1.05rem;
		color: #003050;
	}
	.invite-lead {
		margin: 0 0 14px;
		font-size: 0.9rem;
		color: #5a6b7d;
		line-height: 1.45;
	}
	.invite-form {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
	}
	.invite-form label {
		display: grid;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 700;
		color: #5a6b7d;
		flex: 1;
		min-width: 220px;
	}
	.invite-form input {
		padding: 9px 12px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
	}
	.btn {
		padding: 10px 16px;
		background: #00c6d1;
		color: #003050;
		font-weight: 800;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
	}
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
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
