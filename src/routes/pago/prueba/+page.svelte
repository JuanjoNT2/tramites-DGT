<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';

	let loading = $state(false);
	let error = $state<string | null>(null);

	async function startPrueba() {
		if (loading) return;
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/pago/prueba', { method: 'POST' });
			const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
			if (!res.ok || !data.url) {
				error = data.error || 'No se pudo iniciar la prueba de pago';
				return;
			}
			window.location.href = data.url;
		} catch {
			error = 'Error de red al iniciar el pago';
		} finally {
			loading = false;
		}
	}
</script>

<SeoHead
	title="Probar pago Stripe"
	description="Cobro de prueba de 0,01 € para verificar la pasarela."
	path="/pago/prueba"
	robots="noindex,nofollow"
/>

<section class="section">
	<div class="wrap card pad">
		<p class="eyebrow">Solo para pruebas</p>
		<h1>Probar pago (0,01 €)</h1>
		<p class="lead">
			Abre el Checkout de Stripe y cobra <strong>un céntimo</strong> con tarjeta real (modo Live).
			Sirve para comprobar redirección, cobro, webhook y que la solicitud quede como
			<strong> pagada</strong>.
		</p>
		<ul class="steps">
			<li>Pulsa el botón y completa el pago en Stripe.</li>
			<li>Tras pagar deberías volver a la página de éxito.</li>
			<li>En Stripe → Payments verás el cobro de 0,01 €.</li>
		</ul>

		{#if error}
			<p class="err" role="alert">{error}</p>
		{/if}

		<button type="button" class="btn cta" disabled={loading} onclick={startPrueba}>
			{loading ? 'Abriendo Stripe…' : 'Pagar 0,01 € ahora'}
		</button>

		<p class="note">
			Es un cobro real. Si no quieres dejar este acceso público, desactiva
			<code>ENABLE_PAGO_PRUEBA=0</code> en Vercel o quita el enlace del menú.
		</p>
	</div>
</section>

<style>
	.card {
		max-width: 560px;
		margin: 0 auto;
		background: #fff;
		border: 1px solid rgba(0, 48, 80, 0.1);
		border-radius: var(--radius);
		box-shadow: 0 8px 28px rgba(0, 48, 80, 0.08);
	}

	.pad {
		padding: 28px 24px 32px;
	}

	.eyebrow {
		margin: 0 0 8px;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--brand-teal, #00c6d1);
	}

	h1 {
		margin: 0 0 12px;
		font-size: clamp(1.5rem, 3vw, 1.85rem);
		color: var(--ink);
	}

	.lead {
		margin: 0 0 16px;
		line-height: 1.55;
		color: rgba(0, 48, 80, 0.85);
	}

	.steps {
		margin: 0 0 22px;
		padding-left: 1.2rem;
		line-height: 1.55;
		color: rgba(0, 48, 80, 0.8);
	}

	.cta {
		height: 48px;
		padding: 0 22px;
		font-size: 15px;
	}

	.cta:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.err {
		margin: 0 0 14px;
		color: #9b1c1c;
		font-weight: 600;
	}

	.note {
		margin: 18px 0 0;
		font-size: 13px;
		line-height: 1.45;
		color: rgba(0, 48, 80, 0.55);
	}

	.note code {
		font-size: 12px;
		background: rgba(0, 48, 80, 0.06);
		padding: 1px 5px;
		border-radius: 4px;
	}
</style>
