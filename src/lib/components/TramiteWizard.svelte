<script lang="ts">
	import { onMount } from 'svelte';
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import {
		duplicadoMotivos,
		permisoClases,
		sexoOptions,
		shippingOptions,
		tramitePricing
	} from '$lib/data/tramite-options';
	import { provinces, streetTypes } from '$lib/data/provinces';
	import { formatEur } from '$lib/utils/pricing';
	import {
		validateEmail,
		validateMatricula,
		validateNifNie,
		validatePhone,
		validateRequired
	} from '$lib/utils/validators';
	import { funnel, initAnalytics } from '$lib/analytics';

	type Variant = 'etiqueta' | 'etiqueta-vmp' | 'informe' | 'duplicado' | 'cancelacion';

	let {
		title,
		tipo,
		variant,
		steps
	}: {
		title: string;
		tipo: string;
		variant: Variant;
		steps: string[];
	} = $props();

	const storageKey = $derived(`dgt-wizard-${tipo}`);
	const summaryStep = $derived(steps.length - 1);
	const paymentStep = $derived(steps.length);
	const isEtiquetaShip = $derived(variant === 'etiqueta' || variant === 'etiqueta-vmp');

	let step = $state(1);
	let done = $state(false);
	let orderId = $state('');
	let cuentaUrl = $state<string | null>(null);
	let errors = $state<Record<string, string | null>>({});
	let submitting = $state(false);

	let matricula = $state('');
	let tipoVehiculo = $state<'coche' | 'moto'>('coche');
	let distintivoTipo = $state('');
	let vmpCertificado = $state<'si' | 'no'>('si');
	let vmpNumCertificado = $state('');
	let vmpNumSerie = $state('');
	let vmpMarca = $state('');
	let vmpModelo = $state('');
	let motivoDuplicado = $state('');
	let clasePermiso = $state('');
	let fechaCaducidad = $state('');
	let email = $state('');
	let nif = $state('');
	let nombre = $state('');
	let apellido1 = $state('');
	let apellido2 = $state('');
	let telefono = $state('');
	let sexo = $state('');
	let fechaNacimiento = $state('');
	let provincia = $state('');
	let municipio = $state('');
	let pueblo = $state('');
	let tipoVia = $state('Calle');
	let direccion = $state('');
	let numero = $state('');
	let piso = $state('');
	let puerta = $state('');
	let bloque = $state('');
	let escalera = $state('');
	let cp = $state('');
	let localidad = $state('');
	let tipoEnvio = $state('postal');
	let cartaFinalizacion = $state('si');
	let docsConfirmados = $state(false);
	let acceptPrivacy = $state(false);

	const shippingPrice = $derived(
		shippingOptions.find((o) => o.value === tipoEnvio)?.price ?? 8.95
	);

	const priceLines = $derived.by(() => {
		if (variant === 'etiqueta') {
			const p = tramitePricing.etiqueta;
			return {
				lines: [
					{ label: p.label, amount: p.service },
					{ label: 'Envío', amount: shippingPrice }
				],
				total: p.service + shippingPrice
			};
		}
		if (variant === 'etiqueta-vmp') {
			const p = tramitePricing.etiquetaVmp;
			return {
				lines: [
					{ label: p.label, amount: p.service },
					{ label: 'Envío', amount: shippingPrice }
				],
				total: p.service + shippingPrice
			};
		}
		if (variant === 'informe') {
			const p = tramitePricing.informe;
			return {
				lines: [
					{ label: 'Tasa DGT', amount: p.dgt },
					{ label: 'Servicio', amount: p.service }
				],
				total: p.dgt + p.service
			};
		}
		if (variant === 'duplicado') {
			return {
				lines: [{ label: tramitePricing.duplicado.label, amount: tramitePricing.duplicado.total }],
				total: tramitePricing.duplicado.total
			};
		}
		return {
			lines: [{ label: tramitePricing.cancelacion.label, amount: tramitePricing.cancelacion.total }],
			total: tramitePricing.cancelacion.total
		};
	});

	onMount(() => {
		initAnalytics();
		funnel.started({ tramite: tipo, total_steps: steps.length });
		funnel.stepViewed({
			tramite: tipo,
			step: 1,
			step_name: steps[0],
			total_steps: steps.length
		});

		const onLeave = () => {
			if (!done) {
				funnel.abandoned({
					tramite: tipo,
					step,
					step_name: steps[step - 1],
					total_steps: steps.length
				});
			}
		};
		window.addEventListener('pagehide', onLeave);

		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const data = JSON.parse(saved);
				if (data.step) step = data.step;
				if (data.matricula) matricula = data.matricula;
				if (data.email) email = data.email;
				if (data.nombre) nombre = data.nombre;
			}
		} catch {}

		return () => window.removeEventListener('pagehide', onLeave);
	});

	function save() {
		try {
			localStorage.setItem(storageKey, JSON.stringify({ step, matricula, email, nombre }));
		} catch {}
	}

	function mockDistintivo(mat: string): string {
		const types = ['Etiqueta C', 'Etiqueta B', 'Etiqueta ECO', 'Etiqueta Cero'];
		return types[mat.length % types.length];
	}

	function validateStep(): boolean {
		errors = {};

		if (variant === 'etiqueta' && step === 1) {
			errors.matricula = validateMatricula(matricula);
			if (!errors.matricula) distintivoTipo = mockDistintivo(matricula);
		}

		if (variant === 'etiqueta-vmp' && step === 1) {
			errors.vmpNumSerie = validateRequired(vmpNumSerie, 'El número de serie');
			errors.vmpMarca = validateRequired(vmpMarca, 'La marca');
			if (vmpCertificado === 'si') {
				errors.vmpNumCertificado = validateRequired(vmpNumCertificado, 'El número de certificado');
			}
		}

		if (variant === 'informe' && step === 1) {
			errors.matricula = validateMatricula(matricula);
		}

		if (variant === 'cancelacion' && step === 1) {
			errors.matricula = validateMatricula(matricula);
		}

		if (variant === 'duplicado' && step === 1) {
			if (!motivoDuplicado) errors.motivoDuplicado = 'Selecciona el tipo de duplicado';
			if (!clasePermiso) errors.clasePermiso = 'Selecciona la clase de permiso';
			if (!fechaCaducidad) errors.fechaCaducidad = 'Introduce la fecha de caducidad';
		}

		const personalStep = variant === 'duplicado' ? 2 : 2;
		if (step === personalStep && variant !== 'cancelacion') {
			errors.email = validateEmail(email);
			errors.nif = validateNifNie(nif);
			errors.nombre = validateRequired(nombre, 'El nombre');
			errors.apellido1 = validateRequired(apellido1, 'El primer apellido');
			errors.telefono = validatePhone(telefono);
			if (!sexo) errors.sexo = 'Selecciona el sexo';
			if (!fechaNacimiento) errors.fechaNacimiento = 'Introduce la fecha de nacimiento';
		}

		if (variant === 'cancelacion' && step === 2) {
			errors.email = validateEmail(email);
			errors.nif = validateNifNie(nif);
			errors.nombre = validateRequired(nombre, 'El nombre');
			errors.apellido1 = validateRequired(apellido1, 'El primer apellido');
			errors.telefono = validatePhone(telefono);
			errors.direccion = validateRequired(direccion, 'La dirección');
			errors.cp = validateRequired(cp, 'El código postal');
			errors.localidad = validateRequired(localidad, 'La localidad');
		}

		const addressStep = 3;
		if (
			step === addressStep &&
			(variant === 'etiqueta' ||
				variant === 'etiqueta-vmp' ||
				variant === 'informe' ||
				variant === 'duplicado')
		) {
			if (!provincia) errors.provincia = 'Selecciona la provincia';
			errors.municipio = validateRequired(municipio, 'El municipio');
			errors.direccion = validateRequired(direccion, 'La dirección');
			errors.numero = validateRequired(numero, 'El número');
			errors.cp = validateRequired(cp, 'El código postal');
		}

		if (variant === 'cancelacion' && step === 4) {
			if (!docsConfirmados) errors.docs = 'Confirma la documentación requerida';
		}

		if (step === paymentStep) {
			if (!acceptPrivacy) errors.privacy = 'Debes aceptar la política de privacidad';
		}

		return !Object.values(errors).some(Boolean);
	}

	function next() {
		if (!validateStep()) return;
		funnel.stepCompleted({
			tramite: tipo,
			step,
			step_name: steps[step - 1],
			total_steps: steps.length
		});
		save();
		step++;
		funnel.stepViewed({
			tramite: tipo,
			step,
			step_name: steps[step - 1],
			total_steps: steps.length
		});
		if (step === paymentStep) {
			funnel.paymentStarted({ tramite: tipo, step, total_steps: steps.length });
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
					tipo,
					variant,
					matricula,
					tipoVehiculo,
					distintivoTipo,
					vmpCertificado,
					vmpNumCertificado,
					vmpNumSerie,
					vmpMarca,
					vmpModelo,
					motivoDuplicado,
					clasePermiso,
					fechaCaducidad,
					email,
					nif,
					nombre,
					apellido1,
					apellido2,
					telefono,
					sexo,
					fechaNacimiento,
					provincia,
					municipio,
					pueblo,
					tipoVia,
					direccion,
					numero,
					piso,
					puerta,
					bloque,
					escalera,
					cp,
					localidad,
					tipoEnvio,
					cartaFinalizacion,
					docsConfirmados,
					acceptPrivacy,
					priceLines: priceLines.lines,
					total: priceLines.total
				})
			});
			const data = await res.json();
			orderId = data.id ?? '';
			cuentaUrl = data.cuentaUrl ?? null;
			done = true;
			funnel.submitted({
				tramite: tipo,
				step,
				total_steps: steps.length,
				order_id: orderId
			});
			localStorage.removeItem(storageKey);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{title} | Trámites DGT Online</title>
