<script lang="ts">
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import PaymentGatewayPanel from '$lib/components/pago/PaymentGatewayPanel.svelte';
	import { postToRedsys, startPayment } from '$lib/pago/client';
	import { formatEur } from '$lib/utils/pricing';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading = $state(false);
	let message = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);

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
			if (result.mode === 'redirect') {
				postToRedsys(result.redsys);
				return;
			}
			message =
				result.message ||
				'Tu solicitud queda registrada como pendiente de pago hasta activar la pasarela.';
		} finally {
			loading = false;
		}
	}
</script>

<SeoHead
	title="Pasarela de pago"
	description="Resumen de tu trámite y pago seguro."
	path={`/pago/${data.solicitud.id}`}
	robots="noindex,nofollow"
/>

<section class="section">
	<div class="wrap layout">
		<div class="card summary">
			<p class="eyebrow">Trámite registrado</p>
			<h1>Resumen antes del pago</h1>
			<p class="lead">
				Revisa los datos de tu solicitud <strong>{data.solicitud.tipoLabel}</strong> antes de
				continuar a la pasarela.
			</p>

			{#if data.alreadyPaid}
				<p class="paid">Esta solicitud ya figura como pagada o finalizada.</p>
				<button type="button" class="btn" onclick={() => goto(`/cuenta/tramites/${data.solicitud.id}`)}>
					Ver en mi área
				</button>
			{:else}
				<dl class="grid">
					<div>
						<dt>Referencia</dt>
						<dd class="mono">{data.solicitud.id}</dd>
					</div>
					<div>
						<dt>Estado</dt>
						<dd>{data.solicitud.statusLabel}</dd>
					</div>
					{#each data.summary as row}
						<div>
							<dt>{row.label}</dt>
							<dd>{row.value}</dd>
						</div>
					{/each}
					<div>
						<dt>Importe</dt>
						<dd class="total">{data.amount > 0 ? formatEur(data.amount) : '—'}</dd>
					</div>
				</dl>
			{/if}
		</div>

		{#if !data.alreadyPaid}
			<PaymentGatewayPanel
				total={data.amount}
				lines={data.lines}
				gatewayReady={data.gatewayReady}
				{loading}
				message={message}
				error={errorMsg}
				onPay={pay}
			/>
		{/if}
	</div>
</section>

<style>
	.layout {
		display: grid;
		grid-template-columns: 1.2fr 0.9fr;
		gap: 24px;
		align-items: start;
		padding-top: 32px;
		padding-bottom: 64px;
	}
	.card.summary {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 14px;
		padding: 24px 22px;
	}
	.eyebrow {
		margin: 0 0 6px;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #00a8b3;
	}
	h1 {
		margin: 0 0 10px;
		font-size: 1.55rem;
		color: #003050;
	}
	.lead {
		margin: 0 0 20px;
		color: #5a6b7d;
		line-height: 1.45;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 14px 18px;
		margin: 0;
	}
	dt {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #5a6b7d;
	}
	dd {
		margin: 4px 0 0;
		color: #1a2b3c;
		font-weight: 600;
		word-break: break-word;
	}
	.mono {
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
		font-weight: 500;
	}
	.total {
		color: #00a8b3;
		font-size: 1.15rem;
		font-weight: 800;
	}
	.paid {
		background: #e8f5ee;
		color: #0f5132;
		padding: 12px 14px;
		border-radius: 8px;
		margin-bottom: 14px;
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
	@media (max-width: 860px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
