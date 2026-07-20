<script lang="ts">
	import { onMount } from 'svelte';
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import PriceSidebar from '$lib/components/ui/PriceSidebar.svelte';
	import VehicleModelPicker from '$lib/components/VehicleModelPicker.svelte';
	import MotoModelPicker from '$lib/components/MotoModelPicker.svelte';
	import { ccaaList } from '$lib/data/vehicles';
	import { calculateTransferPrice } from '$lib/utils/pricing';
	import {
		validateEmail,
		validateMatricula,
		validateBastidor,
		validateNifNie,
		validatePhone,
		validateRequired
	} from '$lib/utils/validators';
	import { funnel, initAnalytics } from '$lib/analytics';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/transferencia')!;
	const STORAGE_KEY = 'dgt-transfer-wizard';
	const stepLabels = [
		'Tipo de vehículo',
		'Identificación',
		'Datos técnicos',
		'Operación',
		'Tu rol y datos',
		'La otra parte',
		'Dirección',
		'Documentos',
		'Resumen y pago'
	];

	let step = $state(1);
	let errors = $state<Record<string, string | null>>({});
	let submitting = $state(false);
	let done = $state(false);
	let orderId = $state('');

	// Form state
	let tipoVehiculo = $state<'coche' | 'moto'>('coche');
	let matricula = $state('');
	let bastidor = $state('');
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
	let rol = $state<'comprador' | 'vendedor'>('comprador');
	let email = $state('');
	let nif = $state('');
	let nombre = $state('');
	let apellido1 = $state('');
	let telefono = $state('');
	let otraParteEmail = $state('');
	let provincia = $state('');
	let municipio = $state('');
	let direccion = $state('');
	let cp = $state('');
	let skipDocs = $state(false);
	let acceptPrivacy = $state(false);

	const ccaaOptions = ccaaList.map((c) => ({ value: c.id, label: c.name }));

	const breakdown = $derived(
		ccaaId && precioVenta > 0
			? calculateTransferPrice({
					precioVenta,
					ccaaId,
					tipoVehiculo,
					incluirInforme: incluirInforme === 'si'
				})
			: null
	);

	onMount(() => {
		initAnalytics();
		funnel.started({ tramite: 'transferencia', total_steps: 9 });
		funnel.stepViewed({
			tramite: 'transferencia',
			step: 1,
			step_name: stepLabels[0],
			total_steps: 9
		});

		const onLeave = () => {
			if (!done) {
				funnel.abandoned({
					tramite: 'transferencia',
					step,
					step_name: stepLabels[step - 1],
					total_steps: 9
				});
			}
		};
		window.addEventListener('pagehide', onLeave);

		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const data = JSON.parse(saved);
				step = data.step ?? 1;
			}
		} catch {}

		return () => window.removeEventListener('pagehide', onLeave);
	});

	function save() {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					step,
					tipoVehiculo,
					matricula,
					bastidor,
					marcaId,
					marcaNombre,
					modeloId,
					modeloNombre,
					marcaMotoId,
					marcaMotoNombre,
					modeloMotoId,
					modeloMotoNombre,
					cilindradaMoto,
					email
				})
			);
		} catch {}
	}

	function validateStep(): boolean {
		errors = {};
		if (step === 2) {
			errors.matricula = validateMatricula(matricula);
			errors.bastidor = validateBastidor(bastidor);
		}
		if (step === 3) {
			if (tipoVehiculo === 'coche') {
				errors.marca = validateRequired(marcaId, 'La marca');
				errors.combustible = validateRequired(combustibleId, 'El combustible');
				errors.modelo = validateRequired(modeloId, 'El modelo');
			} else {
				errors.marca = validateRequired(marcaMotoId, 'La marca');
				errors.modelo = validateRequired(modeloMotoNombre, 'El modelo');
				errors.cilindrada = validateRequired(cilindradaMoto, 'La cilindrada');
			}
			errors.fechaMatricula = validateRequired(fechaMatricula, 'La fecha de matrícula');
		}
		if (step === 5) {
			errors.email = validateEmail(email);
			errors.nif = validateNifNie(nif);
			errors.nombre = validateRequired(nombre, 'El nombre');
			errors.telefono = validatePhone(telefono);
			if (!acceptPrivacy) errors.privacy = 'Debes aceptar la política de privacidad';
		}
		if (step === 7) {
			errors.direccion = validateRequired(direccion, 'La dirección');
			errors.cp = validateRequired(cp, 'El código postal');
		}
		return !Object.values(errors).some(Boolean);
	}

	function next() {
		if (!validateStep()) return;
		funnel.stepCompleted({
			tramite: 'transferencia',
			step,
			step_name: stepLabels[step - 1],
			total_steps: 9
		});
		save();
		if (step < 9) {
			step++;
			funnel.stepViewed({
				tramite: 'transferencia',
				step,
				step_name: stepLabels[step - 1],
				total_steps: 9
			});
			if (step === 9) {
				funnel.paymentStarted({ tramite: 'transferencia', step: 9, total_steps: 9 });
			}
		}
	}

	function prev() {
		if (step > 1) step--;
		save();
	}

	async function submit() {
		if (!validateStep()) return;
		submitting = true;
		try {
			const res = await fetch('/api/solicitud', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tipo: 'transferencia',
					tipoVehiculo,
					matricula,
					marca: tipoVehiculo === 'coche' ? marcaNombre : marcaMotoNombre,
					modelo: tipoVehiculo === 'coche' ? modeloNombre : modeloMotoNombre,
					marcaId: tipoVehiculo === 'coche' ? marcaId : marcaMotoId,
					modeloId: tipoVehiculo === 'coche' ? modeloId : modeloMotoId || undefined,
					combustible: tipoVehiculo === 'coche' ? combustibleNombre : undefined,
					modeloMeta: tipoVehiculo === 'coche' ? modeloMeta : undefined,
					cilindrada: tipoVehiculo === 'moto' ? cilindradaMoto : undefined,
					email,
					rol,
					precioVenta,
					ccaaId
				})
			});
			const data = await res.json();
			if (res.ok) {
				done = true;
				orderId = data.id;
				funnel.submitted({
					tramite: 'transferencia',
					step: 9,
					total_steps: 9,
					order_id: orderId
				});
				localStorage.removeItem(STORAGE_KEY);
			}
		} finally {
			submitting = false;
		}
	}
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap layout">
		<div class="main card pad">
			{#if done}
				<div class="success">
					<div class="icon">✓</div>
					<h1>¡Solicitud registrada!</h1>
					<p>Nº de orden: <strong>{orderId}</strong></p>
					<p class="sub">Modo demostración — conectar pasarela de pago en producción.</p>
					<a href="/" class="btn">Volver al inicio</a>
				</div>
			{:else}
				<StepProgress current={step} total={9} labels={stepLabels} />
				<h1>Transferencia de vehículos</h1>

				{#if step === 1}
					<FormField label="Tipo de vehículo" required>
						<RadioCards
							name="tipo"
							bind:value={tipoVehiculo}
							options={[
								{ value: 'coche', label: 'Coche' },
								{ value: 'moto', label: 'Moto / sin carnet' }
							]}
						/>
					</FormField>
				{:else if step === 2}
					<FormField label="Matrícula" error={errors.matricula} hint="Ej: 3990 WDS" required>
						<input bind:value={matricula} placeholder="3990WDS" />
					</FormField>
					<FormField
						label="Bastidor (VIN)"
						error={errors.bastidor}
						hint="17 caracteres en la ficha técnica"
						required
					>
						<input bind:value={bastidor} placeholder="VF1XXXXXXXXXXXXXX" maxlength="17" />
					</FormField>
				{:else if step === 3}
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
							errors={{
								marca: errors.marca,
								modelo: errors.modelo,
								cilindrada: errors.cilindrada
							}}
						/>
					{/if}
					<FormField label="Fecha primera matrícula" error={errors.fechaMatricula} required>
						<input bind:value={fechaMatricula} placeholder="dd/mm/aaaa" />
					</FormField>
				{:else if step === 4}
					<FormField label="CCAA del comprador" required>
						<SearchSelect options={ccaaOptions} bind:value={ccaaId} />
					</FormField>
					<FormField label="Precio compraventa (€)" required>
						<input type="number" bind:value={precioVenta} min="0" />
					</FormField>
					<FormField label="Fecha de venta" required>
						<input type="date" bind:value={fechaVenta} />
					</FormField>
					<FormField label="¿Incluir informe DGT?">
						<RadioCards
							name="informe"
							bind:value={incluirInforme}
							options={[
								{ value: 'si', label: 'Sí' },
								{ value: 'no', label: 'No' }
							]}
						/>
					</FormField>
				{:else if step === 5}
					<FormField label="¿Cuál es tu rol?" required>
						<RadioCards
							name="rol"
							bind:value={rol}
							options={[
								{ value: 'comprador', label: 'Soy el comprador' },
								{ value: 'vendedor', label: 'Soy el vendedor' }
							]}
						/>
					</FormField>
					<FormField label="Email" error={errors.email} required>
						<input type="email" bind:value={email} autocomplete="email" />
					</FormField>
					<FormField label="NIF/NIE" error={errors.nif} required>
						<input bind:value={nif} placeholder="12345678Z" />
					</FormField>
					<FormField label="Nombre" error={errors.nombre} required>
						<input bind:value={nombre} />
					</FormField>
					<FormField label="Primer apellido" required>
						<input bind:value={apellido1} />
					</FormField>
					<FormField label="Teléfono" error={errors.telefono} required>
						<input type="tel" bind:value={telefono} inputmode="tel" placeholder="612345678" />
					</FormField>
					<label class="check">
						<input type="checkbox" bind:checked={acceptPrivacy} />
						He leído y acepto la <a href="/legal/privacidad" target="_blank">política de privacidad</a>
					</label>
					{#if errors.privacy}<p class="err">{errors.privacy}</p>{/if}
				{:else if step === 6}
					<p class="info">
						Puedes invitar a la otra parte por email para que complete sus datos, o continuar y
						añadirlos después.
					</p>
					<FormField label="Email de la otra parte (opcional)">
						<input type="email" bind:value={otraParteEmail} placeholder="vendedor@email.com" />
					</FormField>
				{:else if step === 7}
					<FormField label="Provincia" required>
						<input bind:value={provincia} placeholder="Madrid" />
					</FormField>
					<FormField label="Municipio" required>
						<input bind:value={municipio} />
					</FormField>
					<FormField label="Dirección" error={errors.direccion} required>
						<input bind:value={direccion} />
					</FormField>
					<FormField label="Código postal" error={errors.cp} required>
						<input bind:value={cp} maxlength="5" inputmode="numeric" />
					</FormField>
				{:else if step === 8}
					<p class="info">
						Puedes subir documentos ahora o después del pago. Formatos: PDF o JPG.
					</p>
					<label class="check">
						<input type="checkbox" bind:checked={skipDocs} />
						Continuar sin subir documentos ahora
					</label>
					{#if !skipDocs}
						<FormField label="DNI frontal (opcional)">
							<input type="file" accept="image/*,.pdf" />
						</FormField>
						<FormField label="Ficha técnica (opcional)">
							<input type="file" accept="image/*,.pdf" />
						</FormField>
					{/if}
				{:else}
					<div class="summary">
						<h2>Resumen de tu solicitud</h2>
						<ul>
							<li>
								<span>Vehículo</span>
								<span
									>{matricula || '—'} · {tipoVehiculo === 'coche'
										? [marcaNombre, modeloNombre].filter(Boolean).join(' ') || '—'
										: [marcaMotoNombre, modeloMotoNombre, cilindradaMoto ? `${cilindradaMoto} cc` : '']
												.filter(Boolean)
												.join(' ') || '—'}</span
								>
							</li>
							<li><span>Rol</span><span>{rol}</span></li>
							<li><span>Email</span><span>{email}</span></li>
							<li><span>Total estimado</span><span>{breakdown ? `${breakdown.total} €` : '—'}</span></li>
						</ul>
						<p class="mock-pay">El pago con tarjeta se conectará cuando el backend esté disponible.</p>
					</div>
				{/if}

				<div class="nav-btns">
					{#if step > 1}
						<button type="button" class="btn ghost" onclick={prev}>Anterior</button>
					{:else}
						<span></span>
					{/if}
					{#if step < 9}
						<button type="button" class="btn" onclick={next}>Siguiente</button>
					{:else}
						<button type="button" class="btn" onclick={submit} disabled={submitting}>
							{submitting ? 'Procesando…' : 'Confirmar solicitud'}
						</button>
					{/if}
				</div>
			{/if}
		</div>
		{#if !done}<PriceSidebar {breakdown} />{/if}
	</div>
</section>

<style>
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
		margin-bottom: 24px;
	}
	.nav-btns {
		display: flex;
		justify-content: space-between;
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
	}
	.info {
		font-size: 15px;
		color: var(--text2);
		line-height: 1.55;
		margin-bottom: 20px;
		padding: 14px;
		background: var(--primary-dim);
		border-radius: var(--radius);
	}
	.check {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 14px;
		color: var(--text2);
		margin-top: 12px;
	}
	.check a {
		color: var(--accent);
		font-weight: 600;
	}
	.err {
		color: var(--error);
		font-size: 13px;
		margin-top: 8px;
	}
	.summary ul {
		list-style: none;
		margin: 20px 0;
	}
	.summary li {
		display: flex;
		justify-content: space-between;
		padding: 12px 0;
		border-bottom: 1px solid var(--border);
		font-size: 15px;
	}
	.summary li span:first-child {
		color: var(--text2);
	}
	.mock-pay {
		font-size: 13px;
		color: var(--text3);
		margin-top: 16px;
	}
	.success {
		text-align: center;
		padding: 40px 20px;
	}
	.success .icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: #d1fae5;
		color: var(--success);
		font-size: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 20px;
		font-weight: 800;
	}
	.success h1 {
		margin-bottom: 12px;
	}
	.success .sub {
		color: var(--text2);
		margin: 12px 0 24px;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
