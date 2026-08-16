<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { scrollWizardToTop } from '$lib/utils/scroll';
	import WizardStepper from '$lib/components/ui/WizardStepper.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import ExistingAccountNotice from '$lib/components/ExistingAccountNotice.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import PartyFields from '$lib/components/tramite/PartyFields.svelte';
	import {
		emptyParty,
		mergeProfileIntoParty,
		flattenParty,
		partyFromFlat,
		inferUserPartyRole,
		contactParty,
		partyDisplayName,
		type PartyData
	} from '$lib/cuenta/party-prefill';
	import {
		getProfileDocumento,
		ownNifSlotIds
	} from '$lib/cuenta/profile-prefill';
	import type { Profile } from '$lib/supabase/types';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import {
		vehicleTypeOptions,
		vehicleTypeLabel,
		DEFAULT_VEHICLE_SERVICE,
		vehicleServiceOptions,
		type VehicleType
	} from '$lib/data/vehicle-types';
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
		normalizeBastidor,
		validateBastidor,
		validateNifNie,
		validatePhone,
		validateRequired,
		validateCodigoPostal,
		validateDate,
		validateDateOrder,
		todayIso,
		isCifDocumento
	} from '$lib/utils/validators';
	import { funnel, initAnalytics } from '$lib/analytics';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import DraftStorageNotice from '$lib/components/DraftStorageNotice.svelte';
	import DraftRestoreNotice from '$lib/components/DraftRestoreNotice.svelte';
	import PrivacyAcceptField from '$lib/components/legal/PrivacyAcceptField.svelte';
	import TramiteDocumentosStep from '$lib/components/tramite/TramiteDocumentosStep.svelte';
	import { getStaticSeo } from '$lib/seo/site';
	import { getDocumentGroups, missingRequiredDocs } from '$lib/tramite/documentos';
	import { loadProfileNifIntoSlots, uploadTramiteDocuments } from '$lib/tramite/upload-docs';
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

	const seo = getStaticSeo('/tramitar/transferencia')!;
	const STORAGE_KEY = 'dgt-transfer-wizard';
	const stepLabels = ['Vehículo', 'Comprador', 'Vendedor', 'Documentos', 'Resumen'];
	const TOTAL_STEPS = 5;

	/** Remapea borradores del wizard antiguo (4 o 9 pasos) al flujo de 5 pasos. */
	function clampLegacyStep(raw: number, data: Record<string, unknown>): number {
		if (raw < 1) return 1;
		const legacy4 =
			!data.compradorEmail && typeof data.email === 'string' && data.email.trim() !== '';
		if (legacy4) {
			if (raw === 1) return 1;
			if (raw === 2) return 2;
			if (raw === 3) return 4;
			return 5;
		}
		if (raw <= TOTAL_STEPS) return raw;
		if (raw <= 5) return 1;
		if (raw <= 6) return 2;
		if (raw <= 7) return 3;
		if (raw <= 8) return 4;
		return 5;
	}

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

	// Form state
	let tipoVehiculo = $state<VehicleType>('coche');
	let servicioVehiculo = $state(DEFAULT_VEHICLE_SERVICE);
	let kilometros = $state<string | number>('');
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
	let motivoTransferencia = $state<'compraventa' | 'donacion'>('compraventa');
	let liquidarItp = $state('si');
	let comprador = $state<PartyData>(emptyParty());
	let vendedor = $state<PartyData>(emptyParty());
	let docFiles = $state<Record<string, File | null>>({});
	let acceptPrivacy = $state(false);
	let showDraftNotice = $state(false);
	let showDraftRestore = $state(false);
	let pendingDraft = $state<Record<string, unknown> | null>(null);
	let draftReady = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	/** Slots NIF ya precargados (evita reintentos y no adivinar rol). */
	let nifPrefillSlotsDone = $state<Set<string>>(new Set());
	/** Paso 1: primero tipo + matrícula; el resto se revela al completar. */
	let vehicleDetailsUnlocked = $state(false);

	const docGroups = $derived(
		getDocumentGroups('transferencia', { facturaEmpresa, liquidarItp, motivoTransferencia })
	);
	const userMatch = $derived.by(() => {
		const user = page.data.user;
		const profile = page.data.profile as Profile | null | undefined;
		return {
			userEmail: user?.email ?? null,
			profileNif: profile?.nif ?? null
		};
	});
	const inferredRol = $derived(
		inferUserPartyRole(comprador, vendedor, userMatch)
	);
	const activeParty = $derived(contactParty(comprador, vendedor, inferredRol));

	function unlockVehicleDetails() {
		vehicleDetailsUnlocked = true;
	}

	$effect(() => {
		if (!validateMatricula(matricula)) unlockVehicleDetails();
	});

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
		e[cap('nombre')] = validateRequired(
			party.nombre,
			isCifDocumento(party.nif) ? 'La razón social' : 'El nombre'
		);
		e[`${prefix}Apellido1`] = isCifDocumento(party.nif)
			? null
			: validateRequired(party.apellido1, 'El primer apellido');
		e[`${prefix}Apellido2`] = null;
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
		try {
			return buildTransferBreakdown({
				precioVenta,
				ccaaId,
				tipoVehiculo: tipoVehiculo === 'caravana' ? 'coche' : tipoVehiculo,
				incluirInforme: incluirInforme === 'si',
				precioBase: tipoVehiculo === 'coche' ? modeloMeta?.precioBase : null,
				factorCorreccion: needsFactor ? factorCorreccion : null,
				facturaEmpresa: facturaEmpresa === 'si',
				liquidarItp: motivoTransferencia !== 'donacion' && liquidarItp === 'si',
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
		if (typeof data.step === 'number') step = clampLegacyStep(data.step, data);
		if (typeof data.solicitudId === 'string' && data.solicitudId) {
			solicitudId = data.solicitudId;
		}
		if (
			data.tipoVehiculo === 'coche' ||
			data.tipoVehiculo === 'moto' ||
			data.tipoVehiculo === 'caravana'
		) {
			tipoVehiculo = data.tipoVehiculo;
		}
		if (typeof data.servicioVehiculo === 'string') servicioVehiculo = data.servicioVehiculo;
		if (typeof data.kilometros === 'number' || typeof data.kilometros === 'string') {
			kilometros = data.kilometros;
		}
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
		if (typeof data.fechaMatricula === 'string') fechaMatricula = data.fechaMatricula;
		if (typeof data.ccaaId === 'string') ccaaId = data.ccaaId;
		if (typeof data.precioVenta === 'number') precioVenta = data.precioVenta;
		if (typeof data.fechaVenta === 'string') fechaVenta = data.fechaVenta;
		if (typeof data.facturaEmpresa === 'string') facturaEmpresa = data.facturaEmpresa;
		if (typeof data.incluirInforme === 'string') incluirInforme = data.incluirInforme;
		if (data.motivoTransferencia === 'compraventa' || data.motivoTransferencia === 'donacion') {
			motivoTransferencia = data.motivoTransferencia;
		}
		if (typeof data.liquidarItp === 'string') liquidarItp = data.liquidarItp;
		comprador = partyFromFlat('comprador', data);
		vendedor = partyFromFlat('vendedor', data);
		const hasVehicleDetails =
			Boolean(data.bastidor) ||
			Boolean(data.marcaId) ||
			Boolean(data.marcaNombre) ||
			Boolean(data.marcaMotoId) ||
			Boolean(data.modeloNombre) ||
			Boolean(data.fechaMatricula) ||
			Boolean(data.ccaaId);
		if (hasVehicleDetails || !validateMatricula(typeof data.matricula === 'string' ? data.matricula : '')) {
			unlockVehicleDetails();
		}
		const hasLegacy =
			typeof data.email === 'string' &&
			data.email.trim() !== '' &&
			!data.compradorEmail &&
			!data.vendedorEmail;
		if (hasLegacy) {
			const legacy = partyFromFlat('', data);
			const legacyRol =
				data.rol === 'vendedor' ? 'vendedor' : data.rol === 'comprador' ? 'comprador' : null;
			if (legacyRol === 'vendedor' && !vendedor.email) vendedor = legacy;
			else if (!comprador.email) comprador = legacy;
			else if (!vendedor.email) vendedor = legacy;
		}
	}

	function applyProfilePrefill() {
		if (profilePrefillDone || showDraftRestore) return;
		if (!page.data.user) return;
		// No rellenar una parte por defecto: el usuario usa «Autocompletar» en comprador o vendedor.
		profilePrefillDone = true;
		void syncProfileNifDocs();
	}

	async function syncProfileNifDocs() {
		if (showDraftRestore) return;
		const user = page.data.user;
		const profile = page.data.profile as Profile | null | undefined;
		if (!user) return;
		const hasAny =
			getProfileDocumento(profile, 'nif_frontal') || getProfileDocumento(profile, 'nif_trasero');
		if (!hasAny) {
			profileNifPrefillDone = true;
			return;
		}
		const rol = inferredRol;
		if (!rol) return;
		const slots = ownNifSlotIds(docGroups, { rol }).filter(
			(id) => !docFiles[id] && !nifPrefillSlotsDone.has(id)
		);
		if (!slots.length) {
			profileNifPrefillDone = true;
			return;
		}
		profileNifPrefillDone = true;
		nifPrefillSlotsDone = new Set([...nifPrefillSlotsDone, ...slots]);
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

	async function continueDraft() {
		if (pendingDraft) applyDraft(pendingDraft);
		pendingDraft = null;
		showDraftRestore = false;
		setDraftStorageAck();
		draftReady = true;
		docFiles = await loadDraftFiles(STORAGE_KEY);
		profilePrefillDone = false;
		profileNifPrefillDone = false;
		nifPrefillSlotsDone = new Set();
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
		nifPrefillSlotsDone = new Set();
		vehicleDetailsUnlocked = false;
		applyProfilePrefill();
	}

	function draftSnapshot(): Record<string, unknown> {
		return {
			step,
			solicitudId,
			tipoVehiculo,
			servicioVehiculo,
			kilometros,
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
			motivoTransferencia,
			liquidarItp,
			rol: inferredRol,
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
		void kilometros;
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
		void motivoTransferencia;
		void liquidarItp;
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
		void kilometros;
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
		void comprador;
		void vendedor;
		void acceptPrivacy;
		void docFiles;
		void breakdown;
		applyValidationState();
	});

	function validateStepAt(s: number): Record<string, string | null> {
		const e: Record<string, string | null> = {};
		if (s === 1) {
			e.matricula = validateMatricula(matricula);
			e.bastidor = validateBastidor(bastidor);
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

	function applyValidationState(): boolean {
		const merged: Record<string, string | null> = {};
		const bad: number[] = [];
		for (let s = 1; s <= TOTAL_STEPS; s++) {
			const e = validateStepAt(s);
			Object.assign(merged, e);
			if (Object.values(e).some(Boolean)) bad.push(s);
		}
		errors = merged;
		errorSteps = bad;
		const ok = bad.length === 0;
		if (
			ok &&
			payError &&
			(payError.startsWith('Revisa los datos del formulario') ||
				payError.startsWith('Completa CCAA'))
		) {
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
		if (n !== 1) unlockVehicleDetails();
		funnel.stepViewed({
			tramite: 'transferencia',
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

	/** Cuando el email/NIF de una parte coincide con el perfil, carga su NIF en esos slots. */
	$effect(() => {
		void comprador.email;
		void comprador.nif;
		void vendedor.email;
		void vendedor.nif;
		void inferredRol;
		if (!profilePrefillDone || showDraftRestore || !page.data.user) return;
		void syncProfileNifDocs();
	});

	function next() {
		if (step === 1 && !vehicleDetailsUnlocked) {
			unlockVehicleDetails();
			noteProgress(true);
			save();
			return;
		}
		if (step >= TOTAL_STEPS) return;
		funnel.stepCompleted({
			tramite: 'transferencia',
			step,
			step_name: stepLabels[step - 1],
			total_steps: TOTAL_STEPS
		});
		noteProgress(true);
		save();
		step++;
		funnel.stepViewed({
			tramite: 'transferencia',
			step,
			step_name: stepLabels[step - 1],
			total_steps: TOTAL_STEPS
		});
		void scrollWizardToTop(wizardRoot);
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
			tipoVehiculo === 'coche'
				? marcaNombre
				: tipoVehiculo === 'moto'
					? marcaMotoNombre
					: marcaNombre;
		const modeloLabel =
			tipoVehiculo === 'coche'
				? modeloNombre
				: tipoVehiculo === 'moto'
					? modeloMotoNombre
					: modeloNombre;
		const solicitante = activeParty;
		const priceLines = breakdown
			? [
					...(breakdown.itpAmount > 0 ? [{ label: 'ITP', amount: breakdown.itpAmount }] : []),
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
			servicioVehiculo,
			kilometros: kilometros === '' ? undefined : kilometros,
			matricula,
			bastidor,
			marca: marcaLabel,
			modelo: modeloLabel,
			marcaNombre: marcaLabel,
			modeloNombre: modeloLabel,
			marcaId:
				tipoVehiculo === 'coche' ? marcaId : tipoVehiculo === 'moto' ? marcaMotoId : undefined,
			modeloId:
				tipoVehiculo === 'coche'
					? modeloId
					: tipoVehiculo === 'moto'
						? modeloMotoId || undefined
						: undefined,
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
			motivoTransferencia,
			liquidarItp,
			rol: inferredRol,
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
			rol: inferredRol
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
			unlockVehicleDetails();
			step = firstInvalidStep();
			void scrollWizardToTop(wizardRoot);
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

			const okUpload = await uploadDocsIfAny(result.solicitudId, result.accessToken);
			if (!okUpload) return;

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
			<h1>Transferencia de vehículos</h1>
			{#if saveMsg}<p class="save-ok" role="status">{saveMsg}</p>{/if}
			{#if saveError}<p class="err" role="alert">{saveError}</p>{/if}

				{#if step === 1}
					<p class="step-lead">
						Empieza por el tipo de vehículo y la matrícula. Después te pediremos el resto de
						datos.
					</p>
					<FormField label="Tipo de vehículo" required>
						<RadioCards
							name="tipo"
							bind:value={tipoVehiculo}
							options={[...vehicleTypeOptions]}
						/>
					</FormField>
					<FormField label="Matrícula" error={errors.matricula} hint="Ej: 3990 WDS" required>
						<input
							bind:value={matricula}
							placeholder="3990WDS"
							oninput={() => noteProgress()}
						/>
					</FormField>

					{#if !vehicleDetailsUnlocked}
						<p class="reveal-hint">
							Cuando indiques una matrícula válida aparecerán marca, modelo y el resto de
							campos.
						</p>
					{:else}
						<div class="reveal-block">
							<h2 class="step-sub">Datos del vehículo</h2>
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
							<FormField label="Servicio del vehículo" error={errors.servicioVehiculo} required>
								<select bind:value={servicioVehiculo}>
									{#each vehicleServiceOptions as opt}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
							</FormField>
							<FormField
								label="Bastidor (VIN)"
								error={errors.bastidor}
								hint="17 caracteres de la ficha técnica (sin espacios ni guiones; sin I, O ni Q)"
								required
							>
								<input
									bind:value={bastidor}
									placeholder="Ej. VF1ABCDEF12345678"
									maxlength="20"
									autocomplete="off"
									spellcheck="false"
									oninput={() => {
										bastidor = normalizeBastidor(bastidor).slice(0, 17);
										const err = validateBastidor(bastidor);
										if (!err || errors.bastidor) {
											errors = { ...errors, bastidor: err };
										}
										noteProgress();
									}}
								/>
							</FormField>
							<FormField label="Kilómetros" hint="Opcional. Kilometraje actual del vehículo">
								<input
									type="number"
									bind:value={kilometros}
									min="0"
									placeholder="Ej. 85000"
									oninput={() => noteProgress()}
								/>
							</FormField>
							<FormField label="Fecha primera matrícula" error={errors.fechaMatricula} required>
								<DateInput bind:value={fechaMatricula} max={todayIso()} />
							</FormField>

							<h2 class="step-sub">Datos de la operación</h2>
							<FormField label="CCAA del comprador" error={errors.ccaa} required>
								<SearchSelect options={ccaaOptions} bind:value={ccaaId} />
							</FormField>
							<FormField label="Precio compraventa (€)" error={errors.precioVenta} required>
								<input type="number" bind:value={precioVenta} min="0" />
							</FormField>
							<FormField label="Fecha de venta" error={errors.fechaVenta} required>
								<DateInput bind:value={fechaVenta} max={todayIso()} />
							</FormField>
							<FormField label="¿Trámite de compraventa o donación?" required>
								<RadioCards
									name="motivoTransferencia"
									bind:value={motivoTransferencia}
									options={[
										{ value: 'compraventa', label: 'Compraventa' },
										{ value: 'donacion', label: 'Donación' }
									]}
								/>
							</FormField>
							{#if motivoTransferencia === 'compraventa'}
								<FormField
									label="¿Liquidar ITP con nosotros?"
									hint="Si ya lo has pagado en Hacienda, elige No y adjunta el modelo 620/621 en documentos."
								>
									<RadioCards
										name="liquidarItp"
										bind:value={liquidarItp}
										options={[
											{ value: 'si', label: 'Sí' },
											{ value: 'no', label: 'No' }
										]}
									/>
								</FormField>
							{:else}
								<p class="reveal-hint">
									En donación no liquidamos ITP (corresponde el Impuesto de Sucesiones y
									Donaciones, que gestiona Hacienda). El presupuesto incluye solo la tramitación
									DGT.
								</p>
							{/if}
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
						</div>
					{/if}
				{:else if step === 2}
					<PartyFields
						title="Datos del comprador"
						bind:party={comprador}
						errors={partyFieldErrors('comprador')}
						showAutofill={!!page.data.user}
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
						showAutofill={!!page.data.user}
						onautofill={() => autofillParty('vendedor')}
					/>
				{:else if step === 4}
					{#if errors.docs}<p class="err">{errors.docs}</p>{/if}
					<TramiteDocumentosStep
						groups={docGroups}
						files={docFiles}
						{errors}
						onfile={setDocFile}
					/>
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
									>{matricula || '—'} · {vehicleTypeLabel(tipoVehiculo)} · {vehicleLabel()}</span
								>
							</li>
							<li><span>Bastidor</span><span>{bastidor || '—'}</span></li>
							<li><span>Servicio</span><span>{servicioVehiculo || '—'}</span></li>
							{#if kilometros !== ''}
								<li><span>Kilómetros</span><span>{kilometros}</span></li>
							{/if}
							<li>
								<span>Comprador</span>
								<span>{partyDisplayName(comprador)}</span>
							</li>
							<li><span>NIF comprador</span><span>{comprador.nif || '—'}</span></li>
							<li><span>Email comprador</span><span>{comprador.email || '—'}</span></li>
							<li>
								<span>Vendedor</span>
								<span>{partyDisplayName(vendedor)}</span>
							</li>
							<li><span>NIF vendedor</span><span>{vendedor.nif || '—'}</span></li>
							<li><span>Email vendedor</span><span>{vendedor.email || '—'}</span></li>
							<li><span>Total</span><span>{breakdown ? formatEur(breakdown.total) : '—'}</span></li>
						</ul>
						<ExistingAccountNotice
							bind:exists={emailAccountExists}
							email={activeParty.email}
							mode="reminder"
						/>
						<PrivacyAcceptField bind:checked={acceptPrivacy} error={errors.privacy} />
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
		margin-bottom: 12px;
	}
	.step-lead {
		margin: 0 0 22px;
		color: var(--text2);
		font-size: 0.95rem;
		line-height: 1.45;
		max-width: 36em;
	}
	.reveal-hint {
		margin: 8px 0 0;
		padding: 14px 16px;
		border-radius: 10px;
		background: #f3f7fb;
		border: 1px solid #d7e3ef;
		color: var(--text2);
		font-size: 0.92rem;
		line-height: 1.45;
	}
	.reveal-block {
		margin-top: 8px;
		animation: reveal-in 0.35s ease;
	}
	.step-sub {
		font-size: 1.05rem;
		font-weight: 800;
		margin: 28px 0 16px;
		padding-top: 8px;
		border-top: 1px solid var(--border);
		color: var(--ink);
	}
	.reveal-block > .step-sub:first-child {
		margin-top: 20px;
		padding-top: 0;
		border-top: none;
	}
	@keyframes reveal-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
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
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.row-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
