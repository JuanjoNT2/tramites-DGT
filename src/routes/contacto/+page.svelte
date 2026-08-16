<script lang="ts">
	import FormField from '$lib/components/ui/FormField.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import PrivacyAcceptField from '$lib/components/legal/PrivacyAcceptField.svelte';
	import { validateEmail, validateRequired } from '$lib/utils/validators';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/contacto')!;

	let nombre = $state('');
	let email = $state('');
	let mensaje = $state('');
	let acceptPrivacy = $state(false);
	let sent = $state(false);
	let submitting = $state(false);
	let submitError = $state<string | null>(null);
	let errors = $state<Record<string, string | null>>({});

	async function submit(e: Event) {
		e.preventDefault();
		submitError = null;
		errors = {
			nombre: validateRequired(nombre, 'El nombre'),
			email: validateEmail(email),
			mensaje: validateRequired(mensaje, 'El mensaje'),
			privacy: acceptPrivacy ? null : 'Debes aceptar la política de privacidad'
		};
		if (Object.values(errors).some(Boolean)) return;
		submitting = true;
		try {
			const res = await fetch('/api/solicitud', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tipo: 'contacto',
					nombre,
					email,
					mensaje,
					acceptPrivacy: true
				})
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				submitError =
					typeof data.error === 'string' ? data.error : 'No se pudo enviar el mensaje. Inténtalo de nuevo.';
				return;
			}
			sent = true;
		} catch {
			submitError = 'No se pudo enviar el mensaje. Inténtalo de nuevo.';
		} finally {
			submitting = false;
		}
	}
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap card pad">
		<h1>Contacto</h1>
		<p class="sub">¿Necesitas ayuda? Escríbenos a través del formulario o a <a href="mailto:info@tramitesdgtonline.com">info@tramitesdgtonline.com</a>.</p>
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
				<PrivacyAcceptField bind:checked={acceptPrivacy} error={errors.privacy} />
				{#if submitError}<p class="err">{submitError}</p>{/if}
				<button type="submit" class="btn" disabled={submitting}>
					{submitting ? 'Enviando…' : 'Enviar mensaje'}
				</button>
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
	.err {
		color: #b42318;
		font-size: 14px;
		margin: 8px 0 12px;
	}
</style>
