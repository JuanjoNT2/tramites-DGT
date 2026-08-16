<script lang="ts">
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import VehicleModelPicker from '$lib/components/VehicleModelPicker.svelte';
	import MotoModelPicker from '$lib/components/MotoModelPicker.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { computeValorVenal, formatEur, parsePrecioBase } from '$lib/utils/pricing';
	import { fetchFactorCorreccion, looksLikeDate } from '$lib/utils/transfer-price-client';
	import { getStaticSeo } from '$lib/seo/site';
	import { scrollWizardToTop } from '$lib/utils/scroll';
	import { validateDate, validateRequired } from '$lib/utils/validators';

	const seo = getStaticSeo('/calcular/valor-venal')!;

	const steps = ['Tipo de vehículo', 'Datos del vehículo', 'Resultado'];
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
	let fechaVenta = $state('');

	let factorCorreccion = $state<number | null>(null);
	let fuenteDepreciacion = $state<string | null>(null);
	let factorLoading = $state(false);
	let factorError = $state<string | null>(null);
	let errors = $state<Record<string, string | null>>({});

	const precioBase = $derived(
		tipoVehiculo === 'coche' ? parsePrecioBase(modeloMeta?.precioBase) : null
	);
	const valorVenal = $derived(computeValorVenal(precioBase, factorCorreccion));

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
			if (fechaVenta.trim()) {
				e.fechaVenta = validateDate(fechaVenta, {
					label: 'La fecha de la operación',
					notFuture: true
				});
			}
		}
		return e;
	}

	function next() {
		const stepErrors = validateStep(step);
		errors = stepErrors;
		if (Object.values(stepErrors).some(Boolean)) return;
		if (step < 3) {
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
			<StepProgress current={step} total={3} labels={steps} />
			<h1>Valor venal en Hacienda</h1>
			<p class="lead">
				Estima el valor fiscal de referencia (BOE) aplicando el coeficiente de depreciación oficial
				según la antigüedad del vehículo.
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
					<p class="note">
						Las motos no siempre tienen precio medio BOE en el catálogo. Puedes usar la
						<a href="/calcular/itp">calculadora de ITP</a> indicando el valor venal manualmente.
					</p>
				{/if}
				<FormField
					label="Fecha primera matrícula"
					hint="Formato: dd/mm/aaaa"
					error={errors.fechaMatricula}
					required
				>
					<input type="text" bind:value={fechaMatricula} placeholder="15/03/2018" />
				</FormField>
				<FormField
					label="Fecha de la operación (opcional)"
					hint="Si no indicas, se usa hoy"
					error={errors.fechaVenta}
				>
					<DateInput bind:value={fechaVenta} />
				</FormField>
			{:else}
				<div class="result">
					{#if factorLoading}
						<p class="sub">Obteniendo depreciación oficial…</p>
					{:else if factorError}
						<p class="err">{factorError}</p>
					{:else if valorVenal != null}
						<p class="result-amount">{formatEur(valorVenal)}</p>
						<p class="sub">Valor venal estimado (Hacienda)</p>
						<ul class="detail">
							{#if precioBase != null}
								<li><span>Precio medio BOE</span><span>{formatEur(precioBase)}</span></li>
							{/if}
							{#if factorCorreccion != null}
								<li><span>Factor de corrección</span><span>{factorCorreccion} %</span></li>
							{/if}
						</ul>
						{#if fuenteDepreciacion}
							<p class="note">Fuente: precios medios BOE · {fuenteDepreciacion}</p>
						{/if}
					{:else}
						<p class="sub">
							No hay valor BOE para el modelo seleccionado o falta la fecha de matrícula. Elige un
							turismo del catálogo o introduce el valor en la calculadora de ITP.
						</p>
					{/if}
					{#if tipoVehiculo === 'coche' && modeloNombre}
						<p class="picked">{marcaNombre} · {modeloNombre}</p>
					{:else if tipoVehiculo === 'moto' && (marcaMotoNombre || modeloMotoNombre)}
						<p class="picked">
							{[marcaMotoNombre, modeloMotoNombre, cilindradaMoto ? `${cilindradaMoto} cc` : '']
								.filter(Boolean)
								.join(' · ')}
						</p>
					{/if}
					<a class="btn big" href="/calcular/itp">Calcular ITP</a>
					<a class="btn ghost big" href="/tramitar/transferencia">Tramitar transferencia</a>
					<button type="button" class="btn ghost big" onclick={() => (step = 1)}>Nuevo cálculo</button>
				</div>
			{/if}

			{#if step < 3}
				<div class="nav-btns">
					{#if step > 1}<button type="button" class="btn ghost" onclick={prev}>Anterior</button>{/if}
					<button type="button" class="btn" onclick={next}>
						{step === 2 ? 'Ver resultado' : 'Siguiente'}
					</button>
				</div>
			{/if}
		</div>

		<aside class="sidebar card">
			<h3>¿Qué es el valor venal?</h3>
			<p>
				Es el valor fiscal de referencia que Hacienda asigna al vehículo según las tablas del BOE y
				la antigüedad. Sirve como base mínima para liquidar el ITP en una compraventa entre
				particulares.
			</p>
			<p>
				Si el precio de venta es inferior al valor venal, el impuesto se calcula sobre el valor
				venal.
			</p>
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
		margin: 8px 0 16px;
	}
	.picked {
		font-size: 14px;
		color: var(--text2);
		margin: 0 0 20px;
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
		line-height: 1.45;
		margin: 12px 0;
	}
	.note a {
		color: var(--accent);
		font-weight: 600;
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
		margin: 0 0 12px;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
