<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Nueva contraseña | Trámites DGT Online</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="section">
	<div class="wrap auth card pad">
		<h1>Nueva contraseña</h1>
		{#if data.email}
			<p class="lead">Cuenta: <strong>{data.email}</strong></p>
		{/if}

		{#if form && 'ok' in form && form.ok}
			<p class="ok" role="status">{form.message}</p>
			<p class="alt">
				<a href="/cuenta">Ir a mi área</a> · <a href="/gestor">Panel gestor</a> ·
				<a href="/">Inicio</a>
			</p>
		{:else}
			{#if form?.error}
				<p class="err" role="alert">{form.error}</p>
			{/if}
			<form method="POST" class="form">
				<label>
					Nueva contraseña
					<input
						type="password"
						name="password"
						required
						minlength="8"
						autocomplete="new-password"
					/>
				</label>
				<label>
					Repetir contraseña
					<input
						type="password"
						name="password2"
						required
						minlength="8"
						autocomplete="new-password"
					/>
				</label>
				<button type="submit" class="btn">Guardar contraseña</button>
			</form>
		{/if}
	</div>
</section>

<style>
	.auth {
		max-width: 420px;
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
	.form {
		display: grid;
		gap: 16px;
	}
	label {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9rem;
	}
	input {
		padding: 10px 12px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
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
	}
	.alt {
		margin-top: 20px;
		font-size: 0.95rem;
	}
</style>
