<script lang="ts">
	import FormField from '$lib/components/ui/FormField.svelte';
	import { validateEmail, validateRequired } from '$lib/utils/validators';

	let nombre = $state('');
	let email = $state('');
	let mensaje = $state('');
	let sent = $state(false);
	let errors = $state<Record<string, string | null>>({});

	async function submit(e: Event) {
		e.preventDefault();
		errors = {
			nombre: validateRequired(nombre, 'El nombre'),
			email: validateEmail(email),
			mensaje: validateRequired(mensaje, 'El mensaje')
		};
		if (Object.values(errors).some(Boolean)) return;
		await fetch('/api/solicitud', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ tipo: 'contacto', nombre, email, mensaje })
		});
		sent = true;
	}
</script>

<svelte:head>
	<title>Contacto | Trámites DGT Online</title>
</svelte:head>

<section class="section">
	<div class="wrap card pad">
		<h1>Contacto</h1>
		<p class="sub">¿Necesitas ayuda? Escríbenos o llámanos al <a href="tel:+34629314828">629 314 828</a></p>
		{#if sent}
			<p class="ok">Mensaje enviado. Te responderemos pronto.</p>
		{:else}
			<form onsubmit={submit}>
				<FormField label="Nombre" error={errors.nombre} required>
					<input bind:value={nombre} />
				</FormField>
				<FormField label="Email" error={errors.email} required>
					<input type="email" bind:value={email} />
				</FormField>
				<FormField label="Mensaje" error={errors.mensaje} required>
					<textarea bind:value={mensaje} rows="5"></textarea>
				</FormField>
				<button type="submit" class="btn">Enviar mensaje</button>
			</form>
		{/if}
	</div>
</section>

<style>
	.pad {
		max-width: 560px;
		margin: 0 auto;
		padding: 32px;
	}
	h1 {
		font-size: 32px;
		font-weight: 800;
		margin-bottom: 8px;
	}
	.sub {
		color: var(--text2);
		margin-bottom: 28px;
	}
	.sub a {
		color: var(--accent);
		font-weight: 700;
	}
	.ok {
		color: var(--success);
		font-weight: 600;
	}
</style>