</svelte:head>

<section class="section wizard-section">
	<div class="wrap wizard-layout">
		<div class="main card pad">
			{#if done}
				<div class="ok">
					<h1>Solicitud enviada</h1>
					<p>Tu solicitud se ha registrado correctamente. Te contactaremos en breve.</p>
					{#if orderId}<p class="ref">Referencia: <strong>{orderId}</strong></p>{/if}
					<div class="ok-actions">
						{#if cuentaUrl}
							<a href={cuentaUrl} class="btn">Ver en mi área</a>
						{/if}
						<a href="/" class="btn secondary">Volver al inicio</a>
					</div>
				</div>
			{:else}
				<StepProgress current={step} total={steps.length} labels={steps} />
				<h1>{title}</h1>

				{#if variant === 'etiqueta' && step === 1}
					<FormField label="Matrícula del vehículo" error={errors.matricula} required>
						<input bind:value={matricula} placeholder="3990WDS" />
					</FormField>
					{#if matricula && !errors.matricula}
						<div class="distintivo-info">
							<p>Distintivo estimado: <strong>{distintivoTipo || mockDistintivo(matricula)}</strong></p>
						</div>
					{/if}
				{:else if variant === 'etiqueta-vmp' && step === 1}
					<p class="info">
						Datos de tu Vehículo de Movilidad Personal (patinete). Si no está certificado, podrás
						inscribirlo de forma temporal según la normativa DGT.
					</p>
					<FormField label="¿El patinete tiene certificado de circulación DGT?" required>
						<RadioCards
							name="vmpCertificado"
							bind:value={vmpCertificado}
							options={[
								{ value: 'si', label: 'Sí, está certificado' },
								{ value: 'no', label: 'No certificado (inscripción temporal)' }
							]}
						/>
					</FormField>
					{#if vmpCertificado === 'si'}
						<FormField label="Número de certificado" error={errors.vmpNumCertificado} required>
							<input bind:value={vmpNumCertificado} placeholder="Según chapa / ficha técnica" />
						</FormField>
					{/if}
					<FormField label="Número de serie" error={errors.vmpNumSerie} required>
						<input bind:value={vmpNumSerie} placeholder="Número de serie del VMP" />
					</FormField>
					<div class="row-2">
						<FormField label="Marca" error={errors.vmpMarca} required>
							<input bind:value={vmpMarca} />
						</FormField>
						<FormField label="Modelo">
							<input bind:value={vmpModelo} />
						</FormField>
					</div>
				{:else if variant === 'informe' && step === 1}
					<FormField label="Matrícula del vehículo" error={errors.matricula} required>
						<input bind:value={matricula} placeholder="3990WDS" />
					</FormField>
					<p class="info">Informe completo emitido por la DGT con autentificación adicional.</p>
				{:else if variant === 'cancelacion' && step === 1}
					<FormField label="Tipo de vehículo" required>
						<RadioCards
							name="tipoVehiculo"
							bind:value={tipoVehiculo}
							options={[
								{ value: 'coche', label: 'Coche' },
								{ value: 'moto', label: 'Moto o coche sin carnet' }
							]}
						/>
					</FormField>
					<FormField label="Matrícula del vehículo" error={errors.matricula} required>
						<input bind:value={matricula} />
					</FormField>
				{:else if variant === 'duplicado' && step === 1}
					<FormField label="Tipo de duplicado" error={errors.motivoDuplicado} required>
						<select bind:value={motivoDuplicado}>
							<option value="">Selecciona un motivo</option>
							{#each duplicadoMotivos as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
					</FormField>
					<FormField label="Clase de permiso" error={errors.clasePermiso} required>
						<select bind:value={clasePermiso}>
							<option value="">Selecciona la clase</option>
							{#each permisoClases as c}
								<option value={c}>{c}</option>
							{/each}
						</select>
					</FormField>
					<FormField label="Fecha de caducidad" error={errors.fechaCaducidad} required>
						<input type="date" bind:value={fechaCaducidad} />
					</FormField>
				{:else if step === 2 && variant !== 'cancelacion'}
					<FormField label="Correo electrónico" error={errors.email} required>
						<input type="email" bind:value={email} />
					</FormField>
					<FormField label="NIF/NIE/CIF" error={errors.nif} required>
						<input bind:value={nif} />
					</FormField>
					<div class="row-2">
						<FormField label="Nombre" error={errors.nombre} required>
							<input bind:value={nombre} />
						</FormField>
						<FormField label="Primer apellido" error={errors.apellido1} required>
							<input bind:value={apellido1} />
						</FormField>
					</div>
					<FormField label="Segundo apellido">
						<input bind:value={apellido2} />
					</FormField>
					<FormField label="Teléfono" error={errors.telefono} required>
						<input type="tel" bind:value={telefono} />
					</FormField>
					<div class="row-2">
						<FormField label="Sexo" error={errors.sexo} required>
							<select bind:value={sexo}>
								<option value="">Selecciona</option>
								{#each sexoOptions as s}
									<option value={s.value}>{s.label}</option>
								{/each}
							</select>
						</FormField>
						<FormField label="Fecha de nacimiento" error={errors.fechaNacimiento} required>
							<input type="date" bind:value={fechaNacimiento} />
						</FormField>
					</div>
				{:else if variant === 'cancelacion' && step === 2}
					<FormField label="Correo electrónico" error={errors.email} required>
						<input type="email" bind:value={email} />
					</FormField>
					<FormField label="NIF/NIE/CIF" error={errors.nif} required>
						<input bind:value={nif} />
					</FormField>
					<div class="row-2">
						<FormField label="Nombre" error={errors.nombre} required>
							<input bind:value={nombre} />
						</FormField>
						<FormField label="Primer apellido" error={errors.apellido1} required>
							<input bind:value={apellido1} />
						</FormField>
					</div>
					<FormField label="Teléfono" error={errors.telefono} required>
						<input type="tel" bind:value={telefono} />
					</FormField>
					<FormField label="Dirección" error={errors.direccion} required>
						<input bind:value={direccion} />
					</FormField>
					<div class="row-2">
						<FormField label="Código postal" error={errors.cp} required>
							<input bind:value={cp} />
						</FormField>
						<FormField label="Localidad / Ciudad" error={errors.localidad} required>
							<input bind:value={localidad} />
						</FormField>
					</div>
				{:else if step === 3 && variant !== 'cancelacion'}
					<FormField label="Provincia" error={errors.provincia} required>
						<select bind:value={provincia}>
							<option value="">Selecciona provincia</option>
							{#each provinces as p}
								<option value={p}>{p}</option>
							{/each}
						</select>
					</FormField>
					<div class="row-2">
						<FormField label="Municipio" error={errors.municipio} required>
							<input bind:value={municipio} />
						</FormField>
						<FormField label="Pueblo">
							<input bind:value={pueblo} />
						</FormField>
					</div>
					<div class="row-2">
						<FormField label="Tipo de vía" required>
							<select bind:value={tipoVia}>
								{#each streetTypes as t}
									<option value={t}>{t}</option>
								{/each}
							</select>
						</FormField>
						<FormField label="Dirección" error={errors.direccion} required>
							<input bind:value={direccion} />
						</FormField>
					</div>
					<div class="row-3">
						<FormField label="Nº" error={errors.numero} required>
							<input bind:value={numero} />
						</FormField>
						<FormField label="Piso">
							<input bind:value={piso} />
						</FormField>
						<FormField label="Puerta">
							<input bind:value={puerta} />
						</FormField>
					</div>
					<FormField label="Código postal" error={errors.cp} required>
						<input bind:value={cp} />
					</FormField>
					{#if isEtiquetaShip}
						<FormField label="Tipo de envío" required>
							<RadioCards
								name="tipoEnvio"
								bind:value={tipoEnvio}
								options={shippingOptions.map((o) => ({
									value: o.value,
									label: o.label,
									desc: `${o.desc} — ${formatEur(o.price)}`
								}))}
							/>
						</FormField>
					{/if}
				{:else if variant === 'cancelacion' && step === 3}
					<FormField label="¿Dispone de carta de finalización de pago?" required>
						<RadioCards
							name="carta"
							bind:value={cartaFinalizacion}
							options={[
								{ value: 'si', label: 'Sí' },
								{ value: 'no', label: 'No' }
							]}
						/>
					</FormField>
				{:else if variant === 'cancelacion' && step === 4}
					<div class="docs-list">
						<h2>Documentación requerida</h2>
						<ul>
							<li>NIF del propietario (frontal y trasero)</li>
							<li>Permiso de circulación</li>
							<li>Ficha técnica (frontal y trasera)</li>
							<li>Carta de cancelación de reserva de dominio</li>
						</ul>
						<label class="check">
							<input type="checkbox" bind:checked={docsConfirmados} />
							Confirmo que dispongo o enviaré la documentación
						</label>
						{#if errors.docs}<p class="field-error">{errors.docs}</p>{/if}
					</div>
				{:else if step === summaryStep}
					<ul class="sum">
						{#if variant === 'etiqueta-vmp'}
							<li>
								<span>VMP</span><strong
									>{vmpMarca}
									{vmpModelo || ''} · {vmpCertificado === 'si' ? 'Certificado' : 'No certificado'}</strong
								>
							</li>
							<li><span>Nº serie</span><strong>{vmpNumSerie || '—'}</strong></li>
							{#if vmpCertificado === 'si'}
								<li><span>Nº certificado</span><strong>{vmpNumCertificado || '—'}</strong></li>
							{/if}
						{:else}
							<li><span>Matrícula</span><strong>{matricula || '—'}</strong></li>
						{/if}
						<li><span>Solicitante</span><strong>{nombre} {apellido1}</strong></li>
						<li><span>Email</span><strong>{email}</strong></li>
						<li><span>Total</span><strong>{formatEur(priceLines.total)}</strong></li>
					</ul>
				{:else if step === paymentStep}
					<div class="pay-box">
						<div class="pay-total">{formatEur(priceLines.total)}</div>
						<p>Pago seguro con tarjeta (pasarela Redsys en producción)</p>
					</div>
					<label class="check">
						<input type="checkbox" bind:checked={acceptPrivacy} />
						Acepto la <a href="/legal/privacidad" target="_blank">política de privacidad</a>
					</label>
					{#if errors.privacy}<p class="field-error">{errors.privacy}</p>{/if}
				{/if}

				<div class="nav">
					{#if step > 1}
						<button type="button" class="btn ghost" onclick={prev}>Anterior</button>
					{:else}<span></span>{/if}
					{#if step < paymentStep}
						<button type="button" class="btn" onclick={next}>Siguiente</button>
					{:else}
						<button type="button" class="btn" disabled={submitting} onclick={submit}>
							{submitting ? 'Procesando…' : 'Confirmar y pagar'}
						</button>
					{/if}
				</div>
			{/if}
		</div>

		{#if !done}
			<aside class="sidebar card">
				<h3>Importe</h3>
				<div class="total">{formatEur(priceLines.total)}</div>
				<ul class="lines">
					{#each priceLines.lines as line}
						<li><span>{line.label}</span><span>{formatEur(line.amount)}</span></li>
					{/each}
				</ul>
			</aside>
		{/if}
	</div>
</section>

<style>
	.wizard-section {
		padding-top: 40px;
		padding-bottom: 80px;
	}
	.wizard-layout {
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 24px;
		align-items: start;
	}
	.pad {
		padding: 32px;
	}
	h1 {
		font-size: 24px;
		font-weight: 800;
		margin-bottom: 24px;
		color: var(--ink);
	}
	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.row-3 {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 16px;
	}
	.info {
		color: var(--text2);
		font-size: 14px;
		margin-bottom: 12px;
	}
	.distintivo-info {
		padding: 12px 14px;
		background: var(--primary-dim);
		border-radius: var(--radius);
		border-left: 3px solid var(--brand-teal);
		font-size: 14px;
		margin-bottom: 12px;
	}
	.sum {
		list-style: none;
	}
	.sum li {
		display: flex;
		justify-content: space-between;
		padding: 10px 0;
		border-bottom: 1px solid var(--border-light);
		font-size: 14px;
		color: var(--text2);
	}
	.docs-list ul {
		margin: 0 0 16px 18px;
		font-size: 14px;
		color: var(--text2);
		line-height: 1.6;
	}
	.docs-list h2 {
		font-size: 17px;
		margin-bottom: 10px;
	}
	.check {
		display: flex;
		gap: 8px;
		font-size: 14px;
		color: var(--text2);
	}
	.check a {
		color: var(--brand-teal);
	}
	.field-error {
		color: var(--error);
		font-size: 13px;
		margin-top: 8px;
	}
	.pay-box {
		text-align: center;
		padding: 24px;
		background: var(--primary-dim);
		border-radius: var(--radius-lg);
		margin-bottom: 16px;
	}
	.pay-total {
		font-size: 34px;
		font-weight: 800;
		color: var(--primary);
	}
	.nav {
		display: flex;
		justify-content: space-between;
		margin-top: 28px;
		padding-top: 20px;
		border-top: 1px solid var(--border-light);
	}
	.sidebar {
		padding: 24px;
		position: sticky;
		top: 100px;
	}
	.sidebar h3 {
		font-size: 12px;
		text-transform: uppercase;
		color: var(--text2);
		margin-bottom: 8px;
	}
	.sidebar .total {
		font-size: 30px;
		font-weight: 800;
		color: var(--primary);
		margin-bottom: 14px;
	}
	.lines {
		list-style: none;
	}
	.lines li {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		padding: 8px 0;
		border-bottom: 1px solid var(--border-light);
		color: var(--text2);
	}
	.ok {
		text-align: center;
		padding: 32px;
	}
	.ok-actions {
		display: flex;
		gap: 10px;
		justify-content: center;
		flex-wrap: wrap;
		margin-top: 8px;
	}
	a.btn.secondary {
		background: transparent;
		border: 1px solid var(--navy, #003050);
		color: var(--navy, #003050);
	}
	.ref {
		margin: 12px 0 20px;
		color: var(--text2);
		font-size: 14px;
	}
	@media (max-width: 900px) {
		.wizard-layout {
			grid-template-columns: 1fr;
		}
		.row-2,
		.row-3 {
			grid-template-columns: 1fr;
		}
	}
</style>
