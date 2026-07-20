<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Admin · Login</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="wrap">
	<form class="card" method="POST" action="/admin/api/login">
		<h1>Analítica</h1>
		<p>Acceso al panel estilo GA4</p>
		{#if data.error}
			<p class="err">Credenciales incorrectas</p>
		{/if}
		<input type="hidden" name="next" value={data.next} />
		<label>
			Contraseña
			<input type="password" name="password" required autocomplete="current-password" />
		</label>
		<button type="submit">Entrar</button>
		<p class="hint">En local: ADMIN_PASSWORD (default solo en dev). En producción es obligatorio y fuerte.</p>
	</form>
</div>

<style>
	.wrap {
		min-height: 100vh;
		display: grid;
		place-items: center;
		background: #00263d;
		padding: 24px;
		font-family: 'Open Sans', system-ui, sans-serif;
	}
	.card {
		width: min(400px, 100%);
		background: #fff;
		border-radius: 12px;
		padding: 32px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	h1 {
		margin: 0;
		font-size: 24px;
		color: #003050;
	}
	p {
		margin: 0;
		color: #5a6b7d;
		font-size: 14px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		font-weight: 700;
		color: #1a2b3c;
	}
	input[type='password'] {
		height: 42px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 0 12px;
		font: inherit;
	}
	button {
		height: 44px;
		border: none;
		border-radius: 6px;
		background: #00c6d1;
		color: #003050;
		font-weight: 800;
		cursor: pointer;
	}
	.err {
		color: #dc3545;
		font-weight: 700;
	}
	.hint {
		font-size: 12px;
	}
</style>
