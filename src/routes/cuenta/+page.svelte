<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { isStaffRole } from '$lib/auth/roles';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Mi cuenta | Trámites DGT Online</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="section">
	<div class="wrap auth card pad">
		<h1>Mi cuenta</h1>
		<p class="lead">Gestiona tu sesión y accesos.</p>

		{#if form?.error}
			<p class="err" role="alert">{form.error}</p>
		{/if}
		{#if form?.ok}
			<p class="ok" role="status">{form.message}</p>
		{/if}

		<dl class="meta">
			<div>
				<dt>Email</dt>
				<dd>{data.email}</dd>
			</div>
			{#if data.profile?.full_name}
				<div>
					<dt>Nombre</dt>
					<dd>{data.profile.full_name}</dd>
				</div>
			{/if}
			<div>
				<dt>Rol</dt>
				<dd>{data.profile?.role ?? 'user'}</dd>
			</div>
			<div>
				<dt>Email verificado</dt>
				<dd>{data.emailConfirmed ? 'Sí' : 'No'}</dd>
			</div>
		</dl>

		{#if !data.emailConfirmed}
			<form method="POST" action="?/resend" class="row">
				<button type="submit" class="btn secondary">Reenviar verificación</button>
			</form>
		{/if}

		{#if isStaffRole(data.profile?.role)}
			<p class="panel-link"><a href="/gestor">Ir al panel de gestor</a></p>
		{/if}
		{#if data.profile?.role === 'admin'}
			<p class="panel-link"><a href="/admin">Panel de analítica</a> · <a href="/admin/usuarios">Usuarios</a></p>
		{/if}

		<form method="POST" action="?/logout">
			<button type="submit" class="btn">Cerrar sesión</button>
		</form>
	</div>
</section>

<style>
	.auth {
		max-width: 480px;
		margin: 48px auto;
	}
	h1 {
		margin: 0 0 8px;
		color: var(--navy, #003050);
	}
	.lead {
		color: #5a6b7d;
		margin: 0 0 24px;
	}
	.meta {
		display: grid;
		gap: 12px;
		margin: 0 0 24px;
	}
	.meta div {
		display: grid;
		gap: 2px;
	}
	dt {
		font-size: 0.8rem;
		color: #5a6b7d;
		font-weight: 600;
	}
	dd {
		margin: 0;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 16px;
	}
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 16px;
	}
	.row {
		margin-bottom: 16px;
	}
	.btn.secondary {
		background: transparent;
		border: 1px solid var(--navy, #003050);
		color: var(--navy, #003050);
	}
	.panel-link {
		margin-bottom: 16px;
	}
</style>
