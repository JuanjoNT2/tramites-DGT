<script lang="ts">
	import type { PriceBreakdown } from '$lib/utils/pricing';
	import { formatEur } from '$lib/utils/pricing';

	let {
		breakdown,
		loading = false,
		error = null
	}: {
		breakdown: PriceBreakdown | null;
		loading?: boolean;
		error?: string | null;
	} = $props();
</script>

<aside class="sidebar card">
	<h3>Presupuesto estimado</h3>
	{#if loading}
		<div class="empty">Obteniendo depreciación oficial…</div>
	{:else if error}
		<div class="err-box">{error}</div>
	{:else if breakdown}
		<div class="total">{formatEur(breakdown.total)}</div>

		{#if !breakdown.facturaEmpresa}
			<div class="block">
				<h4>Cálculo ITP</h4>
				<ul class="lines">
					{#if breakdown.valorSegunPrecioVenta != null}
						<li>
							<span>Valor según precio de venta (BOE)</span>
							<span>{formatEur(breakdown.valorSegunPrecioVenta)}</span>
						</li>
					{/if}
					{#if breakdown.factorCorreccion != null}
						<li>
							<span>Factor de corrección</span>
							<span>{breakdown.factorCorreccion} %</span>
						</li>
					{/if}
					{#if breakdown.valoracionReal != null}
						<li>
							<span>Valoración real</span>
							<span>{formatEur(breakdown.valoracionReal)}</span>
						</li>
					{/if}
					<li>
						<span>Base imponible</span>
						<span>{formatEur(breakdown.baseImponible)}</span>
					</li>
					<li>
						<span>ITP ({Math.round(breakdown.itpRate * 100)}%)</span>
						<span>{formatEur(breakdown.itpAmount)}</span>
					</li>
				</ul>
				{#if breakdown.sinValorBoe}
					<p class="note warn">
						Sin valor BOE del modelo o sin depreciación oficial: el ITP se estima sobre el precio de
						venta.
					</p>
				{/if}
			</div>
		{:else}
			<div class="block">
				<ul class="lines">
					<li><span>ITP</span><span>{formatEur(0)}</span></li>
				</ul>
				<p class="note">Venta con factura de empresa/autónomo: no aplica ITP.</p>
			</div>
		{/if}

		<div class="block">
			<h4>Costes de tramitación</h4>
			<ul class="lines">
				{#if breakdown.informeDgt > 0}
					<li><span>Informe DGT</span><span>{formatEur(breakdown.informeDgt)}</span></li>
				{/if}
				<li><span>Tramitación</span><span>{formatEur(breakdown.tramitacion)}</span></li>
				<li class="total-line">
					<span>Total</span>
					<span>{formatEur(breakdown.total)}</span>
				</li>
			</ul>
		</div>

		{#if breakdown.fuente?.depreciacion || breakdown.fuente?.precios}
			<p class="note">
				Fuentes oficiales:
				{#if breakdown.fuente?.precios}{breakdown.fuente.precios}.{/if}
				{#if breakdown.fuente?.depreciacion}
					{' '}{breakdown.fuente.depreciacion}.{/if}
			</p>
		{/if}
	{:else}
		<div class="empty">Completa los datos para ver el presupuesto</div>
	{/if}
</aside>

<style>
	.sidebar {
		padding: 24px;
		position: sticky;
		top: 100px;
	}

	h3 {
		font-size: 14px;
		font-weight: 700;
		color: var(--text2);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 12px;
	}

	h4 {
		font-size: 12px;
		font-weight: 700;
		color: var(--text3);
		text-transform: uppercase;
		letter-spacing: 0.4px;
		margin: 0 0 10px;
	}

	.total {
		font-size: 36px;
		font-weight: 800;
		color: var(--primary);
		letter-spacing: -0.03em;
		margin-bottom: 20px;
	}

	.block {
		margin-bottom: 18px;
	}

	.lines {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.lines li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 14px;
		color: var(--text2);
		padding-bottom: 10px;
		border-bottom: 1px solid var(--border);
	}

	.lines li span:first-child {
		flex: 1;
	}

	.lines li span:last-child {
		font-weight: 700;
		color: var(--ink);
		white-space: nowrap;
	}

	.total-line span {
		font-weight: 800 !important;
		color: var(--ink) !important;
	}

	.note {
		font-size: 11px;
		color: var(--text3);
		margin-top: 12px;
		line-height: 1.45;
	}

	.note.warn {
		color: #9a6700;
	}

	.err-box {
		font-size: 14px;
		color: #b42318;
		background: #fef3f2;
		border: 1px solid #fecdca;
		border-radius: 8px;
		padding: 12px;
		line-height: 1.4;
	}

	.empty {
		font-size: 15px;
		color: var(--text3);
		padding: 20px 0;
		text-align: center;
	}
</style>
