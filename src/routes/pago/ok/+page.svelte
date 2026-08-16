<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const tramiteHref = $derived(
		data.loggedIn && data.solicitudId
			? `/cuenta/tramites/${data.solicitudId}`
			: data.pagoUrl || '/cuenta/tramites?estado=en_curso'
	);
	const statusHrefLabel = $derived(
		data.loggedIn ? 'Ver el estado de mi trámite' : 'Seguir el trámite'
	);
</script>

<SeoHead
	title={data.paid ? 'Pago realizado con éxito' : 'Confirmando pago'}
	description="Estado del pago de tu trámite."
	path="/pago/ok"
	robots="noindex,nofollow"
/>

<section class="section">
	<div class="wrap card pad">
		{#if data.paid}
			<div class="ok" aria-hidden="true">✓</div>
			<h1>Tu pago se ha realizado con éxito</h1>
			<p class="lead">
				Gracias. Hemos recibido la confirmación del pago y tu trámite queda registrado para su
				gestión. Puedes consultar el estado en tu panel de usuario en cualquier momento.
			</p>
		{:else}
			<div class="wait" aria-hidden="true">…</div>
			<h1>Estamos confirmando tu pago</h1>
			<p class="lead">
				Si acabas de pagar, la confirmación del banco puede tardar unos segundos. Actualiza esta
				página en breve o consulta el estado en tu área de usuario.
			</p>
		{/if}

		{#if data.allowed && data.solicitudId}
			<p class="ref">Referencia del trámite: <strong>{data.solicitudId}</strong></p>
		{/if}

		<div class="actions" role="navigation" aria-label="Opciones tras el pago">
			{#if data.allowed || data.loggedIn}
				<a class="btn primary" href={tramiteHref}>{statusHrefLabel}</a>
			{/if}
			<a class="btn secondary" href="/#servicios">Realizar otro trámite</a>
			<a class="btn ghost" href="/">Volver a la página principal</a>
		</div>
	</div>
</section>

<style>
	.pad {
		max-width: 560px;
		margin: 40px auto;
		padding: 40px 28px 36px;
		text-align: center;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 14px;
	}
	.ok,
	.wait {
		width: 64px;
		height: 64px;
		margin: 0 auto 18px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 28px;
		font-weight: 800;
	}
	.ok {
		background: #ecfdf3;
		color: #027a48;
	}
	.wait {
		background: #fff8e6;
		color: #856404;
	}
	h1 {
		font-size: 1.55rem;
		font-weight: 800;
		color: #003050;
		margin: 0 0 12px;
		line-height: 1.25;
	}
	.lead {
		color: #5a6b7d;
		line-height: 1.55;
		margin: 0 0 14px;
		font-size: 1rem;
	}
	.ref {
		font-size: 0.88rem;
		color: #5a6b7d;
		margin: 0 0 22px;
		word-break: break-all;
	}
	.ref strong {
		color: #1a2b3c;
		font-family: ui-monospace, monospace;
		font-weight: 600;
	}
	.actions {
		display: grid;
		gap: 10px;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 12px 16px;
		border-radius: 10px;
		font-weight: 800;
		text-decoration: none;
		font-size: 0.95rem;
		border: 1px solid transparent;
	}
	.btn.primary {
		background: #00c6d1;
		color: #003050;
	}
	.btn.secondary {
		background: #003050;
		color: #fff;
	}
	.btn.ghost {
		background: transparent;
		color: #003050;
		border-color: #c5d0da;
	}
</style>
