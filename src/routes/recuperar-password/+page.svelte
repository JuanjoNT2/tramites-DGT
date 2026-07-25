<script lang="ts">
	import type { ActionData } from './$types';
	import SeoHead from '$lib/components/SeoHead.svelte';

	let { form }: { form: ActionData } = $props();
</script>

<SeoHead
	title="Recuperar contraseña"
	description="Solicita un enlace para restablecer tu contraseña."
	path="/recuperar-password"
	robots="noindex,nofollow"
/>

<section class="section">
	<div class="wrap card pad">
		<h1>Recuperar contraseña</h1>
		<p class="lead">
			Indica el email de tu cuenta y te enviaremos un enlace para elegir una nueva contraseña.
		</p>

		{#if form && 'ok' in form && form.ok}
			<p class="ok" role="status">{form.message}</p>
		{:else}
			{#if form?.error}
				<p class="err" role="alert">{form.error}</p>
			{/if}
			<form method="POST" class="form">
				<label>
					Email
					<input
						type="email"
						name="email"
						required
						autocomplete="email"
						value={form && 'email' in form ? form.email : ''}
					/>
				</label>
				<button type="submit" class="btn">Enviar enlace</button>
			</form>
		{/if}

		<p class="hint">
			<a href="/login">Volver al inicio de sesión</a>
		</p>
	</div>
</section>

<style>
	.pad {
		max-width: 440px;
		margin: 40px auto;
		padding: 28px 24px;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 14px;
	}
	h1 {
		margin: 0 0 8px;
		color: #003050;
		font-size: 1.4rem;
	}
	.lead {
		margin: 0 0 18px;
		color: #5a6b7d;
		font-size: 0.95rem;
		line-height: 1.45;
	}
	.form {
		display: grid;
		gap: 14px;
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
	.btn {
		justify-self: start;
		padding: 10px 16px;
		background: #00c6d1;
		color: #003050;
		font-weight: 800;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
	}
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 12px;
		border-radius: 8px;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
	}
	.hint {
		margin-top: 18px;
		font-size: 0.9rem;
	}
	.hint a {
		color: #003050;
		font-weight: 700;
	}
</style>
