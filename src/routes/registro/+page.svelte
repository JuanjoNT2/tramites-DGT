<script lang="ts">
	import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
	import NifInput from '$lib/components/ui/NifInput.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const nombreValue = $derived(
		form && 'nombre' in form && typeof form.nombre === 'string' ? form.nombre : ''
	);
	const apellido1Value = $derived(
		form && 'apellido1' in form && typeof form.apellido1 === 'string' ? form.apellido1 : ''
	);
	const apellido2Value = $derived(
		form && 'apellido2' in form && typeof form.apellido2 === 'string' ? form.apellido2 : ''
	);
	const emailValue = $derived(
		form && 'email' in form && typeof form.email === 'string' ? form.email : ''
	);
	const telefonoValue = $derived(
		form && 'telefono' in form && typeof form.telefono === 'string' ? form.telefono : ''
	);
	let nif = $state(form && 'nif' in form && typeof form.nif === 'string' ? form.nif : '');
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
					Nombre
					<input
						type="text"
						name="nombre"
						required
						autocomplete="given-name"
						value={nombreValue}
					/>
				</label>
				<label>
					Primer apellido
					<input
						type="text"
						name="apellido1"
						required
						autocomplete="family-name"
						value={apellido1Value}
					/>
				</label>
				<label>
					Segundo apellido
					<input
						type="text"
						name="apellido2"
						required
						autocomplete="additional-name"
						value={apellido2Value}
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
					<span class="hint">Escribe los dígitos: la letra se calcula sola</span>
					<NifInput name="nif" bind:value={nif} required />
				</label>
				<PasswordInput
					name="password"
					label="Contraseña"
					autocomplete="new-password"
					minlength={8}
				/>
				<p class="hint-inline">Mínimo 8 caracteres. No hace falta mayúsculas ni símbolos.</p>
				<PasswordInput
					name="password2"
					label="Repetir contraseña"
					autocomplete="new-password"
					minlength={8}
				/>
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
	.hint {
		font-weight: 500;
		font-size: 0.8rem;
		color: #5a6b7d;
	}
	.hint-inline {
		margin: -8px 0 0;
		font-size: 0.8rem;
		font-weight: 500;
		color: #5a6b7d;
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
