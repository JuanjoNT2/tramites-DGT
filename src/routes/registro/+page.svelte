<script lang="ts">
	import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const fullNameValue = $derived(
		form && 'full_name' in form && typeof form.full_name === 'string' ? form.full_name : ''
	);
	const emailValue = $derived(
		form && 'email' in form && typeof form.email === 'string' ? form.email : ''
	);
	const telefonoValue = $derived(
		form && 'telefono' in form && typeof form.telefono === 'string' ? form.telefono : ''
	);
	const nifValue = $derived(
		form && 'nif' in form && typeof form.nif === 'string' ? form.nif : ''
	);
</script>

<svelte:head>
	<title>Registro | Trámites DGT Online</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="section">
	<div class="wrap auth card pad">
		<h1>Crear cuenta</h1>
		<p class="lead">
			Regístrate para asociar tus trámites a tu email. Email, móvil y NIF/NIE son obligatorios.
		</p>

		{#if form?.ok}
			<div class="ok" role="status">
				<p>{form.message}</p>
				<p><a href="/login">Ir a iniciar sesión</a></p>
			</div>
		{:else}
			{#if form?.error}
				<p class="err" role="alert">{form.error}</p>
			{/if}

			<form method="POST" class="form">
				<label>
					Nombre completo
					<input
						type="text"
						name="full_name"
						required
						autocomplete="name"
						value={fullNameValue}
					/>
				</label>
				<label>
					Email
					<input
						type="email"
						name="email"
						required
						autocomplete="email"
						value={emailValue}
					/>
				</label>
				<label>
					Móvil
					<input
						type="tel"
						name="telefono"
						required
						autocomplete="tel"
						inputmode="tel"
						placeholder="612345678"
						value={telefonoValue}
					/>
				</label>
				<label>
					NIF / NIE
					<input
						type="text"
						name="nif"
						required
						autocomplete="off"
						placeholder="12345678Z"
						value={nifValue}
					/>
				</label>
				<PasswordInput name="password" autocomplete="new-password" minlength={8} />
				<button type="submit" class="btn">Registrarme</button>
			</form>

			<p class="alt">
				¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
			</p>
		{/if}
	</div>
</section>

<style>
	.auth {
		max-width: 420px;
		margin: 48px auto;
		padding: 32px 28px;
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
		width: 100%;
		box-sizing: border-box;
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
		padding: 16px;
		border-radius: 8px;
	}
	.alt {
		margin-top: 20px;
		font-size: 0.95rem;
	}
</style>
