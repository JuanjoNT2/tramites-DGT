<script lang="ts">
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import PaymentStep from '$lib/components/ui/PaymentStep.svelte';
	import { validateEmail, validateMatricula, validateRequired } from '$lib/utils/validators';
	import { createSolicitudAndStartPayment, postToRedsys } from '$lib/pago/client';

	let {
		title,
		tipo,
		steps,
		amount = 29.95
	}: {
		title: string;
		tipo: string;
		steps: string[];
		amount?: number;
	} = $props();

	let step = $state(1);
	let matricula = $state('');
	let email = $state('');
	let nombre = $state('');
	let telefono = $state('');
	let done = $state(false);
	let submitting = $state(false);
	let orderId = $state('');
	let payMessage = $state<string | null>(null);
	let payError = $state<string | null>(null);
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
		submitting = true;
		payError = null;
		try {
			const result = await createSolicitudAndStartPayment({
				amount,
				description: title,
				payload: { tipo, matricula, email, nombre, telefono, total: amount }
			});
			if (!result.ok) {
				payError = result.error;
				return;
			}
			orderId = result.solicitudId;
			if (result.mode === 'redirect') {
				postToRedsys(result.redsys);
				return;
			}
			if (result.mode === 'stripe_embedded' || result.mode === 'stripe_redirect') {
				const url =
					result.mode === 'stripe_redirect'
						? result.url
						: `/pago/${result.solicitudId}`;
				window.location.href = url;
				return;
			}
			payMessage =
				result.mode === 'pending_credentials'
					? result.message
					: 'Solicitud registrada pendiente de pago.';
			done = true;
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{title} | Trámites DGT Online</title>
</svelte:head>

<section class="section">
	<div class="wrap main card pad">
		{#if done}
			<div class="ok">
				<h1>Solicitud registrada</h1>
				{#if payMessage}<p>{payMessage}</p>{/if}
				{#if orderId}<p class="ref">Referencia: <strong>{orderId}</strong></p>{/if}
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
				{#if payError}<p class="err">{payError}</p>{/if}
				<PaymentStep total={amount} loading={submitting} onPay={submit} />
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
	.ref {
		font-size: 14px;
		color: var(--text2);
		margin: 12px 0;
	}
	.err {
		color: #b42318;
		font-size: 14px;
		margin-bottom: 12px;
	}
</style>
