<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import WizardStepper from '$lib/components/ui/WizardStepper.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import PriceSidebar from '$lib/components/ui/PriceSidebar.svelte';
	import VehicleModelPicker from '$lib/components/VehicleModelPicker.svelte';
	import MotoModelPicker from '$lib/components/MotoModelPicker.svelte';
	import { ccaaList } from '$lib/data/vehicles';
	import type { PriceBreakdown } from '$lib/utils/pricing';
	import { formatEur } from '$lib/utils/pricing';
	import {
		fetchFactorCorreccion,
		buildTransferBreakdown,
		looksLikeDate
	} from '$lib/utils/transfer-price-client';
	import { createSolicitud } from '$lib/pago/client';
	import { handleWizardSave } from '$lib/tramite/save';
	import { goto } from '$app/navigation';
	import {
		validateEmail,
		validateMatricula,
		validateBastidor,
		validateNifNie,
		validatePhone,
		validateRequired,
		validateCodigoPostal,
		validateDate,
		validateDateOrder,
		todayIso
	} from '$lib/utils/validators';
	import { funnel, initAnalytics } from '$lib/analytics';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import DraftStorageNotice from '$lib/components/DraftStorageNotice.svelte';
	import { getStaticSeo } from '$lib/seo/site';
	import {
		clearDraft,
		hasDraftStorageAck,
		loadDraft,
		looksLikeStartedDraft,
		saveDraft,
		setDraftStorageAck
	} from '$lib/tramite/draft';

	const seo = getStaticSeo('/tramitar/transferencia')!;
	const STORAGE_KEY = 'dgt-transfer-wizard';
	const stepLabels = ['Vehículo', 'Intervinientes', 'Envío y documentos', 'Resumen'];
	const TOTAL_STEPS = 4;

	/** Si el borrador era de 9 pasos (step>4), remapea: 5–6→2, 7–8→3, 9→4. */
	function clampLegacyStep(raw: number): number {
		if (raw < 1) return 1;
		if (raw <= TOTAL_STEPS) return raw;
		if (raw <= 6) return 2;
		if (raw <= 8) return 3;
		return 4;
	}

	let step = $state(1);
	let errors = $state<Record<string, string | null>>({});
	let errorSteps = $state<number[]>([]);
	let submitting = $state(false);
	let saving = $state(false);
	let payError = $state<string | null>(null);
	let saveMsg = $state<string | null>(null);
	let saveError = $state<string | null>(null);
	let solicitudId = $state<string | null>(null);

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
	let showDraftNotice = $state(false);
	let draftReady = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

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

	onMount(() => {
		initAnalytics();
		funnel.started({ tramite: 'transferencia', total_steps: TOTAL_STEPS });
		funnel.stepViewed({
			tramite: 'transferencia',
			step: 1,
			step_name: stepLabels[0],
			total_steps: TOTAL_STEPS
		});

		const onLeave = () => {
			funnel.abandoned({
				tramite: 'transferencia',
				step,
				step_name: stepLabels[step - 1],
				total_steps: TOTAL_STEPS
			});
		};
		window.addEventListener('pagehide', onLeave);

		if (hasDraftStorageAck()) draftReady = true;
		const data = loadDraft<Record<string, unknown>>(STORAGE_KEY);
		if (data) {
			if (typeof data.step === 'number') step = clampLegacyStep(data.step);
			if (typeof data.solicitudId === 'string' && data.solicitudId) {
				solicitudId = data.solicitudId;
			}
			if (data.tipoVehiculo === 'coche' || data.tipoVehiculo === 'moto')
				tipoVehiculo = data.tipoVehiculo;
			if (typeof data.matricula === 'string') matricula = data.matricula;
			if (typeof data.bastidor === 'string') bastidor = data.bastidor;
			if (typeof data.marcaId === 'string') marcaId = data.marcaId;
			if (typeof data.marcaNombre === 'string') marcaNombre = data.marcaNombre;
			if (typeof data.combustibleId === 'string') combustibleId = data.combustibleId;
			if (typeof data.combustibleNombre === 'string') combustibleNombre = data.combustibleNombre;
			if (typeof data.modeloId === 'string') modeloId = data.modeloId;
			if (typeof data.modeloNombre === 'string') modeloNombre = data.modeloNombre;
			if (typeof data.marcaMotoId === 'string') marcaMotoId = data.marcaMotoId;
			if (typeof data.marcaMotoNombre === 'string') marcaMotoNombre = data.marcaMotoNombre;
			if (typeof data.modeloMotoId === 'string') modeloMotoId = data.modeloMotoId;
			if (typeof data.modeloMotoNombre === 'string') modeloMotoNombre = data.modeloMotoNombre;
			if (typeof data.cilindradaMoto === 'string') cilindradaMoto = data.cilindradaMoto;
			if (typeof data.fechaMatricula === 'string') fechaMatricula = data.fechaMatricula;
			if (typeof data.ccaaId === 'string') ccaaId = data.ccaaId;
			if (typeof data.precioVenta === 'number') precioVenta = data.precioVenta;
			if (typeof data.fechaVenta === 'string') fechaVenta = data.fechaVenta;
			if (typeof data.facturaEmpresa === 'string') facturaEmpresa = data.facturaEmpresa;
			if (typeof data.incluirInforme === 'string') incluirInforme = data.incluirInforme;
			if (data.rol === 'comprador' || data.rol === 'vendedor') rol = data.rol;
			if (typeof data.email === 'string') email = data.email;
			if (typeof data.nif === 'string') nif = data.nif;
			if (typeof data.nombre === 'string') nombre = data.nombre;
			if (typeof data.apellido1 === 'string') apellido1 = data.apellido1;
			if (typeof data.telefono === 'string') telefono = data.telefono;
			if (typeof data.otraParteEmail === 'string') otraParteEmail = data.otraParteEmail;
			if (typeof data.provincia === 'string') provincia = data.provincia;
			if (typeof data.municipio === 'string') municipio = data.municipio;
			if (typeof data.direccion === 'string') direccion = data.direccion;
			if (typeof data.cp === 'string') cp = data.cp;
			if (typeof data.skipDocs === 'boolean') skipDocs = data.skipDocs;
			if (!hasDraftStorageAck()) showDraftNotice = true;
		}

		return () => {
			window.removeEventListener('pagehide', onLeave);
			if (saveTimer) clearTimeout(saveTimer);
		};
	});

	function draftSnapshot(): Record<string, unknown> {
		return {
			step,
			solicitudId,
			tipoVehiculo,
			matricula,
			bastidor,
			marcaId,
			marcaNombre,
			combustibleId,
			combustibleNombre,
			modeloId,
			modeloNombre,
			marcaMotoId,
			marcaMotoNombre,
			modeloMotoId,
			modeloMotoNombre,
			cilindradaMoto,
			fechaMatricula,
			ccaaId,
			precioVenta,
			fechaVenta,
			facturaEmpresa,
			incluirInforme,
			rol,
			email,
			nif,
			nombre,
			apellido1,
			telefono,
			otraParteEmail,
			provincia,
			municipio,
			direccion,
			cp,
			skipDocs
		};
	}

	function save() {
		if (!draftReady) return;
		saveDraft(STORAGE_KEY, draftSnapshot());
	}

	function scheduleSave() {
		if (!draftReady) return;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => save(), 350);
	}

	function noteProgress(force = false) {
		const started =
			force ||
			looksLikeStartedDraft(matricula) ||
			looksLikeStartedDraft(bastidor) ||
			looksLikeStartedDraft(email) ||
			looksLikeStartedDraft(nombre) ||
			step > 1;
		if (!started) return;
		if (!hasDraftStorageAck()) {
			showDraftNotice = true;
			return;
		}
		draftReady = true;
		scheduleSave();
	}

	function confirmDraftNotice() {
		setDraftStorageAck();
		showDraftNotice = false;
		draftReady = true;
		save();
	}

	$effect(() => {
		if (!draftReady) return;
		void step;
		void solicitudId;
		void tipoVehiculo;
		void matricula;
		void bastidor;
		void marcaId;
		void marcaNombre;
		void combustibleId;
		void modeloId;
		void modeloNombre;
		void marcaMotoId;
		void modeloMotoId;
		void modeloMotoNombre;
		void cilindradaMoto;
		void fechaMatricula;
		void ccaaId;
		void precioVenta;
		void fechaVenta;
		void facturaEmpresa;
		void incluirInforme;
		void rol;
		void email;
		void nif;
		void nombre;
		void apellido1;
		void telefono;
		void otraParteEmail;
		void provincia;
		void municipio;
		void direccion;
		void cp;
		void skipDocs;
		scheduleSave();
	});

	function validateStepAt(s: number): Record<string, string | null> {
		const e: Record<string, string | null> = {};
		if (s === 1) {
			// Antiguos pasos 2–4: matrícula, bastidor, técnicos, operación
			e.matricula = validateMatricula(matricula);
			e.bastidor = validateBastidor(bastidor);
			if (tipoVehiculo === 'coche') {
				e.marca = validateRequired(marcaId, 'La marca');
				e.combustible = validateRequired(combustibleId, 'El combustible');
				e.modelo = validateRequired(modeloId, 'El modelo');
			} else {
				e.marca = validateRequired(marcaMotoId, 'La marca');
				e.modelo = validateRequired(modeloMotoNombre || modeloMotoId, 'El modelo');
				e.cilindrada = validateRequired(String(cilindradaMoto ?? ''), 'La cilindrada');
			}
			e.fechaMatricula = validateDate(fechaMatricula, {
				label: 'La fecha de primera matrícula',
				notFuture: true
			});
			e.ccaa = validateRequired(ccaaId, 'La comunidad autónoma');
			if (!(precioVenta > 0)) e.precioVenta = 'Indica un precio de venta mayor que 0';
			e.fechaVenta = validateDate(fechaVenta, {
				label: 'La fecha de venta',
				notFuture: true
			});
			const order = validateDateOrder(
				fechaMatricula,
				fechaVenta,
				'La fecha de matrícula no puede ser posterior a la de venta'
			);
			if (order) e.fechaVenta = order;
		}
		if (s === 2) {
			// Antiguo paso 5 (sin privacidad) + email otra parte opcional
			e.email = validateEmail(email);
			e.nif = validateNifNie(nif);
			e.nombre = validateRequired(nombre, 'El nombre');
			e.apellido1 = validateRequired(apellido1, 'El primer apellido');
			e.telefono = validatePhone(telefono);
			if (otraParteEmail.trim()) {
				e.otraParteEmail = validateEmail(otraParteEmail);
			}
		}
		if (s === 3) {
			// Antiguo paso 7
			e.provincia = validateRequired(provincia, 'La provincia');
			e.municipio = validateRequired(municipio, 'El municipio');
			e.direccion = validateRequired(direccion, 'La dirección');
			e.cp = validateCodigoPostal(cp);
		}
		if (s === 4) {
			if (!acceptPrivacy) e.privacy = 'Debes aceptar la política de privacidad';
			if (!breakdown || !(breakdown.total > 0)) {
				e.total = 'Completa CCAA, fechas y modelo para calcular el importe.';
			}
		}
		return e;
	}

	function stepHasErrors(s: number): boolean {
		return Object.values(validateStepAt(s)).some(Boolean);
	}

	function firstInvalidStep(): number {
		for (let s = 1; s <= TOTAL_STEPS; s++) {
			if (stepHasErrors(s)) return s;
		}
		return TOTAL_STEPS;
	}

	function validateAllSteps(): boolean {
		const merged: Record<string, string | null> = {};
		const bad: number[] = [];
		for (let s = 1; s <= TOTAL_STEPS; s++) {
			const e = validateStepAt(s);
			Object.assign(merged, e);
			if (Object.values(e).some(Boolean)) bad.push(s);
		}
		errors = merged;
		errorSteps = bad;
		return bad.length === 0;
	}

	function goTo(n: number) {
		if (n < 1 || n > TOTAL_STEPS || n === step) return;
		funnel.stepViewed({
			tramite: 'transferencia',
			step: n,
			step_name: stepLabels[n - 1],
			total_steps: TOTAL_STEPS
		});
		step = n;
		noteProgress(true);
		save();
	}

	function next() {
		funnel.stepCompleted({
			tramite: 'transferencia',
			step,
			step_name: stepLabels[step - 1],
			total_steps: TOTAL_STEPS
		});
		noteProgress(true);
		save();
		if (step < TOTAL_STEPS) {
			step++;
			funnel.stepViewed({
				tramite: 'transferencia',
				step,
				step_name: stepLabels[step - 1],
				total_steps: TOTAL_STEPS
			});
		}
	}

	function prev() {
		if (step > 1) step--;
		save();
	}

	function buildPayload(): Record<string, unknown> {
		const marcaLabel = tipoVehiculo === 'coche' ? marcaNombre : marcaMotoNombre;
		const modeloLabel = tipoVehiculo === 'coche' ? modeloNombre : modeloMotoNombre;
		const priceLines = breakdown
			? [
					{ label: 'ITP', amount: breakdown.itpAmount },
					{ label: 'Tramitación', amount: breakdown.tramitacion },
					...(breakdown.informeDgt > 0
						? [{ label: 'Informe DGT', amount: breakdown.informeDgt }]
						: [])
				]
			: [];
		return {
			tipo: 'transferencia',
			wizardStep: step,
			tipoVehiculo,
			matricula,
			bastidor,
			marca: marcaLabel,
			modelo: modeloLabel,
			marcaNombre: marcaLabel,
			modeloNombre: modeloLabel,
			marcaId: tipoVehiculo === 'coche' ? marcaId : marcaMotoId,
			modeloId: tipoVehiculo === 'coche' ? modeloId : modeloMotoId || undefined,
			combustible: tipoVehiculo === 'coche' ? combustibleNombre : undefined,
			combustibleId: tipoVehiculo === 'coche' ? combustibleId : undefined,
			modeloMeta: tipoVehiculo === 'coche' ? modeloMeta : undefined,
			cilindrada: tipoVehiculo === 'moto' ? cilindradaMoto : undefined,
			fechaMatricula,
			ccaaId,
			precioVenta,
			fechaVenta,
			facturaEmpresa,
			incluirInforme,
			email,
			nif,
			nombre,
			apellido1,
			telefono,
			rol,
			otraParteEmail,
			provincia,
			municipio,
			direccion,
			cp,
			skipDocs,
			acceptPrivacy,
			breakdown,
			priceLines,
			total: breakdown?.total ?? 0,
			amount: breakdown?.total ?? 0,
			precioBase: tipoVehiculo === 'coche' ? modeloMeta?.precioBase : null,
			factorCorreccion,
			fuenteDepreciacion,
			metaFiscal: breakdown
				? {
						valoracionReal: breakdown.valoracionReal,
						baseImponible: breakdown.baseImponible,
						itpAmount: breakdown.itpAmount,
						sinValorBoe: breakdown.sinValorBoe,
						fuente: breakdown.fuente,
						ordenReferencia: 'HAC/1501/2025'
					}
				: undefined
		};
	}

	async function saveToAccount() {
		saving = true;
		saveMsg = null;
		saveError = null;
		try {
			const outcome = await handleWizardSave({
				tipo: 'transferencia',
				storageKey: STORAGE_KEY,
				draftSnapshot: draftSnapshot(),
				payload: buildPayload(),
				solicitudId,
				returnPath: page.url.pathname
			});
			if (outcome.kind === 'login') return;
			if (outcome.kind === 'error') {
				saveError = outcome.error;
				return;
			}
			solicitudId = outcome.result.solicitudId;
			saveMsg = outcome.result.message;
			draftReady = true;
			setDraftStorageAck();
			save();
		} finally {
			saving = false;
		}
	}

	async function continueToPayment() {
		if (!validateAllSteps()) {
			payError = 'Revisa los datos del formulario: hay campos incompletos o no válidos.';
			step = firstInvalidStep();
			return;
		}
		if (!breakdown || !(breakdown.total > 0)) {
			payError = 'Completa CCAA, fechas y modelo para calcular el importe.';
			return;
		}
		submitting = true;
		payError = null;
		try {
			const result = await createSolicitud({
				amount: breakdown.total,
				solicitudId,
				payload: buildPayload()
			});

			if (!result.ok) {
				payError = result.error;
				return;
			}

			funnel.submitted({
				tramite: 'transferencia',
				step: TOTAL_STEPS,
				total_steps: TOTAL_STEPS,
				order_id: result.solicitudId
			});
			funnel.paymentStarted({
				tramite: 'transferencia',
				step: TOTAL_STEPS,
				total_steps: TOTAL_STEPS
			});
			clearDraft(STORAGE_KEY);
			await goto(result.pagoUrl);
		} finally {
			submitting = false;
		}
	}
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap layout">
		<div class="main card pad">
			<WizardStepper current={step} labels={stepLabels} {errorSteps} onchange={goTo} />
			<h1>Transferencia de vehículos</h1>
			{#if saveMsg}<p class="save-ok" role="status">{saveMsg}</p>{/if}
			{#if saveError}<p class="err" role="alert">{saveError}</p>{/if}

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
					<FormField label="Matrícula" error={errors.matricula} hint="Ej: 3990 WDS" required>
						<input
							bind:value={matricula}
							placeholder="3990WDS"
							oninput={() => noteProgress()}
						/>
					</FormField>
					<FormField
						label="Bastidor (VIN)"
						error={errors.bastidor}
						hint="17 caracteres en la ficha técnica"
						required
					>
						<input
							bind:value={bastidor}
							placeholder="VF1XXXXXXXXXXXXXX"
							maxlength="17"
							oninput={() => noteProgress()}
						/>
					</FormField>
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
						<input type="date" bind:value={fechaMatricula} max={todayIso()} />
					</FormField>
					<FormField label="CCAA del comprador" error={errors.ccaa} required>
						<SearchSelect options={ccaaOptions} bind:value={ccaaId} />
					</FormField>
					<FormField label="Precio compraventa (€)" error={errors.precioVenta} required>
						<input type="number" bind:value={precioVenta} min="0" />
					</FormField>
					<FormField label="Fecha de venta" error={errors.fechaVenta} required>
						<input type="date" bind:value={fechaVenta} max={todayIso()} />
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
				{:else if step === 2}
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
					<FormField label="Primer apellido" error={errors.apellido1} required>
						<input bind:value={apellido1} />
					</FormField>
					<FormField label="Teléfono" error={errors.telefono} required>
						<input type="tel" bind:value={telefono} inputmode="tel" placeholder="612345678" />
					</FormField>
					<p class="info">
						Puedes invitar a la otra parte por email para que complete sus datos, o continuar y
						añadirlos después.
					</p>
					<FormField label="Email de la otra parte (opcional)" error={errors.otraParteEmail}>
						<input type="email" bind:value={otraParteEmail} placeholder="vendedor@email.com" />
					</FormField>
				{:else if step === 3}
					<FormField label="Provincia" error={errors.provincia} required>
						<input bind:value={provincia} placeholder="Madrid" />
					</FormField>
					<FormField label="Municipio" error={errors.municipio} required>
						<input bind:value={municipio} />
					</FormField>
					<FormField label="Dirección" error={errors.direccion} required>
						<input bind:value={direccion} />
					</FormField>
					<FormField label="Código postal" error={errors.cp} required>
						<input bind:value={cp} maxlength="5" inputmode="numeric" />
					</FormField>
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
						<p class="summary-lead">
							Revisa los datos antes de continuar a la pasarela de pago.
						</p>
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
							<li><span>Bastidor</span><span>{bastidor || '—'}</span></li>
							<li><span>Rol</span><span>{rol}</span></li>
							<li><span>Solicitante</span><span>{nombre} {apellido1}</span></li>
							<li><span>NIF/NIE</span><span>{nif || '—'}</span></li>
							<li><span>Email</span><span>{email}</span></li>
							<li><span>Teléfono</span><span>{telefono || '—'}</span></li>
							<li>
								<span>Dirección</span>
								<span>{[direccion, cp, municipio, provincia].filter(Boolean).join(', ') || '—'}</span>
							</li>
							<li><span>Total</span><span>{breakdown ? formatEur(breakdown.total) : '—'}</span></li>
						</ul>
						<label class="check">
							<input type="checkbox" bind:checked={acceptPrivacy} />
							Acepto la <a href="/politica-de-privacidad" target="_blank">política de privacidad</a>
						</label>
						{#if errors.privacy}<p class="err">{errors.privacy}</p>{/if}
						{#if errors.total}<p class="err">{errors.total}</p>{/if}
						{#if payError}<p class="err">{payError}</p>{/if}
						<button
							type="button"
							class="btn pay-cta"
							onclick={continueToPayment}
							disabled={submitting || !acceptPrivacy}
						>
							{submitting ? 'Registrando solicitud…' : 'Continuar a pasarela de pago'}
						</button>
					</div>
				{/if}

				<div class="nav-btns">
					{#if step > 1}
						<button type="button" class="btn ghost" onclick={prev}>Anterior</button>
					{:else}
						<span></span>
					{/if}
					<div class="nav-right">
						<button
							type="button"
							class="btn ghost save-btn"
							onclick={saveToAccount}
							disabled={saving || submitting}
						>
							{saving ? 'Guardando…' : page.data.user ? 'Guardar' : 'Guardar (iniciar sesión)'}
						</button>
						{#if step < TOTAL_STEPS}
							<button type="button" class="btn" onclick={next}>Siguiente</button>
						{/if}
					</div>
				</div>
		</div>
		<PriceSidebar {breakdown} loading={factorLoading} error={factorError} />
	</div>
</section>

<DraftStorageNotice open={showDraftNotice} onconfirm={confirmDraftNotice} />

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
		align-items: center;
		gap: 12px;
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
		flex-wrap: wrap;
	}
	.nav-right {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin-left: auto;
	}
	.save-btn {
		white-space: nowrap;
	}
	.save-ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 14px;
		margin-bottom: 16px;
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
	.summary-lead {
		margin: 0;
		color: var(--text2);
		font-size: 0.92rem;
	}
	.summary ul {
		list-style: none;
		margin: 20px 0;
	}
	.summary li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 0;
		border-bottom: 1px solid var(--border);
		font-size: 15px;
	}
	.summary li span:first-child {
		color: var(--text2);
	}
	.pay-cta {
		width: 100%;
		margin-top: 16px;
		padding: 14px 18px;
		font-weight: 800;
	}
	.pay-cta:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
