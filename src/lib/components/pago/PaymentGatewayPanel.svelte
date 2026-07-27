<script lang="ts">
	import { formatEur } from '$lib/utils/pricing';

	let {
		total,
		lines = [],
		loading = false,
		gatewayReady = false,
		provider = null,
		message = null,
		error = null,
		onPay
	}: {
		total: number;
		lines?: { label: string; amount: number }[];
		loading?: boolean;
		gatewayReady?: boolean;
		provider?: 'stripe' | 'redsys' | null;
		message?: string | null;
		error?: string | null;
		onPay: () => void | Promise<void>;
	} = $props();

	const providerLabel = $derived(
		provider === 'stripe' ? 'Stripe' : provider === 'redsys' ? 'Redsys' : null
	);
</script>

<div class="gateway" data-payment-gateway>
	<div class="head">
		<h2>Pasarela de pago</h2>
		<p class="amount">{formatEur(total)}</p>
	</div>

	{#if lines.length}
		<ul class="lines">
			{#each lines as line}
				<li><span>{line.label}</span><span>{formatEur(line.amount)}</span></li>
			{/each}
		</ul>
	{/if}

	<div class="slot" id="payment-gateway-slot" aria-live="polite">
		{#if gatewayReady}
			<p class="ready">
				{#if providerLabel}
					Pago seguro con {providerLabel}. Serás redirigido a la pasarela para introducir tu tarjeta.
				{:else}
					Conexión con la pasarela lista.
				{/if}
			</p>
			<button type="button" class="btn pay" onclick={onPay} disabled={loading}>
				{loading ? 'Conectando con la pasarela…' : 'Pagar ahora'}
			</button>
		{:else}
			<div class="placeholder">
				<p class="badge">Pasarela pendiente de activar</p>
				<p>
					Configura las claves de Stripe en el servidor para activar el cobro. Mientras tanto puedes
					registrar el trámite como pendiente de pago.
				</p>
				<button type="button" class="btn pay" onclick={onPay} disabled={loading}>
					{loading ? 'Registrando…' : 'Continuar (pago pendiente de activar)'}
				</button>
			</div>
		{/if}
	</div>

	{#if message}
		<p class="msg ok" role="status">{message}</p>
	{/if}
	{#if error}
		<p class="msg err" role="alert">{error}</p>
	{/if}

	<p class="note">
		Pago seguro. No almacenamos los datos de tu tarjeta; los gestiona la pasarela
		{providerLabel ? `(${providerLabel})` : ''}.
	</p>
</div>

<style>
	.gateway {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 14px;
		padding: 22px 20px;
	}
	.head {
		text-align: center;
		margin-bottom: 16px;
	}
	h2 {
		margin: 0 0 8px;
		font-size: 1.15rem;
		color: #003050;
	}
	.amount {
		margin: 0;
		font-size: 2rem;
		font-weight: 800;
		color: #00a8b3;
		letter-spacing: -0.03em;
	}
	.lines {
		list-style: none;
		margin: 0 0 18px;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.lines li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 0.9rem;
		color: #5a6b7d;
		padding-bottom: 8px;
		border-bottom: 1px solid #e8eef3;
	}
	.lines li span:last-child {
		font-weight: 700;
		color: #1a2b3c;
	}
	.slot {
		border: 1px dashed #9fd8e8;
		border-radius: 12px;
		padding: 18px 16px;
		background: #f4fbfc;
		margin-bottom: 14px;
	}
	.placeholder {
		text-align: center;
	}
	.badge {
		display: inline-block;
		margin: 0 0 10px;
		padding: 4px 10px;
		border-radius: 999px;
		background: #fff3cd;
		color: #856404;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.placeholder p {
		margin: 0 0 14px;
		font-size: 0.9rem;
		color: #5a6b7d;
		line-height: 1.45;
	}
	.ready {
		text-align: center;
		margin: 0 0 14px;
		font-size: 0.9rem;
		color: #0f5132;
		font-weight: 600;
	}
	.btn.pay {
		width: 100%;
		padding: 12px 16px;
		border: none;
		border-radius: 10px;
		background: #00c6d1;
		color: #003050;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}
	.btn.pay:disabled {
		opacity: 0.65;
		cursor: wait;
	}
	.msg {
		margin: 0 0 10px;
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 0.9rem;
	}
	.msg.ok {
		background: #e8f5ee;
		color: #0f5132;
	}
	.msg.err {
		background: #fde8e8;
		color: #9b1c1c;
	}
	.note {
		margin: 0;
		font-size: 0.78rem;
		color: #5a6b7d;
		line-height: 1.4;
		text-align: center;
	}
</style>
