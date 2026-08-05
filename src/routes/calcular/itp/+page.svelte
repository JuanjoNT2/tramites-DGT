<script lang="ts">
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import VehicleModelPicker from '$lib/components/VehicleModelPicker.svelte';
	import MotoModelPicker from '$lib/components/MotoModelPicker.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { ccaaList } from '$lib/data/vehicles';
	import { formatEur, type PriceBreakdown } from '$lib/utils/pricing';
	import {
		fetchFactorCorreccion,
		buildTransferBreakdown,
		looksLikeDate
	} from '$lib/utils/transfer-price-client';
	import { getStaticSeo } from '$lib/seo/site';
	import { scrollWizardToTop } from '$lib/utils/scroll';

	const seo = getStaticSeo('/calcular/itp')!;

	const steps = ['Tipo', 'Vehículo y fechas', 'Operación', 'Resultado'];
	let step = $state(1);
	let wizardRoot: HTMLElement | undefined = $state();

	let tipoVehiculo = $state<'coche' | 'moto'>('coche');
	let marcaId = $state('');
	let marcaNombre = $state('');
	let combustibleId = $state('');
	let combustibleNombre = $state('');
	let modeloId = $state('');
	let modeloNombre = $state('');
	let modeloMeta = $state<{
		id: string;
		label: string;
		cilindrada: string;
		cilindros: string;
		combustible: string;
		potenciaKw: string;
		potenciaCv: string;
		potenciaCvf: string;
		precioBase: string;
		categoria: string;
	} | null>(null);
	let marcaMotoId = $state('');
	let marcaMotoNombre = $state('');
	let modeloMotoId = $state('');
	let modeloMotoNombre = $state('');
	let cilindradaMoto = $state('');
	let fechaMatricula = $state('');
	let ccaaId = $state('');
	let precioVenta = $state(8000);
	let fechaVenta = $state('');
	let facturaEmpresa = $state('no');
	let valorVenalManual = $state('');

	let factorCorreccion = $state<number | null>(null);
	let fuenteDepreciacion = $state<string | null>(null);
	let factorLoading = $state(false);
	let factorError = $state<string | null>(null);

	const ccaaOptions = ccaaList.map((c) => ({ value: c.id, label: c.name }));

	const breakdown = $derived.by((): PriceBreakdown | null => {
		if (!ccaaId || !(precioVenta > 0)) return null;
		const needsFactor = looksLikeDate(fechaMatricula.trim());
		if (needsFactor && factorLoading) return null;
		if (needsFactor && factorError) return null;

		const manual = Number(String(valorVenalManual).replace(',', '.'));
		const useManual = Number.isFinite(manual) && manual > 0;
		const precioBase =
			tipoVehiculo === 'coche'
				? modeloMeta?.precioBase
				: useManual
					? manual
					: null;
		// Valor manual ya es venal: no aplicar de nuevo el factor Anexo IV.
		const factor =
			tipoVehiculo === 'moto' && useManual
				? 100
				: needsFactor
					? factorCorreccion
					: null;

		return buildTransferBreakdown({
			precioVenta,
			ccaaId,
			tipoVehiculo,
			incluirInforme: false,
			precioBase,
			factorCorreccion: factor,
			facturaEmpresa: facturaEmpresa === 'si',
			fuenteDepreciacion
		});
	});

	$effect(() => {
		const fm = fechaMatricula.trim();
		const fv = fechaVenta.trim();
		if (!fm || !looksLikeDate(fm) || (fv && !looksLikeDate(fv))) {
			factorCorreccion = null;
			fuenteDepreciacion = null;
			factorError = null;
			factorLoading = false;
			return;
		}

		let cancelled = false;
		factorLoading = true;
		factorError = null;

		const t = setTimeout(() => {
			fetchFactorCorreccion(fm, fv || null)
				.then((r) => {
					if (cancelled) return;
					factorCorreccion = r.factor;
					fuenteDepreciacion = r.fuente;
					factorError = null;
				})
				.catch((e) => {
					if (cancelled) return;
					factorCorreccion = null;
					fuenteDepreciacion = null;
					factorError = e instanceof Error ? e.message : 'Error de depreciación oficial';
				})
				.finally(() => {
					if (!cancelled) factorLoading = false;
				});
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	});

	function next() {
		if (step < 4) {
			step++;
			void scrollWizardToTop(wizardRoot);
		}
	}
	function prev() {
		if (step > 1) {
			step--;
			void scrollWizardToTop(wizardRoot);
		}
	}
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section wizard-scroll-root" bind:this={wizardRoot}>
	<div class="wrap layout">
		<div class="main card pad">
			<StepProgress current={step} total={4} labels={steps} />
			<h1>Calculadora de ITP</h1>
			<p class="lead">
				Estima el Impuesto de Transmisiones Patrimoniales según tu comunidad autónoma, el precio de
				venta y el valor venal fiscal.
			</p>

			{#if step === 1}
				<FormField label="¿Qué tipo de vehículo es?" required>
					<RadioCards
						name="tipo"
						bind:value={tipoVehiculo}
						options={[
							{ value: 'coche', label: 'Coche', desc: 'Turismo, SUV, furgoneta…' },
							{ value: 'moto', label: 'Moto / sin carnet', desc: 'Motocicleta o ciclomotor' }
						]}
					/>
				</FormField>
			{:else if step === 2}
				{#if tipoVehiculo === 'coche'}
					<VehicleModelPicker
						bind:marcaId
						bind:marcaNombre
						bind:combustibleId
						bind:combustibleNombre
						bind:modeloId
						bind:modeloNombre
						bind:modeloMeta
					/>
				{:else}
					<MotoModelPicker
						bind:marcaId={marcaMotoId}
						bind:marcaNombre={marcaMotoNombre}
						bind:modeloId={modeloMotoId}
						bind:modeloNombre={modeloMotoNombre}
						bind:cilindrada={cilindradaMoto}
					/>
					<FormField
						label="Valor venal (€) — opcional"
						hint="Si conoces el valor fiscal BOE, introdúcelo para afinar el ITP"
					>
						<input type="number" bind:value={valorVenalManual} min="0" step="50" placeholder="4500" />
					</FormField>
				{/if}
				<FormField label="Fecha primera matrícula" hint="Formato: dd/mm/aaaa" required>
					<input type="text" bind:value={fechaMatricula} placeholder="15/03/2018" />
				</FormField>
			{:else if step === 3}
				<FormField label="Comunidad Autónoma del comprador" required>
					<SearchSelect options={ccaaOptions} bind:value={ccaaId} placeholder="Buscar CCAA…" />
				</FormField>
				<FormField label="Precio de compraventa (€)" required>
					<input type="number" bind:value={precioVenta} min="0" step="100" />
				</FormField>
				<FormField label="Fecha de venta" required>
					<DateInput bind:value={fechaVenta} />
				</FormField>
				<FormField label="¿Vendedor empresa/autónomo con factura?">
					<RadioCards
						name="factura"
						bind:value={facturaEmpresa}
						options={[
							{ value: 'si', label: 'Sí' },
							{ value: 'no', label: 'No' }
						]}
					/>
				</FormField>
			{:else}
				<div class="result">
					{#if factorLoading}
						<p class="sub">Obteniendo depreciación oficial…</p>
					{:else if factorError}
						<p class="err">{factorError}</p>
					{:else if breakdown}
						<p class="result-amount">{formatEur(breakdown.itpAmount)}</p>
						<p class="sub">ITP estimado</p>
						<ul class="detail">
							{#if breakdown.valoracionReal != null}
								<li>
									<span>Valor venal</span>
									<span>{formatEur(breakdown.valoracionReal)}</span>
								</li>
							{/if}
							<li>
								<span>Base imponible</span>
								<span>{formatEur(breakdown.baseImponible)}</span>
							</li>
							<li>
								<span>Tipo ({Math.round(breakdown.itpRate * 100)}%)</span>
								<span>{formatEur(breakdown.itpAmount)}</span>
							</li>
						</ul>
						{#if breakdown.sinValorBoe && !breakdown.facturaEmpresa}
							<p class="note warn">
								Sin valor BOE: el ITP se estima sobre el precio de venta.
							</p>
						{/if}
						{#if breakdown.facturaEmpresa}
							<p class="note">Con factura de empresa/autónomo no aplica ITP.</p>
						{/if}
					{:else}
						<p class="sub">Completa CCAA y precio de venta para ver el ITP.</p>
					{/if}
					<a class="btn big" href="/tramitar/transferencia">Tramitar transferencia</a>
					<a class="btn ghost big" href="/calcular/precio-transferencia">Ver precio completo</a>
					<button type="button" class="btn ghost big" onclick={() => (step = 1)}>Nuevo cálculo</button>
				</div>
			{/if}

			{#if step < 4}
				<div class="nav-btns">
					{#if step > 1}<button type="button" class="btn ghost" onclick={prev}>Anterior</button>{/if}
					<button type="button" class="btn" onclick={next}>
						{step === 3 ? 'Ver resultado' : 'Siguiente'}
					</button>
				</div>
			{/if}
		</div>

		<aside class="sidebar card">
			<h3>Cómo se calcula</h3>
			{#if factorLoading}
				<div class="empty">Obteniendo depreciación…</div>
			{:else if breakdown}
				<div class="total">{formatEur(breakdown.itpAmount)}</div>
				<ul class="lines">
					<li><span>Precio de venta</span><span>{formatEur(breakdown.precioVenta)}</span></li>
					{#if breakdown.valoracionReal != null}
						<li><span>Valor venal</span><span>{formatEur(breakdown.valoracionReal)}</span></li>
					{/if}
					<li><span>Base imponible</span><span>{formatEur(breakdown.baseImponible)}</span></li>
					<li>
						<span>ITP ({Math.round(breakdown.itpRate * 100)}%)</span>
						<span>{formatEur(breakdown.itpAmount)}</span>
					</li>
				</ul>
			{:else}
				<p>
					La base imponible es el mayor entre el precio de compraventa y el valor venal fiscal. El
					tipo depende de la comunidad autónoma del comprador.
				</p>
			{/if}
		</aside>
	</div>
</section>

<style>
	.wizard-scroll-root {
		scroll-margin-top: 88px;
	}
	.layout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 24px;
		align-items: start;
	}
	.pad {
		padding: 32px;
	}
	h1 {
		font-size: 26px;
		font-weight: 800;
		margin-bottom: 8px;
		letter-spacing: -0.02em;
	}
	.lead {
		color: var(--text2);
		margin: 0 0 28px;
		line-height: 1.5;
	}
	.nav-btns {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
	}
	.result {
		text-align: center;
		padding: 24px 0;
	}
	.result-amount {
		font-size: 48px;
		font-weight: 800;
		color: var(--primary);
		line-height: 1.1;
	}
	.sub {
		color: var(--text2);
		margin: 8px 0 12px;
	}
	.err {
		color: #b42318;
	}
	.detail {
		list-style: none;
		max-width: 320px;
		margin: 0 auto 16px;
		text-align: left;
	}
	.detail li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 0;
		border-bottom: 1px solid var(--border);
		font-size: 14px;
		color: var(--text2);
	}
	.detail li span:last-child {
		font-weight: 700;
		color: var(--ink);
	}
	.note {
		font-size: 13px;
		color: var(--text3);
		margin: 0 0 12px;
		line-height: 1.45;
	}
	.note.warn {
		color: #9a6700;
	}
	.result .btn {
		margin: 6px;
	}
	.result a.btn:not(.ghost) {
		background: var(--primary);
		color: #fff;
	}
	.sidebar {
		padding: 24px;
		position: sticky;
		top: 100px;
	}
	.sidebar h3 {
		font-size: 14px;
		font-weight: 700;
		color: var(--text2);
		text-transform: uppercase;
		letter-spacing: 0.4px;
		margin: 0 0 12px;
	}
	.sidebar p {
		font-size: 14px;
		color: var(--text2);
		line-height: 1.5;
		margin: 0;
	}
	.total {
		font-size: 32px;
		font-weight: 800;
		color: var(--primary);
		margin-bottom: 16px;
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
	.lines li span:last-child {
		font-weight: 700;
		color: var(--ink);
		white-space: nowrap;
	}
	.empty {
		font-size: 14px;
		color: var(--text3);
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
