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
	import type { PriceBreakdown } from '$lib/utils/pricing';
	import { formatEur } from '$lib/utils/pricing';
	import {
		fetchFactorCorreccion,
		buildTransferBreakdown,
		looksLikeDate
	} from '$lib/utils/transfer-price-client';
	import { createSolicitud } from '$lib/pago/client';
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
	const stepLabels = [
		'Tipo de vehículo',
		'Identificación',
		'Datos técnicos',
		'Operación',
		'Tu rol y datos',
		'La otra parte',
		'Dirección',
		'Documentos',
		'Resumen'
	];

	let step = $state(1);
	let errors = $state<Record<string, string | null>>({});
	let submitting = $state(false);
	let payError = $state<string | null>(null);

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
		funnel.started({ tramite: 'transferencia', total_steps: 9 });
		funnel.stepViewed({
			tramite: 'transferencia',
			step: 1,
			step_name: stepLabels[0],
			total_steps: 9
		});

		const onLeave = () => {
			funnel.abandoned({
				tramite: 'transferencia',
				step,
				step_name: stepLabels[step - 1],
				total_steps: 9
			});
		};
		window.addEventListener('pagehide', onLeave);

		if (hasDraftStorageAck()) draftReady = true;
		const data = loadDraft<Record<string, unknown>>(STORAGE_KEY);
		if (data) {
			if (typeof data.step === 'number') step = data.step;
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
		if (s === 2) {
			e.matricula = validateMatricula(matricula);
			e.bastidor = validateBastidor(bastidor);
		}
		if (s === 3) {
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
		}
		if (s === 4) {
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
		if (s === 5) {
			e.email = validateEmail(email);
			e.nif = validateNifNie(nif);
			e.nombre = validateRequired(nombre, 'El nombre');
			e.apellido1 = validateRequired(apellido1, 'El primer apellido');
			e.telefono = validatePhone(telefono);
			if (!acceptPrivacy) e.privacy = 'Debes aceptar la política de privacidad';
		}
		if (s === 6 && otraParteEmail.trim()) {
			e.otraParteEmail = validateEmail(otraParteEmail);
		}
		if (s === 7) {
			e.provincia = validateRequired(provincia, 'La provincia');
			e.municipio = validateRequired(municipio, 'El municipio');
			e.direccion = validateRequired(direccion, 'La dirección');
			e.cp = validateCodigoPostal(cp);
		}
		if (s === 9) {
			if (!acceptPrivacy) e.privacy = 'Debes aceptar la política de privacidad';
			if (!breakdown || !(breakdown.total > 0)) {
				e.total = 'Completa CCAA, fechas y modelo para calcular el importe.';
			}
		}
		return e;
	}

	function validateStep(): boolean {
		errors = validateStepAt(step);
		return !Object.values(errors).some(Boolean);
	}

	function validateAllSteps(): boolean {
		const merged: Record<string, string | null> = {};
		for (let s = 2; s <= 9; s++) {
			Object.assign(merged, validateStepAt(s));
		}
		errors = merged;
		return !Object.values(merged).some(Boolean);
	}

	function next() {
		if (!validateStep()) return;
		funnel.stepCompleted({
			tramite: 'transferencia',
			step,
			step_name: stepLabels[step - 1],
			total_steps: 9
		});
		noteProgress(true);
		save();
		if (step < 9) {
			step++;
			funnel.stepViewed({
				tramite: 'transferencia',
				step,
				step_name: stepLabels[step - 1],
				total_steps: 9
			});
		}
	}

	function prev() {
		if (step > 1) step--;
		save();
	}

	async function continueToPayment() {
		if (!validateAllSteps()) {
			payError = 'Revisa los datos del formulario: hay campos incompletos o no válidos.';
			return;
		}
		if (!breakdown || !(breakdown.total > 0)) {
			payError = 'Completa CCAA, fechas y modelo para calcular el importe.';
			return;
		}
		submitting = true;
		payError = null;
		try {
			const marcaLabel = tipoVehiculo === 'coche' ? marcaNombre : marcaMotoNombre;
			const modeloLabel = tipoVehiculo === 'coche' ? modeloNombre : modeloMotoNombre;
			const priceLines = [
				{ label: 'ITP', amount: breakdown.itpAmount },
				{ label: 'Tramitación', amount: breakdown.tramitacion },
				...(breakdown.informeDgt > 0
					? [{ label: 'Informe DGT', amount: breakdown.informeDgt }]
					: [])
			];
			const result = await createSolicitud({
				amount: breakdown.total,
				payload: {
					tipo: 'transferencia',
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
					total: breakdown.total,
					amount: breakdown.total,
					precioBase: tipoVehiculo === 'coche' ? modeloMeta?.precioBase : null,
					factorCorreccion,
					fuenteDepreciacion,
					metaFiscal: {
						valoracionReal: breakdown.valoracionReal,
						baseImponible: breakdown.baseImponible,
						itpAmount: breakdown.itpAmount,
						sinValorBoe: breakdown.sinValorBoe,
						fuente: breakdown.fuente,
						ordenReferencia: 'HAC/1501/2025'
					}
				}
			});

			if (!result.ok) {
				payError = result.error;
				return;
			}

			funnel.submitted({
				tramite: 'transferencia',
				step: 9,
				total_steps: 9,
				order_id: result.solicitudId
			});
			funnel.paymentStarted({ tramite: 'transferencia', step: 9, total_steps: 9 });
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
						<input type="date" bind:value={fechaMatricula} max={todayIso()} />
					</FormField>
				{:else if step === 4}
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
					<FormField label="Primer apellido" error={errors.apellido1} required>
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
					<FormField label="Email de la otra parte (opcional)" error={errors.otraParteEmail}>
						<input type="email" bind:value={otraParteEmail} placeholder="vendedor@email.com" />
					</FormField>
				{:else if step === 7}
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
							disabled={submitting || !acceptPrivacy || !breakdown}
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
					{#if step < 9}
						<button type="button" class="btn" onclick={next}>Siguiente</button>
					{/if}
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
	.ok-actions {
		display: flex;
		gap: 10px;
		justify-content: center;
		flex-wrap: wrap;
	}
	a.btn.secondary {
		background: transparent;
		border: 1px solid var(--navy, #003050);
		color: var(--navy, #003050);
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
