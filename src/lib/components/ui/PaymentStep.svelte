<script lang="ts">
	import { formatEur } from '$lib/utils/pricing';

	let {
		total,
		lines = [],
		loading = false,
		disabled = false,
		onPay
	}: {
		total: number;
		lines?: { label: string; amount: number }[];
		loading?: boolean;
		disabled?: boolean;
		onPay: () => void | Promise<void>;
	} = $props();
</script>

<div class="pay">
	<div class="pay-total">{formatEur(total)}</div>
	<p class="lead">Pago seguro con tarjeta (pasarela Redsys)</p>
	{#if lines.length}
		<ul class="lines">
			{#each lines as line}
				<li><span>{line.label}</span><span>{formatEur(line.amount)}</span></li>
			{/each}
		</ul>
	{/if}
	<p class="note">
		Al confirmar serás redirigido a la pasarela bancaria. Si la pasarela aún no está activada, tu
		solicitud quedará registrada como pendiente de pago.
	</p>
	<button type="button" class="btn pay-btn" onclick={onPay} disabled={disabled || loading}>
		{loading ? 'Procesando…' : 'Confirmar y pagar'}
	</button>
</div>

<style>
	.pay {
		text-align: center;
		padding: 8px 0 4px;
	}
	.pay-total {
		font-size: 40px;
		font-weight: 800;
		color: var(--primary);
		letter-spacing: -0.03em;
		margin-bottom: 8px;
	}
	.lead {
		font-size: 15px;
		color: var(--text2);
		margin-bottom: 16px;
	}
	.lines {
		list-style: none;
		text-align: left;
		max-width: 360px;
		margin: 0 auto 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.lines li {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		color: var(--text2);
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border);
	}
	.lines li span:last-child {
		font-weight: 700;
		color: var(--ink);
	}
	.note {
		font-size: 12px;
		color: var(--text3);
		line-height: 1.45;
		max-width: 420px;
		margin: 0 auto 20px;
	}
	.pay-btn {
		min-width: 220px;
	}
</style>
