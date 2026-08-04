<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const maxCount = $derived(Math.max(1, ...data.report.byTipo.map((r) => r.count)));
</script>

<header class="head">
	<div>
		<h1>Informe mensual</h1>
		<p class="sub">
			Trámites realizados con éxito (estado <strong>Realizada</strong>) en el mes seleccionado.
		</p>
	</div>
	<form class="month-form" method="GET">
		<label>
			Mes
			<select name="mes" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				{#each data.monthOptions as opt}
					<option value={opt.value} selected={opt.value === data.report.monthKey}>{opt.label}</option>
				{/each}
			</select>
		</label>
	</form>
</header>

{#if data.report.error}
	<p class="err" role="alert">{data.report.error}</p>
{/if}

<section class="kpi" aria-label="Resumen del mes">
	<div class="kpi-card total">
		<span class="kpi-label">Total realizados con éxito</span>
		<strong class="kpi-value">{data.report.total}</strong>
		<span class="kpi-month">{data.report.label}</span>
	</div>
</section>

<section class="report" aria-label="Desglose por tipo de trámite">
	<h2>Por tipo de trámite</h2>
	{#if data.report.byTipo.every((r) => r.count === 0)}
		<p class="empty">No hay trámites realizados con éxito en {data.report.label.toLowerCase()}.</p>
	{:else}
		<ul class="bars">
			{#each data.report.byTipo as row}
				<li>
					<div class="row-top">
						<span class="tipo">{row.label}</span>
						<strong class="n">{row.count}</strong>
					</div>
					<div class="bar" aria-hidden="true">
						<span style="width: {(row.count / maxCount) * 100}%"></span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<p class="hint">
	Como gestor no puedes iniciar trámites de ciudadano desde la web pública. Usa este panel para
	consultar el volumen mensual.
</p>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 24px;
	}
	h1 {
		margin: 0 0 6px;
		color: #003050;
		font-size: 1.5rem;
	}
	h2 {
		margin: 0 0 14px;
		color: #003050;
		font-size: 1.1rem;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.9rem;
		max-width: 40rem;
	}
	.month-form label {
		display: grid;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 700;
		color: #5a6b7d;
	}
	.month-form select {
		padding: 8px 12px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		min-width: 200px;
		background: #fff;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
	}
	.kpi {
		margin-bottom: 24px;
	}
	.kpi-card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 20px 22px;
		display: grid;
		gap: 4px;
		max-width: 320px;
	}
	.kpi-card.total {
		border-left: 4px solid #00c6d1;
	}
	.kpi-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: #5a6b7d;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.kpi-value {
		font-size: 2.4rem;
		line-height: 1.1;
		color: #003050;
	}
	.kpi-month {
		font-size: 0.9rem;
		color: #5a6b7d;
	}
	.report {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 20px;
	}
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 14px;
	}
	.row-top {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 6px;
		font-size: 0.92rem;
	}
	.tipo {
		color: #1a2b3c;
		font-weight: 600;
	}
	.n {
		color: #003050;
	}
	.bar {
		height: 10px;
		background: #e8eef3;
		border-radius: 999px;
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #00a8b3, #00c6d1);
		border-radius: 999px;
		min-width: 0;
	}
	.empty {
		margin: 0;
		color: #5a6b7d;
	}
	.hint {
		margin: 20px 0 0;
		font-size: 0.85rem;
		color: #5a6b7d;
		max-width: 40rem;
	}
</style>
