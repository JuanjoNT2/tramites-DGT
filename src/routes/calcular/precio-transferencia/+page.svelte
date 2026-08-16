<script lang="ts">
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import PriceSidebar from '$lib/components/ui/PriceSidebar.svelte';
	import VehicleModelPicker from '$lib/components/VehicleModelPicker.svelte';
	import MotoModelPicker from '$lib/components/MotoModelPicker.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { ccaaList } from '$lib/data/vehicles';
	import type { PriceBreakdown } from '$lib/utils/pricing';
	import {
		fetchFactorCorreccion,
		buildTransferBreakdown,
		looksLikeDate
	} from '$lib/utils/transfer-price-client';
	import { getStaticSeo } from '$lib/seo/site';
	import { scrollWizardToTop } from '$lib/utils/scroll';
	import { validateDate, validateDateOrder, validateRequired } from '$lib/utils/validators';

	const seo = getStaticSeo('/calcular/precio-transferencia')!;

	const steps = ['Tipo de vehículo', 'Datos del vehículo', 'Operación', 'Resultado'];
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
	let incluirInforme = $state('si');

	let factorCorreccion = $state<number | null>(null);
	let fuenteDepreciacion = $state<string | null>(null);
	let factorLoading = $state(false);
	let factorError = $state<string | null>(null);
	let errors = $state<Record<string, string | null>>({});

	const ccaaOptions = ccaaList.map((c) => ({ value: c.id, label: c.name }));

	const breakdown = $derived.by((): PriceBreakdown | null => {
		if (!ccaaId || !(precioVenta > 0)) return null;
		const needsFactor = looksLikeDate(fechaMatricula.trim());
		if (needsFactor && factorLoading) return null;
		if (needsFactor && factorError) return null;
		try {
			return buildTransferBreakdown({
			precioVenta,
			ccaaId,
			tipoVehiculo,
			incluirInforme: incluirInforme === 'si',
			precioBase: tipoVehiculo === 'coche' ? modeloMeta?.precioBase : null,
			factorCorreccion: needsFactor ? factorCorreccion : null,
			facturaEmpresa: facturaEmpresa === 'si',
			fuenteDepreciacion
			});
		} catch {
			return null;
		}
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

	function validateStep(s: number): Record<string, string | null> {
		const e: Record<string, string | null> = {};
		if (s === 2) {
			if (tipoVehiculo === 'coche') {
				e.marca = validateRequired(marcaId, 'La marca');
				e.combustible = validateRequired(combustibleId, 'El combustible');
				e.modelo = validateRequired(modeloId, 'El modelo');
			} else {
				e.marca = validateRequired(marcaMotoId, 'La marca');
			}
			e.fechaMatricula = validateDate(fechaMatricula, {
				label: 'La fecha de primera matrícula',
				notFuture: true
			});
		}
		if (s === 3) {
			e.ccaaId = validateRequired(ccaaId, 'La comunidad autónoma');
			if (!(Number(precioVenta) > 0)) e.precioVenta = 'Indica un precio de venta mayor que 0';
			e.fechaVenta = validateDate(fechaVenta, {
				label: 'La fecha de venta',
				notFuture: true
			});
			const order = validateDateOrder(fechaMatricula, fechaVenta);
			if (order) e.fechaVenta = order;
		}
		return e;
	}

	function next() {
		const stepErrors = validateStep(step);
		errors = stepErrors;
		if (Object.values(stepErrors).some(Boolean)) return;
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
			<h1>Calcula el precio de una transferencia</h1>

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
						errors={{
							marca: errors.marca,
							combustible: errors.combustible,
							modelo: errors.modelo
						}}
					/>
				{:else}
					<MotoModelPicker
						bind:marcaId={marcaMotoId}
						bind:marcaNombre={marcaMotoNombre}
						bind:modeloId={modeloMotoId}
						bind:modeloNombre={modeloMotoNombre}
						bind:cilindrada={cilindradaMoto}
						errors={{ marca: errors.marca }}
					/>
				{/if}
				<FormField
					label="Fecha primera matrícula"
					hint="Formato: dd/mm/aaaa"
					error={errors.fechaMatricula}
					required
				>
					<input type="text" bind:value={fechaMatricula} placeholder="15/03/2018" />
				</FormField>
			{:else if step === 3}
				<FormField
					label="Comunidad Autónoma del comprador"
					error={errors.ccaaId}
					required
				>
					<SearchSelect options={ccaaOptions} bind:value={ccaaId} placeholder="Buscar CCAA…" />
				</FormField>
				<FormField label="Precio de compraventa (€)" error={errors.precioVenta} required>
					<input type="number" bind:value={precioVenta} min="0" step="100" />
				</FormField>
				<FormField label="Fecha de venta" error={errors.fechaVenta} required>
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
				<FormField label="¿Incluir informe DGT del vehículo?">
					<RadioCards
						name="informe"
						bind:value={incluirInforme}
						options={[
							{ value: 'si', label: 'Sí, quiero informe' },
							{ value: 'no', label: 'No necesito informe' }
						]}
					/>
				</FormField>
			{:else}
				<div class="result">
					<p class="result-amount">
						{breakdown ? `${breakdown.total.toLocaleString('es-ES')} €` : '—'}
					</p>
					<p class="sub">Presupuesto estimado de transferencia</p>
					{#if tipoVehiculo === 'coche' && modeloNombre}
						<p class="picked">{marcaNombre} · {modeloNombre}</p>
					{:else if tipoVehiculo === 'moto' && (marcaMotoNombre || modeloMotoNombre)}
						<p class="picked">
							{[marcaMotoNombre, modeloMotoNombre, cilindradaMoto ? `${cilindradaMoto} cc` : '']
								.filter(Boolean)
								.join(' · ')}
						</p>
					{/if}
					<a class="btn big" href="/tramitar/transferencia">Tramitar ahora</a>
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
		<PriceSidebar {breakdown} loading={factorLoading} error={factorError} />
	</div>
</section>

<style>
	.wizard-scroll-root {
		scroll-margin-top: 88px;
	}
	.layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 24px;
		align-items: start;
	}

	.pad {
		padding: 32px;
	}

	h1 {
		font-size: 26px;
		font-weight: 800;
		margin-bottom: 28px;
		letter-spacing: -0.02em;
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

	.picked {
		font-size: 14px;
		color: var(--text2);
		margin: 0 0 20px;
		padding: 0 12px;
	}

	.result .btn {
		margin: 6px;
	}

	.result a.btn:not(.ghost) {
		background: var(--primary);
		color: #fff;
	}

	.result a.btn:not(.ghost):hover {
		background: var(--primary-hover);
		color: #fff;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
