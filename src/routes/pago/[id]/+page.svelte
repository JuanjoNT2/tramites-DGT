<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import PaymentGatewayPanel from '$lib/components/pago/PaymentGatewayPanel.svelte';
	import { postToRedsys, startPayment } from '$lib/pago/client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading = $state(false);
	let message = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);
	let embedMount = $state<HTMLDivElement | null>(null);
	let embedActive = $state(false);

	async function mountStripeEmbedded(clientSecret: string) {
		const { loadStripe } = await import('@stripe/stripe-js');
		const pk = data.stripePublishableKey;
		if (!pk) {
			errorMsg = 'Falta la clave pública de Stripe (PUBLIC_STRIPE_PUBLISHABLE_KEY).';
			return false;
		}
		const stripe = await loadStripe(pk);
		if (!stripe || !embedMount) {
			errorMsg = 'No se pudo cargar Stripe.';
			return false;
		}
		embedMount.innerHTML = '';
		const checkout = await stripe.createEmbeddedCheckoutPage({
			fetchClientSecret: async () => clientSecret
		});
		checkout.mount(embedMount);
		embedActive = true;
		return true;
	}

	async function pay() {
		if (data.alreadyPaid) return;
		if (!(data.amount > 0)) {
			errorMsg = 'Importe no disponible para esta solicitud.';
			return;
		}
		loading = true;
		message = null;
		errorMsg = null;
		try {
			const result = await startPayment({
				solicitudId: data.solicitud.id,
				description: data.description,
				accessToken: data.accessToken
			});
			if (!result.ok) {
				errorMsg = result.error;
				return;
			}
			if (result.mode === 'stripe_embedded' && result.clientSecret) {
				const ok = await mountStripeEmbedded(result.clientSecret);
				if (!ok && result.url) {
					window.location.href = result.url;
				}
				return;
			}
			if (result.mode === 'stripe_redirect' && result.url) {
				window.location.href = result.url;
				return;
			}
			if (result.mode === 'redirect') {
				postToRedsys(result.redsys);
				return;
			}
			if (result.mode === 'pending_credentials') {
				message =
					result.message ||
					'Tu solicitud queda registrada como pendiente de pago hasta activar la pasarela.';
			}
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (data.gatewayProvider === 'stripe' && data.gatewayReady && !data.alreadyPaid) {
			pay();
		}
	});
</script>

<SeoHead
	title="Pasarela de pago"
	description="Pago seguro de tu trámite."
	path={`/pago/${data.solicitud.id}`}
	robots="noindex,nofollow"
/>

<section class="section">
	<div class="wrap layout">
		{#if data.alreadyPaid}
			<div class="card done">
				<p class="paid">Esta solicitud ya figura como pagada o finalizada.</p>
				<p class="ref">Referencia: <code>{data.solicitud.id}</code></p>
				<button type="button" class="btn" onclick={() => goto(`/cuenta/tramites/${data.solicitud.id}`)}>
					Ver en mi área
				</button>
			</div>
		{:else}
			<PaymentGatewayPanel
				total={data.amount}
				lines={data.lines}
				gatewayReady={data.gatewayReady}
				provider={data.gatewayProvider as 'stripe' | 'redsys' | null}
				tipoLabel={data.solicitud.tipoLabel}
				solicitudId={data.solicitud.id}
				{loading}
				message={message}
				error={errorMsg}
				hidePayButton={embedActive}
				onPay={pay}
			>
				{#snippet embed()}
					<div class="embed" bind:this={embedMount}></div>
				{/snippet}
			</PaymentGatewayPanel>
		{/if}
	</div>
</section>

<style>
	.layout {
		max-width: 560px;
		margin: 0 auto;
		padding-top: 32px;
		padding-bottom: 64px;
	}
	.card.done {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 14px;
		padding: 24px 22px;
		text-align: center;
	}
	.paid {
		background: #e8f5ee;
		color: #0f5132;
		padding: 12px 14px;
		border-radius: 8px;
		margin-bottom: 14px;
	}
	.ref {
		font-size: 0.85rem;
		color: #5a6b7d;
		margin-bottom: 16px;
	}
	.ref code {
		font-size: 0.8rem;
	}
	.btn {
		display: inline-flex;
		padding: 10px 16px;
		background: #00c6d1;
		color: #003050;
		font-weight: 800;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		font: inherit;
	}
	.embed {
		min-height: 120px;
	}
</style>
