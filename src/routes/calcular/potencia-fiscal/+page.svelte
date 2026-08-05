<script lang="ts">
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import VehicleModelPicker from '$lib/components/VehicleModelPicker.svelte';
	import MotoModelPicker from '$lib/components/MotoModelPicker.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import {
		parsePositiveNumber,
		potenciaFiscalMoto,
		potenciaFiscalTurismo
	} from '$lib/utils/potencia-fiscal';
	import { getStaticSeo } from '$lib/seo/site';
	import { scrollWizardToTop } from '$lib/utils/scroll';

	const seo = getStaticSeo('/calcular/potencia-fiscal')!;

	const steps = ['Método', 'Datos', 'Resultado'];
	let step = $state(1);
	let wizardRoot: HTMLElement | undefined = $state();

	let metodo = $state<'catalogo' | 'manual'>('catalogo');
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

	let cilindradaManual = $state('');
	let cilindrosManual = $state('4');

	const cvfCatalogo = $derived.by(() => {
		if (metodo !== 'catalogo') return null;
		if (tipoVehiculo === 'coche') {
			const fromMeta = parsePositiveNumber(modeloMeta?.potenciaCvf);
			if (fromMeta != null) return fromMeta;
			const cc = parsePositiveNumber(modeloMeta?.cilindrada);
			const n = parsePositiveNumber(modeloMeta?.cilindros);
			if (cc != null && n != null) return potenciaFiscalTurismo(cc, n);
			return null;
		}
		const cc = parsePositiveNumber(cilindradaMoto);
		return cc != null ? potenciaFiscalMoto(cc) : null;
	});

	const cvfManual = $derived.by(() => {
		if (metodo !== 'manual') return null;
		const cc = parsePositiveNumber(cilindradaManual);
		if (cc == null) return null;
		if (tipoVehiculo === 'moto') return potenciaFiscalMoto(cc);
		const n = parsePositiveNumber(cilindrosManual) ?? 4;
		return potenciaFiscalTurismo(cc, n);
	});

	const cvf = $derived(metodo === 'catalogo' ? cvfCatalogo : cvfManual);
	const fuente = $derived(
		metodo === 'catalogo' && tipoVehiculo === 'coche' && parsePositiveNumber(modeloMeta?.potenciaCvf)
			? 'Catálogo oficial del modelo'
			: 'Fórmula reglamentaria (RD 2822/1998)'
	);

	function next() {
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
			<h1>Potencia fiscal</h1>
			<p class="lead">
				Calcula los CV fiscales (CVF) del vehículo. En algunas comunidades autónomas el tipo de ITP
				sube si supera 15 CVF.
			</p>

			{#if step === 1}
				<FormField label="¿Cómo quieres calcularlo?" required>
					<RadioCards
						name="metodo"
						bind:value={metodo}
						options={[
							{
								value: 'catalogo',
								label: 'Por modelo',
								desc: 'Usamos los datos técnicos del catálogo'
							},
							{
								value: 'manual',
								label: 'Manual',
								desc: 'Introduce cilindrada y cilindros'
							}
						]}
					/>
				</FormField>
				<FormField label="Tipo de vehículo" required>
					<RadioCards
						name="tipo"
						bind:value={tipoVehiculo}
						options={[
							{ value: 'coche', label: 'Coche' },
							{ value: 'moto', label: 'Moto' }
						]}
					/>
				</FormField>
			{:else if step === 2}
				{#if metodo === 'catalogo'}
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
					{/if}
				{:else}
					<FormField label="Cilindrada (cc)" required>
						<input type="number" bind:value={cilindradaManual} min="1" step="1" placeholder="1598" />
					</FormField>
					{#if tipoVehiculo === 'coche'}
						<FormField label="Número de cilindros" required>
							<input type="number" bind:value={cilindrosManual} min="1" max="16" step="1" />
						</FormField>
					{/if}
				{/if}
			{:else}
				<div class="result">
					{#if cvf != null}
						<p class="result-amount">{cvf.toLocaleString('es-ES', { maximumFractionDigits: 2 })} CVF</p>
						<p class="sub">Potencia fiscal estimada</p>
						<p class="note">Fuente: {fuente}</p>
						{#if cvf > 15}
							<p class="warn">
								Supera 15 CVF: en varias CCAA puede aplicar un tipo de ITP más alto.
							</p>
						{/if}
					{:else}
						<p class="sub">Faltan datos técnicos para calcular la potencia fiscal.</p>
					{/if}
					{#if metodo === 'catalogo' && tipoVehiculo === 'coche' && modeloNombre}
						<p class="picked">{marcaNombre} · {modeloNombre}</p>
					{/if}
					<a class="btn big" href="/calcular/itp">Calcular ITP</a>
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
			<h3>Fórmula</h3>
			<p>
				Turismos: <strong>PF = 0,08 × n × (D/n)<sup>0,6</sup></strong>, donde D es la cilindrada en
				cc y n el número de cilindros.
			</p>
			<p>Motos: misma base con un cilindro equivalente (0,08 × D<sup>0,6</sup>).</p>
			<p>
				La potencia fiscal figura en la ficha técnica y no coincide con los CV comerciales del
				fabricante.
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
	.picked {
		font-size: 14px;
		color: var(--text2);
		margin: 0 0 20px;
	}
	.note {
		font-size: 13px;
		color: var(--text3);
		margin: 0 0 12px;
	}
	.warn {
		font-size: 14px;
		color: #9a6700;
		background: #fff8e6;
		border: 1px solid #f5e0a3;
		border-radius: 8px;
		padding: 10px 12px;
		margin: 0 auto 16px;
		max-width: 360px;
		line-height: 1.4;
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
