<script lang="ts">
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import { validateEmail, validateMatricula, validateRequired } from '$lib/utils/validators';

	let {
		title,
		tipo,
		steps
	}: {
		title: string;
		tipo: string;
		steps: string[];
	} = $props();

	let step = $state(1);
	let matricula = $state('');
	let email = $state('');
	let nombre = $state('');
	let telefono = $state('');
	let done = $state(false);
	let errors = $state<Record<string, string | null>>({});

	function validate(): boolean {
		errors = {};
		if (step === 1) errors.matricula = validateMatricula(matricula);
		if (step === 2) {
			errors.email = validateEmail(email);
			errors.nombre = validateRequired(nombre, 'El nombre');
		}
		return !Object.values(errors).some(Boolean);
	}

	async function submit() {
		if (!validate()) return;
		await fetch('/api/solicitud', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ tipo, matricula, email, nombre, telefono })
		});
		done = true;
	}
</script>

<svelte:head>
	<title>{title} | Trámites DGT Online</title>
</svelte:head>

<section class="section">
	<div class="wrap main card pad">
		{#if done}
			<div class="ok">
				<h1>Solicitud enviada</h1>
				<p>Te contactaremos pronto. (Modo demostración)</p>
				<a href="/" class="btn">Inicio</a>
			</div>
		{:else}
			<StepProgress current={step} total={steps.length} labels={steps} />
			<h1>{title}</h1>
			{#if step === 1}
				<FormField label="Matrícula del vehículo" error={errors.matricula} required>
					<input bind:value={matricula} placeholder="3990WDS" />
				</FormField>
			{:else if step === 2}
				<FormField label="Email" error={errors.email} required>
					<input type="email" bind:value={email} />
				</FormField>
				<FormField label="Nombre completo" error={errors.nombre} required>
					<input bind:value={nombre} />
				</FormField>
				<FormField label="Teléfono">
					<input type="tel" bind:value={telefono} />
				</FormField>
			{:else if step === 3}
				<p class="info">Revisa tus datos y confirma la solicitud.</p>
				<ul class="sum">
					<li>Matrícula: {matricula}</li>
					<li>Email: {email}</li>
					<li>Nombre: {nombre}</li>
				</ul>
			{:else}
				<p class="info">Pago simulado — conectar pasarela en producción.</p>
			{/if}
			<div class="nav">
				{#if step > 1}<button class="btn ghost" onclick={() => step--}>Anterior</button>{:else}<span
					></span>{/if}
				{#if step < steps.length}
					<button
						class="btn"
						onclick={() => {
							if (validate()) step++;
						}}>Siguiente</button
					>
				{:else}
					<button class="btn" onclick={submit}>Confirmar</button>
				{/if}
			</div>
		{/if}
	</div>
</section>

<style>
	.main {
		max-width: 640px;
		margin: 0 auto;
	}
	.pad {
		padding: 32px;
	}
	h1 {
		font-size: 24px;
		font-weight: 800;
		margin-bottom: 24px;
	}
	.nav {
		display: flex;
		justify-content: space-between;
		margin-top: 28px;
		padding-top: 20px;
		border-top: 1px solid var(--border);
	}
	.info {
		color: var(--text2);
		font-size: 15px;
		line-height: 1.5;
		margin-bottom: 16px;
	}
	.sum {
		list-style: none;
		font-size: 15px;
		color: var(--text2);
	}
	.sum li {
		padding: 8px 0;
	}
	.ok {
		text-align: center;
		padding: 32px;
	}
</style>
