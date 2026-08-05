<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { scrollWizardToTop } from '$lib/utils/scroll';
	import WizardStepper from '$lib/components/ui/WizardStepper.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import ExistingAccountNotice from '$lib/components/ExistingAccountNotice.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import DraftStorageNotice from '$lib/components/DraftStorageNotice.svelte';
	import DraftRestoreNotice from '$lib/components/DraftRestoreNotice.svelte';
	import PrivacyAcceptField from '$lib/components/legal/PrivacyAcceptField.svelte';
	import TramiteDocumentosStep from '$lib/components/tramite/TramiteDocumentosStep.svelte';
	import PartyFields from '$lib/components/tramite/PartyFields.svelte';
	import VehicleModelPicker from '$lib/components/VehicleModelPicker.svelte';
	import MotoModelPicker from '$lib/components/MotoModelPicker.svelte';
	import {
		emptyParty,
		mergeProfileIntoParty,
		flattenParty,
		partyFromFlat,
		type PartyData
	} from '$lib/cuenta/party-prefill';
	import {
		getProfileDocumento,
		ownNifSlotIds
	} from '$lib/cuenta/profile-prefill';
	import type { Profile } from '$lib/supabase/types';
	import {
		vehicleTypeOptions,
		vehicleTypeLabel,
		DEFAULT_VEHICLE_SERVICE,
		vehicleServiceOptions,
		type VehicleType
	} from '$lib/data/vehicle-types';
	import { tramitePricing } from '$lib/data/tramite-options';
	import { getStaticSeo } from '$lib/seo/site';
	import { getDocumentGroups, missingRequiredDocs } from '$lib/tramite/documentos';
	import { loadProfileNifIntoSlots, uploadTramiteDocuments } from '$lib/tramite/upload-docs';
	import { createSolicitud } from '$lib/pago/client';
	import { handleWizardSave } from '$lib/tramite/save';
	import { formatEur } from '$lib/utils/pricing';
	import {
		validateEmail,
		validateMatricula,
		normalizeBastidor,
		validateBastidor,
		validateNifNie,
		validatePhone,
		validateRequired,
		validateCodigoPostal
	} from '$lib/utils/validators';
	import { funnel, initAnalytics } from '$lib/analytics';
	import {
		clearDraft,
		draftLooksMeaningful,
		hasDraftStorageAck,
		loadDraft,
		looksLikeStartedDraft,
		saveDraft,
		setDraftStorageAck
	} from '$lib/tramite/draft';
	import {
		clearDraftFiles,
		draftFilesCount,
		loadDraftFiles,
		removeDraftFile,
		saveDraftFile
	} from '$lib/tramite/draft-files';

	const seo = getStaticSeo('/tramitar/notificacion-venta')!;
	const STORAGE_KEY = 'dgt-notif-venta-wizard';
	const stepLabels = ['Vehículo', 'Comprador', 'Vendedor', 'Documentos', 'Resumen'];
	const TOTAL_STEPS = 5;
	const pricing = tramitePricing.notificacionVenta;

	let step = $state(1);
	let wizardRoot: HTMLElement | undefined = $state();
	let errors = $state<Record<string, string | null>>({});
	let errorSteps = $state<number[]>([]);
	let validationAttempted = $state(false);
	let emailAccountExists = $state(false);
	let profilePrefillDone = $state(false);
	let profileNifPrefillDone = $state(false);
	let submitting = $state(false);
	let saving = $state(false);
	let payError = $state<string | null>(null);
	let saveMsg = $state<string | null>(null);
	let saveError = $state<string | null>(null);
	let solicitudId = $state<string | null>(null);

	let tipoVehiculo = $state<VehicleType>('coche');
	let servicioVehiculo = $state(DEFAULT_VEHICLE_SERVICE);
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
	let rol = $state<'comprador' | 'vendedor'>('comprador');
	let comprador = $state<PartyData>(emptyParty());
	let vendedor = $state<PartyData>(emptyParty());
	let docFiles = $state<Record<string, File | null>>({});
	let acceptPrivacy = $state(false);
	let showDraftNotice = $state(false);
	let showDraftRestore = $state(false);
	let pendingDraft = $state<Record<string, unknown> | null>(null);
	let draftReady = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	const docGroups = $derived(getDocumentGroups('notificacion-venta'));
	const priceLines = $derived({
		lines: [{ label: pricing.label, amount: pricing.total }],
		total: pricing.total
	});

	const activeParty = $derived(rol === 'comprador' ? comprador : vendedor);

	function partyFieldErrors(prefix: 'comprador' | 'vendedor'): Record<string, string | null> {
		const map: Record<string, string> = {
			email: `${prefix}Email`,
			nif: `${prefix}Nif`,
			nombre: `${prefix}Nombre`,
			apellido1: `${prefix}Apellido1`,
			apellido2: `${prefix}Apellido2`,
			telefono: `${prefix}Telefono`,
			provincia: `${prefix}Provincia`,
			municipio: `${prefix}Municipio`,
			direccion: `${prefix}Direccion`,
			numero: `${prefix}Numero`,
			cp: `${prefix}Cp`
		};
		const out: Record<string, string | null> = {};
		for (const [field, key] of Object.entries(map)) {
			if (errors[key]) out[field] = errors[key];
		}
		return out;
	}

	function validateParty(party: PartyData, prefix: 'comprador' | 'vendedor') {
		const cap = (k: string) => prefix + k.charAt(0).toUpperCase() + k.slice(1);
		const e: Record<string, string | null> = {};
		e[`${prefix}Email`] = validateEmail(party.email);
		e[`${prefix}Nif`] = validateNifNie(party.nif);
		e[cap('nombre')] = validateRequired(party.nombre, 'El nombre');
		e[`${prefix}Apellido1`] = validateRequired(party.apellido1, 'El primer apellido');
		e[`${prefix}Apellido2`] = validateRequired(party.apellido2, 'El segundo apellido');
		e[`${prefix}Telefono`] = validatePhone(party.telefono);
		e[`${prefix}Provincia`] = validateRequired(party.provincia, 'La provincia');
		e[`${prefix}Municipio`] = validateRequired(party.municipio, 'El municipio');
		e[`${prefix}Direccion`] = validateRequired(party.direccion, 'El nombre de la vía');
		e[`${prefix}Numero`] = validateRequired(party.numero, 'El número');
		e[`${prefix}Cp`] = validateCodigoPostal(party.cp);
		return e;
	}

	function vehicleLabel(): string {
		if (tipoVehiculo === 'coche') {
			return [marcaNombre, modeloNombre].filter(Boolean).join(' ') || '—';
		}
		if (tipoVehiculo === 'moto') {
			return [marcaMotoNombre, modeloMotoNombre, cilindradaMoto ? `${cilindradaMoto} cc` : '']
				.filter(Boolean)
				.join(' ') || '—';
		}
		return [marcaNombre, modeloNombre].filter(Boolean).join(' ') || '—';
	}

	function autofillParty(target: 'comprador' | 'vendedor') {
		const user = page.data.user;
		const profile = page.data.profile as Profile | null | undefined;
		if (!user) return;
		const merged = mergeProfileIntoParty(target === 'comprador' ? comprador : vendedor, {
			userEmail: user.email,
			profile
		});
		if (target === 'comprador') comprador = merged;
		else vendedor = merged;
		noteProgress(true);
	}

	function prefillActivePartyFromProfile() {
		if (showDraftRestore) return;
		const user = page.data.user;
		const profile = page.data.profile as Profile | null | undefined;
		if (!user) return;
		if (rol === 'comprador') {
			comprador = mergeProfileIntoParty(comprador, { userEmail: user.email, profile });
		} else {
			vendedor = mergeProfileIntoParty(vendedor, { userEmail: user.email, profile });
		}
	}

	onMount(() => {
		initAnalytics();
		funnel.started({ tramite: 'notificacion-venta', total_steps: TOTAL_STEPS });
		funnel.stepViewed({
			tramite: 'notificacion-venta',
			step: 1,
			step_name: stepLabels[0],
			total_steps: TOTAL_STEPS
		});

		const onLeave = () => {
			funnel.abandoned({
				tramite: 'notificacion-venta',
				step,
				step_name: stepLabels[step - 1],
				total_steps: TOTAL_STEPS
			});
		};
		window.addEventListener('pagehide', onLeave);

		if (hasDraftStorageAck()) draftReady = true;
		const data = loadDraft<Record<string, unknown>>(STORAGE_KEY);
		void draftFilesCount(STORAGE_KEY).then((n) => {
			if (draftLooksMeaningful(data) || n > 0) {
				pendingDraft = data ?? {};
				showDraftRestore = true;
				draftReady = false;
			}
		});

		return () => {
			window.removeEventListener('pagehide', onLeave);
			if (saveTimer) clearTimeout(saveTimer);
		};
	});

	function applyDraft(data: Record<string, unknown>) {
		if (typeof data.step === 'number') {
			step = Math.min(Math.max(1, data.step), TOTAL_STEPS);
		}
		if (typeof data.solicitudId === 'string' && data.solicitudId) {
			solicitudId = data.solicitudId;
		}
		if (data.tipoVehiculo === 'coche' || data.tipoVehiculo === 'moto' || data.tipoVehiculo === 'caravana') {
			tipoVehiculo = data.tipoVehiculo;
		}
		if (typeof data.servicioVehiculo === 'string') servicioVehiculo = data.servicioVehiculo;
		if (typeof data.matricula === 'string') matricula = data.matricula;
		if (typeof data.bastidor === 'string') bastidor = normalizeBastidor(data.bastidor).slice(0, 17);
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
		if (data.rol === 'comprador' || data.rol === 'vendedor') rol = data.rol;
		comprador = partyFromFlat('comprador', data);
		vendedor = partyFromFlat('vendedor', data);
	}

	async function applyProfileNifPrefill() {
		if (profileNifPrefillDone || showDraftRestore) return;
		const user = page.data.user;
		const profile = page.data.profile as Profile | null | undefined;
		if (!user) return;
		const hasAny =
			getProfileDocumento(profile, 'nif_frontal') || getProfileDocumento(profile, 'nif_trasero');
		if (!hasAny) {
			profileNifPrefillDone = true;
			return;
		}
		const slots = ownNifSlotIds(docGroups, { rol });
		if (!slots.length) {
			profileNifPrefillDone = true;
			return;
		}
		profileNifPrefillDone = true;
		await loadProfileNifIntoSlots({
			slotIds: slots,
			current: docFiles,
			onfile: (id, file) => {
				docFiles = { ...docFiles, [id]: file };
				void saveDraftFile(STORAGE_KEY, id, file);
			}
		});
		noteProgress(true);
	}

	function applyProfilePrefill() {
		if (profilePrefillDone || showDraftRestore) return;
		const user = page.data.user;
		if (!user) return;
		prefillActivePartyFromProfile();
		profilePrefillDone = true;
		void applyProfileNifPrefill();
	}

	async function continueDraft() {
		if (pendingDraft) applyDraft(pendingDraft);
		pendingDraft = null;
		showDraftRestore = false;
		setDraftStorageAck();
		draftReady = true;
		docFiles = await loadDraftFiles(STORAGE_KEY);
		profilePrefillDone = false;
		profileNifPrefillDone = false;
		applyProfilePrefill();
	}

	function startFreshDraft() {
		clearDraft(STORAGE_KEY);
		void clearDraftFiles(STORAGE_KEY);
		docFiles = {};
		pendingDraft = null;
		showDraftRestore = false;
		if (hasDraftStorageAck()) draftReady = true;
		profilePrefillDone = false;
		profileNifPrefillDone = false;
		applyProfilePrefill();
	}

	function draftSnapshot(): Record<string, unknown> {
		return {
			step,
			solicitudId,
			tipoVehiculo,
			servicioVehiculo,
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
			rol,
			...flattenParty('comprador', comprador),
			...flattenParty('vendedor', vendedor)
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
			looksLikeStartedDraft(comprador.email) ||
			looksLikeStartedDraft(vendedor.email) ||
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
		void servicioVehiculo;
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
		void rol;
		void comprador;
		void vendedor;
		void acceptPrivacy;
		void docFiles;
		scheduleSave();
	});

	$effect(() => {
		if (!validationAttempted) return;
		void step;
		void tipoVehiculo;
		void servicioVehiculo;
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
		void rol;
		void comprador;
		void vendedor;
		void acceptPrivacy;
		void docFiles;
		applyValidationState();
	});

	function validateStepAt(s: number): Record<string, string | null> {
		const e: Record<string, string | null> = {};
		if (s === 1) {
			e.matricula = validateMatricula(matricula);
			if (bastidor.trim()) e.bastidor = validateBastidor(bastidor);
			e.servicioVehiculo = validateRequired(servicioVehiculo, 'El servicio del vehículo');
			if (tipoVehiculo === 'coche') {
				e.marca = validateRequired(marcaId, 'La marca');
				e.combustible = validateRequired(combustibleId, 'El combustible');
				e.modelo = validateRequired(modeloId, 'El modelo');
			} else if (tipoVehiculo === 'moto') {
				e.marca = validateRequired(marcaMotoId, 'La marca');
				e.modelo = validateRequired(modeloMotoNombre || modeloMotoId, 'El modelo');
				e.cilindrada = validateRequired(String(cilindradaMoto ?? ''), 'La cilindrada');
			} else {
				e.marca = validateRequired(marcaNombre, 'La marca');
				e.modelo = validateRequired(modeloNombre, 'El modelo');
			}
		}
		if (s === 2) {
			Object.assign(e, validateParty(comprador, 'comprador'));
		}
		if (s === 3) {
			Object.assign(e, validateParty(vendedor, 'vendedor'));
		}
		if (s === 4) {
			const missing = missingRequiredDocs(docGroups, docFiles);
			if (missing.length) {
				e.docs = 'Sube todos los documentos obligatorios (foto o archivo).';
				for (const id of missing) {
					e[id] = 'Documento obligatorio';
				}
			}
		}
		if (s === 5) {
			if (!acceptPrivacy) e.privacy = 'Debes aceptar la política de privacidad';
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

	function applyValidationState(): boolean {
		const merged: Record<string, string | null> = {};
		const bad: number[] = [];
		for (let s = 1; s <= TOTAL_STEPS; s++) {
			const stepErrors = validateStepAt(s);
			Object.assign(merged, stepErrors);
			if (Object.values(stepErrors).some(Boolean)) bad.push(s);
		}
		errors = merged;
		errorSteps = bad;
		const ok = bad.length === 0;
		if (ok && payError?.startsWith('Revisa los datos del formulario')) {
			payError = null;
		}
		return ok;
	}

	function validateAllSteps(): boolean {
		validationAttempted = true;
		return applyValidationState();
	}

	function goTo(n: number) {
		if (n < 1 || n > TOTAL_STEPS || n === step) return;
		funnel.stepViewed({
			tramite: 'notificacion-venta',
			step: n,
			step_name: stepLabels[n - 1],
			total_steps: TOTAL_STEPS
		});
		step = n;
		noteProgress(true);
		save();
		void scrollWizardToTop(wizardRoot);
	}

	$effect(() => {
		void page.data.user;
		void page.data.profile;
		void showDraftRestore;
		applyProfilePrefill();
	});

	$effect(() => {
		void rol;
		if (!profilePrefillDone || showDraftRestore || !page.data.user) return;
		prefillActivePartyFromProfile();
		const slots = ownNifSlotIds(docGroups, { rol });
		const missing = slots.filter((id) => !docFiles[id]);
		if (!missing.length) return;
		void loadProfileNifIntoSlots({
			slotIds: missing,
			current: docFiles,
			onfile: (id, file) => {
				docFiles = { ...docFiles, [id]: file };
				void saveDraftFile(STORAGE_KEY, id, file);
			}
		});
	});

	function next() {
		funnel.stepCompleted({
			tramite: 'notificacion-venta',
			step,
			step_name: stepLabels[step - 1],
			total_steps: TOTAL_STEPS
		});
		noteProgress(true);
		save();
		if (step < TOTAL_STEPS) {
			step++;
			funnel.stepViewed({
				tramite: 'notificacion-venta',
				step,
				step_name: stepLabels[step - 1],
				total_steps: TOTAL_STEPS
			});
			void scrollWizardToTop(wizardRoot);
		}
	}

	function prev() {
		if (step > 1) {
			step--;
			save();
			void scrollWizardToTop(wizardRoot);
		}
	}

	function buildPayload(): Record<string, unknown> {
		const marcaLabel =
			tipoVehiculo === 'coche' ? marcaNombre : tipoVehiculo === 'moto' ? marcaMotoNombre : marcaNombre;
		const modeloLabel =
			tipoVehiculo === 'coche'
				? modeloNombre
				: tipoVehiculo === 'moto'
					? modeloMotoNombre
					: modeloNombre;
		const solicitante = activeParty;
		return {
			tipo: 'notificacion-venta',
			wizardStep: step,
			rol,
			tipoVehiculo,
			servicioVehiculo,
			matricula,
			bastidor: bastidor || undefined,
			marca: marcaLabel,
			modelo: modeloLabel,
			marcaNombre: marcaLabel,
			modeloNombre: modeloLabel,
			marcaId: tipoVehiculo === 'coche' ? marcaId : tipoVehiculo === 'moto' ? marcaMotoId : undefined,
			modeloId:
				tipoVehiculo === 'coche' ? modeloId : tipoVehiculo === 'moto' ? modeloMotoId || undefined : undefined,
			combustible: tipoVehiculo === 'coche' ? combustibleNombre : undefined,
			combustibleId: tipoVehiculo === 'coche' ? combustibleId : undefined,
			modeloMeta: tipoVehiculo === 'coche' ? modeloMeta : undefined,
			cilindrada: tipoVehiculo === 'moto' ? cilindradaMoto : undefined,
			email: solicitante.email,
			nif: solicitante.nif,
			nombre: solicitante.nombre,
			apellido1: solicitante.apellido1,
			apellido2: solicitante.apellido2,
			telefono: solicitante.telefono,
			cp: solicitante.cp,
			direccion: solicitante.direccion,
			provincia: solicitante.provincia,
			municipio: solicitante.municipio,
			tipoVia: solicitante.tipoVia,
			numero: solicitante.numero,
			piso: solicitante.piso,
			puerta: solicitante.puerta,
			...flattenParty('comprador', comprador),
			...flattenParty('vendedor', vendedor),
			docsAttached: Object.keys(docFiles).filter((k) => docFiles[k]),
			acceptPrivacy,
			priceLines: priceLines.lines,
			total: priceLines.total,
			amount: priceLines.total
		};
	}

	function setDocFile(id: string, file: File | null) {
		docFiles = { ...docFiles, [id]: file };
		if (file) void saveDraftFile(STORAGE_KEY, id, file);
		else void removeDraftFile(STORAGE_KEY, id);
		noteProgress(true);
	}

	async function uploadDocsIfAny(id: string, accessToken?: string | null) {
		const result = await uploadTramiteDocuments({
			solicitudId: id,
			files: docFiles,
			accessToken,
			rol
		});
		if (!result.ok) {
			payError = result.error;
			saveError = result.error;
			return false;
		}
		return true;
	}

	async function saveToAccount() {
		saving = true;
		saveMsg = null;
		saveError = null;
		try {
			const outcome = await handleWizardSave({
				tipo: 'notificacion-venta',
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
			const okUpload = await uploadDocsIfAny(solicitudId);
			if (!okUpload) return;
			saveMsg =
				outcome.result.message +
				(Object.values(docFiles).some(Boolean) ? ' Documentos subidos.' : '');
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
		submitting = true;
		payError = null;
		try {
			const result = await createSolicitud({
				amount: priceLines.total,
				solicitudId,
				payload: buildPayload()
			});

			if (!result.ok) {
				payError = result.error;
				return;
			}

			const okUpload = await uploadDocsIfAny(result.solicitudId, result.accessToken);
			if (!okUpload) return;

			funnel.submitted({
				tramite: 'notificacion-venta',
				step: TOTAL_STEPS,
				total_steps: TOTAL_STEPS,
				order_id: result.solicitudId
			});
			funnel.paymentStarted({
				tramite: 'notificacion-venta',
				step: TOTAL_STEPS,
				total_steps: TOTAL_STEPS
			});
			clearDraft(STORAGE_KEY);
			void clearDraftFiles(STORAGE_KEY);
			await goto(result.pagoUrl);
		} finally {
			submitting = false;
		}
	}
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section wizard-scroll-root" bind:this={wizardRoot}>
	<div class="wrap layout">
		<div class="main card pad">
			<WizardStepper current={step} labels={stepLabels} {errorSteps} onchange={goTo} />
			<h1>Notificación de venta</h1>
			{#if saveMsg}<p class="save-ok" role="status">{saveMsg}</p>{/if}
			{#if saveError}<p class="err" role="alert">{saveError}</p>{/if}

			{#if step === 1}
				<FormField label="Tipo de vehículo" required>
					<RadioCards
						name="tipoVehiculo"
						bind:value={tipoVehiculo}
						options={[...vehicleTypeOptions]}
					/>
				</FormField>
				<FormField label="Matrícula" error={errors.matricula} hint="Ej: 3990 WDS" required>
					<input bind:value={matricula} placeholder="3990WDS" oninput={() => noteProgress()} />
				</FormField>
				<FormField label="Servicio del vehículo" error={errors.servicioVehiculo} required>
					<select bind:value={servicioVehiculo}>
						{#each vehicleServiceOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
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
				{:else if tipoVehiculo === 'moto'}
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
				{:else}
					<div class="row-2">
						<FormField label="Marca" error={errors.marca} required>
							<input bind:value={marcaNombre} placeholder="Ej. Knaus, Tabbert…" />
						</FormField>
						<FormField label="Modelo" error={errors.modelo} required>
							<input bind:value={modeloNombre} placeholder="Ej. Sport 500 QDK" />
						</FormField>
					</div>
				{/if}
				<FormField
					label="Bastidor (VIN)"
					error={errors.bastidor}
					hint="Opcional. 17 caracteres de la ficha técnica (sin I, O ni Q)"
				>
					<input
						bind:value={bastidor}
						placeholder="Ej. VF1ABCDEF12345678"
						maxlength="20"
						autocomplete="off"
						spellcheck="false"
						oninput={() => {
							bastidor = normalizeBastidor(bastidor).slice(0, 17);
							const err = bastidor ? validateBastidor(bastidor) : null;
							if (!err || errors.bastidor) {
								errors = { ...errors, bastidor: err };
							}
							noteProgress();
						}}
					/>
				</FormField>
			{:else if step === 2}
				<FormField label="¿Cuál es tu rol en la venta?" required>
					<RadioCards
						name="rol"
						bind:value={rol}
						options={[
							{ value: 'comprador', label: 'Soy el comprador' },
							{ value: 'vendedor', label: 'Soy el vendedor' }
						]}
					/>
				</FormField>
				<PartyFields
					title="Datos del comprador"
					bind:party={comprador}
					errors={partyFieldErrors('comprador')}
					showAutofill={rol === 'comprador' || !!page.data.user}
					onautofill={() => autofillParty('comprador')}
				/>
				{#if comprador.email.trim() && !validateEmail(comprador.email) && !page.data.user}
					<ExistingAccountNotice bind:exists={emailAccountExists} email={comprador.email.trim()} />
				{/if}
			{:else if step === 3}
				<PartyFields
					title="Datos del vendedor"
					bind:party={vendedor}
					errors={partyFieldErrors('vendedor')}
					showAutofill={rol === 'vendedor' || !!page.data.user}
					onautofill={() => autofillParty('vendedor')}
				/>
			{:else if step === 4}
				{#if errors.docs}<p class="err">{errors.docs}</p>{/if}
				<TramiteDocumentosStep groups={docGroups} files={docFiles} {errors} onfile={setDocFile} />
			{:else}
				<div class="summary">
					<h2>Resumen de tu solicitud</h2>
					<p class="summary-lead">
						Revisa los datos antes de continuar a la pasarela de pago.
					</p>
					<ul>
						<li>
							<span>Vehículo</span>
							<span>{matricula || '—'} · {vehicleTypeLabel(tipoVehiculo)} · {vehicleLabel()}</span>
						</li>
						<li><span>Bastidor</span><span>{bastidor || '—'}</span></li>
						<li><span>Servicio</span><span>{servicioVehiculo || '—'}</span></li>
						<li><span>Tu rol</span><span>{rol === 'comprador' ? 'Comprador' : 'Vendedor'}</span></li>
						<li>
							<span>Comprador</span>
							<span>{comprador.nombre} {comprador.apellido1} {comprador.apellido2}</span>
						</li>
						<li><span>NIF comprador</span><span>{comprador.nif || '—'}</span></li>
						<li>
							<span>Vendedor</span>
							<span>{vendedor.nombre} {vendedor.apellido1} {vendedor.apellido2}</span>
						</li>
						<li><span>NIF vendedor</span><span>{vendedor.nif || '—'}</span></li>
						<li><span>Email contacto</span><span>{activeParty.email}</span></li>
						<li><span>Teléfono contacto</span><span>{activeParty.telefono || '—'}</span></li>
						<li><span>Total</span><span>{formatEur(priceLines.total)}</span></li>
					</ul>
					<ExistingAccountNotice
						bind:exists={emailAccountExists}
						email={activeParty.email}
						mode="reminder"
					/>
					<PrivacyAcceptField bind:checked={acceptPrivacy} error={errors.privacy} />
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

		<aside class="sidebar card">
			<h3>Importe</h3>
			<div class="total">{formatEur(priceLines.total)}</div>
			<ul class="lines">
				{#each priceLines.lines as line}
					<li><span>{line.label}</span><span>{formatEur(line.amount)}</span></li>
				{/each}
			</ul>
		</aside>
	</div>
</section>

<DraftStorageNotice open={showDraftNotice} onconfirm={confirmDraftNotice} />
<DraftRestoreNotice
	open={showDraftRestore}
	oncontinue={continueDraft}
	onfresh={startFreshDraft}
/>

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
	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
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
		letter-spacing: 0.5px;
		margin-bottom: 12px;
	}
	.sidebar .total {
		font-size: 36px;
		font-weight: 800;
		color: var(--primary);
		letter-spacing: -0.03em;
		margin-bottom: 20px;
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
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.row-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
