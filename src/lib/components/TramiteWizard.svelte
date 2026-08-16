<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { scrollWizardToTop } from '$lib/utils/scroll';
	import WizardStepper from '$lib/components/ui/WizardStepper.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import NifInput from '$lib/components/ui/NifInput.svelte';
	import ExistingAccountNotice from '$lib/components/ExistingAccountNotice.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import {
		getProfileDocumento,
		mergeProfileIntoSolicitante,
		ownNifSlotIds
	} from '$lib/cuenta/profile-prefill';
	import type { Profile } from '$lib/supabase/types';
	import {
		duplicadoMotivos,
		sexoOptions,
		shippingOptions,
		tramitePricing
	} from '$lib/data/tramite-options';
	import { provinces, streetTypes } from '$lib/data/provinces';
	import {
		DEFAULT_VEHICLE_SERVICE,
		vehicleServiceOptions,
		vehicleTypeLabel,
		vehicleTypeOptions
	} from '$lib/data/vehicle-types';
	import { formatEur } from '$lib/utils/pricing';
	import {
		validateEmail,
		validateMatricula,
		validateNifNie,
		validatePhone,
		validateRequired,
		validateCodigoPostal,
		validateDate,
		normalizeBastidor,
		validateBastidor,
		todayIso,
		isCifDocumento
	} from '$lib/utils/validators';
	import DraftStorageNotice from '$lib/components/DraftStorageNotice.svelte';
	import DraftRestoreNotice from '$lib/components/DraftRestoreNotice.svelte';
	import PrivacyAcceptField from '$lib/components/legal/PrivacyAcceptField.svelte';
	import TramiteDocumentosStep from '$lib/components/tramite/TramiteDocumentosStep.svelte';
	import VmpModelPicker from '$lib/components/VmpModelPicker.svelte';
	import { createSolicitud } from '$lib/pago/client';
	import { handleWizardSave } from '$lib/tramite/save';
	import { getDocumentGroups, missingRequiredDocs } from '$lib/tramite/documentos';
	import { loadProfileNifIntoSlots, uploadTramiteDocuments } from '$lib/tramite/upload-docs';
	import { funnel, initAnalytics } from '$lib/analytics';
	import { goto } from '$app/navigation';
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

	type Variant =
		| 'etiqueta'
		| 'etiqueta-vmp'
		| 'informe'
		| 'duplicado'
		| 'cancelacion'
		| 'nota-simple'
		| 'baja-temporal';

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
	/** Último paso del wizard: resumen + CTA a pasarela */
	const finalStep = $derived(steps.length);
	const isEtiquetaShip = $derived(variant === 'etiqueta' || variant === 'etiqueta-vmp');

	let step = $state(1);
	let wizardRoot: HTMLElement | undefined = $state();
	let errors = $state<Record<string, string | null>>({});
	let errorSteps = $state<number[]>([]);
	/** Tras un intento de pago/envío, revalidar al editar para quitar el rojo al corregir */
	let validationAttempted = $state(false);
	/** Email del paso solicitante ya registrado → invitar a login (no bloquea) */
	let emailAccountExists = $state(false);
	let profilePrefillDone = $state(false);
	let profileNifPrefillDone = $state(false);
	let submitting = $state(false);
	let saving = $state(false);
	let payError = $state<string | null>(null);
	let saveMsg = $state<string | null>(null);
	let saveError = $state<string | null>(null);
	let solicitudId = $state<string | null>(null);

	let matricula = $state('');
	let bastidor = $state('');
	let tipoVehiculo = $state<'coche' | 'moto' | 'caravana'>('coche');
	let servicioVehiculo = $state(DEFAULT_VEHICLE_SERVICE);
	let distintivoTipo = $state('');
	let vmpCertificado = $state<'si' | 'no'>('si');
	let vmpTipoSolicitud = $state<'inscripcion_adhesivo' | 'inscripcion' | 'adhesivo'>(
		'inscripcion_adhesivo'
	);
	let vmpNumCertificado = $state('');
	let vmpNumSerie = $state('');
	let vmpMarca = $state('');
	let vmpModelo = $state('');
	let vmpMarcaId = $state('');
	let vmpModeloId = $state('');
	let motivoDuplicado = $state('');
	let entidadFinanciera = $state('');
	let email = $state('');
	let nif = $state('');
	let nombre = $state('');
	let apellido1 = $state('');
	let apellido2 = $state('');
	let telefono = $state('');
	let sexo = $state('');
	let fechaNacimiento = $state('');
	const isEmpresa = $derived(isCifDocumento(nif));
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
	let acceptPrivacy = $state(false);
	let showDraftNotice = $state(false);
	let showDraftRestore = $state(false);
	let pendingDraft = $state<Record<string, unknown> | null>(null);
	let draftReady = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let docFiles = $state<Record<string, File | null>>({});

	const docGroups = $derived(
		getDocumentGroups(variant, {
			motivoDuplicado,
			cartaFinalizacion,
			tipoSolicitudVmp: vmpTipoSolicitud
		})
	);

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
		if (variant === 'nota-simple') {
			const p = tramitePricing.notaSimple;
			return { lines: [{ label: p.label, amount: p.total }], total: p.total };
		}
		if (variant === 'baja-temporal') {
			const p = tramitePricing.bajaTemporal;
			return { lines: [{ label: p.label, amount: p.total }], total: p.total };
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
			funnel.abandoned({
				tramite: tipo,
				step,
				step_name: steps[step - 1],
				total_steps: steps.length
			});
		};
		window.addEventListener('pagehide', onLeave);

		if (hasDraftStorageAck()) draftReady = true;
		const data = loadDraft<Record<string, unknown>>(storageKey);
		void draftFilesCount(storageKey).then((n) => {
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
			step = Math.min(Math.max(1, data.step), steps.length);
		}
		if (typeof data.solicitudId === 'string' && data.solicitudId) {
			solicitudId = data.solicitudId;
		}
		if (typeof data.matricula === 'string') matricula = data.matricula;
		if (typeof data.bastidor === 'string') bastidor = normalizeBastidor(data.bastidor).slice(0, 17);
		if (data.tipoVehiculo === 'coche' || data.tipoVehiculo === 'moto' || data.tipoVehiculo === 'caravana')
			tipoVehiculo = data.tipoVehiculo;
		if (typeof data.servicioVehiculo === 'string') servicioVehiculo = data.servicioVehiculo;
		if (typeof data.distintivoTipo === 'string') distintivoTipo = data.distintivoTipo;
		if (typeof data.vmpCertificado === 'string')
			vmpCertificado = data.vmpCertificado as 'si' | 'no';
		if (
			data.vmpTipoSolicitud === 'inscripcion_adhesivo' ||
			data.vmpTipoSolicitud === 'inscripcion' ||
			data.vmpTipoSolicitud === 'adhesivo'
		)
			vmpTipoSolicitud = data.vmpTipoSolicitud;
		if (typeof data.vmpNumCertificado === 'string') vmpNumCertificado = data.vmpNumCertificado;
		if (typeof data.vmpNumSerie === 'string') vmpNumSerie = data.vmpNumSerie;
		if (typeof data.vmpMarca === 'string') vmpMarca = data.vmpMarca;
		if (typeof data.vmpModelo === 'string') vmpModelo = data.vmpModelo;
		if (typeof data.vmpMarcaId === 'string') vmpMarcaId = data.vmpMarcaId;
		if (typeof data.vmpModeloId === 'string') vmpModeloId = data.vmpModeloId;
		if (typeof data.motivoDuplicado === 'string') motivoDuplicado = data.motivoDuplicado;
		if (typeof data.entidadFinanciera === 'string') entidadFinanciera = data.entidadFinanciera;
		if (typeof data.email === 'string') email = data.email;
		if (typeof data.nif === 'string') nif = data.nif;
		if (typeof data.nombre === 'string') nombre = data.nombre;
		if (typeof data.apellido1 === 'string') apellido1 = data.apellido1;
		if (typeof data.apellido2 === 'string') apellido2 = data.apellido2;
		if (typeof data.telefono === 'string') telefono = data.telefono;
		if (typeof data.sexo === 'string') sexo = data.sexo;
		if (typeof data.fechaNacimiento === 'string') fechaNacimiento = data.fechaNacimiento;
		if (typeof data.provincia === 'string') provincia = data.provincia;
		if (typeof data.municipio === 'string') municipio = data.municipio;
		if (typeof data.pueblo === 'string') pueblo = data.pueblo;
		if (typeof data.tipoVia === 'string') tipoVia = data.tipoVia;
		if (typeof data.direccion === 'string') direccion = data.direccion;
		if (typeof data.numero === 'string') numero = data.numero;
		if (typeof data.piso === 'string') piso = data.piso;
		if (typeof data.puerta === 'string') puerta = data.puerta;
		if (typeof data.bloque === 'string') bloque = data.bloque;
		if (typeof data.escalera === 'string') escalera = data.escalera;
		if (typeof data.cp === 'string') cp = data.cp;
		if (typeof data.localidad === 'string') localidad = data.localidad;
		if (typeof data.tipoEnvio === 'string') tipoEnvio = data.tipoEnvio;
		if (typeof data.cartaFinalizacion === 'string') cartaFinalizacion = data.cartaFinalizacion;
	}

	function applyProfilePrefill() {
		if (profilePrefillDone || showDraftRestore) return;
		const user = page.data.user;
		const profile = page.data.profile as Profile | null | undefined;
		if (!user) return;
		const patch = mergeProfileIntoSolicitante(
			{
				email,
				nif,
				nombre,
				apellido1,
				apellido2,
				telefono,
				provincia,
				municipio,
				localidad,
				pueblo,
				tipoVia,
				direccion,
				numero,
				piso,
				puerta,
				bloque,
				escalera,
				cp,
				fechaNacimiento,
				sexo
			},
			{ userEmail: user.email, profile }
		);
		if (patch.email != null) email = patch.email;
		if (patch.nif != null) nif = patch.nif;
		if (patch.nombre != null) nombre = patch.nombre;
		if (patch.apellido1 != null) apellido1 = patch.apellido1;
		if (patch.apellido2 != null) apellido2 = patch.apellido2;
		if (patch.telefono != null) telefono = patch.telefono;
		if (patch.provincia != null) provincia = patch.provincia;
		if (patch.municipio != null) municipio = patch.municipio;
		if (patch.localidad != null) localidad = patch.localidad;
		if (patch.pueblo != null) pueblo = patch.pueblo;
		if (patch.tipoVia != null) tipoVia = patch.tipoVia;
		if (patch.direccion != null) direccion = patch.direccion;
		if (patch.numero != null) numero = patch.numero;
		if (patch.piso != null) piso = patch.piso;
		if (patch.puerta != null) puerta = patch.puerta;
		if (patch.bloque != null) bloque = patch.bloque;
		if (patch.escalera != null) escalera = patch.escalera;
		if (patch.cp != null) cp = patch.cp;
		if (patch.fechaNacimiento != null) fechaNacimiento = patch.fechaNacimiento;
		if (patch.sexo != null) sexo = patch.sexo;
		profilePrefillDone = true;
		void applyProfileNifPrefill();
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
		const slots = ownNifSlotIds(docGroups);
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
				void saveDraftFile(storageKey, id, file);
			}
		});
		noteProgress();
	}

	async function continueDraft() {
		if (pendingDraft) applyDraft(pendingDraft);
		pendingDraft = null;
		showDraftRestore = false;
		setDraftStorageAck();
		draftReady = true;
		docFiles = await loadDraftFiles(storageKey);
		profilePrefillDone = false;
		profileNifPrefillDone = false;
		applyProfilePrefill();
	}

	function startFreshDraft() {
		clearDraft(storageKey);
		void clearDraftFiles(storageKey);
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
			matricula,
			bastidor,
			tipoVehiculo,
			servicioVehiculo,
			distintivoTipo,
			vmpCertificado,
			vmpTipoSolicitud,
			vmpNumCertificado,
			vmpNumSerie,
			vmpMarca,
			vmpModelo,
			vmpMarcaId,
			vmpModeloId,
			motivoDuplicado,
			entidadFinanciera,
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
			cartaFinalizacion
		};
	}

	function save() {
		if (!draftReady) return;
		saveDraft(storageKey, draftSnapshot());
	}

	function scheduleSave() {
		if (!draftReady) return;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => save(), 350);
	}

	function noteProgress() {
		const started =
			looksLikeStartedDraft(matricula) ||
			looksLikeStartedDraft(vmpNumSerie) ||
			looksLikeStartedDraft(email) ||
			looksLikeStartedDraft(nombre) ||
			looksLikeStartedDraft(nif) ||
			looksLikeStartedDraft(motivoDuplicado);
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
		void matricula;
		void bastidor;
		void tipoVehiculo;
		void distintivoTipo;
		void vmpCertificado;
		void vmpNumCertificado;
		void vmpNumSerie;
		void vmpMarca;
		void vmpModelo;
		void vmpMarcaId;
		void vmpModeloId;
		void motivoDuplicado;
		void entidadFinanciera;
		void servicioVehiculo;
		void vmpTipoSolicitud;
		void email;
		void nif;
		void nombre;
		void apellido1;
		void apellido2;
		void telefono;
		void sexo;
		void fechaNacimiento;
		void provincia;
		void municipio;
		void pueblo;
		void tipoVia;
		void direccion;
		void numero;
		void piso;
		void puerta;
		void bloque;
		void escalera;
		void cp;
		void localidad;
		void tipoEnvio;
		void cartaFinalizacion;
		void acceptPrivacy;
		void docFiles;
		scheduleSave();
	});

	$effect(() => {
		if (!validationAttempted) return;
		void step;
		void matricula;
		void bastidor;
		void tipoVehiculo;
		void distintivoTipo;
		void vmpCertificado;
		void vmpNumCertificado;
		void vmpNumSerie;
		void vmpMarca;
		void vmpModelo;
		void vmpMarcaId;
		void vmpModeloId;
		void motivoDuplicado;
		void entidadFinanciera;
		void servicioVehiculo;
		void vmpTipoSolicitud;
		void email;
		void nif;
		void nombre;
		void apellido1;
		void apellido2;
		void telefono;
		void sexo;
		void fechaNacimiento;
		void provincia;
		void municipio;
		void pueblo;
		void tipoVia;
		void direccion;
		void numero;
		void piso;
		void puerta;
		void bloque;
		void escalera;
		void cp;
		void localidad;
		void tipoEnvio;
		void cartaFinalizacion;
		void acceptPrivacy;
		void docFiles;
		applyValidationState();
	});

	/** Resultado de la consulta de pegatina (cuando exista API se rellenará el tipo). */
	const distintivoConsulta = $derived.by(() => {
		if (variant !== 'etiqueta') return null;
		if (!matricula.trim() || validateMatricula(matricula)) return null;
		if (distintivoTipo) {
			return { status: 'ok' as const, tipo: distintivoTipo };
		}
		return { status: 'unavailable' as const };
	});

	function validateStepAt(s: number): Record<string, string | null> {
		const e: Record<string, string | null> = {};

		if (variant === 'etiqueta' && s === 1) {
			e.matricula = validateMatricula(matricula);
		}

		if (variant === 'etiqueta-vmp' && s === 1) {
			e.vmpNumSerie = validateRequired(vmpNumSerie, 'El número de serie');
			if (vmpCertificado === 'si') {
				e.vmpMarca = validateRequired(vmpMarcaId || vmpMarca, 'La marca');
				e.vmpModelo = validateRequired(vmpModeloId || vmpModelo, 'El modelo');
				e.vmpNumCertificado = validateRequired(vmpNumCertificado, 'El número de certificado');
			} else {
				e.vmpMarca = validateRequired(vmpMarca, 'La marca');
			}
		}

		if (variant === 'informe' && s === 1) {
			e.matricula = validateMatricula(matricula);
			if (bastidor.trim()) e.bastidor = validateBastidor(bastidor);
		}

		if (variant === 'nota-simple' && s === 1) {
			e.matricula = validateMatricula(matricula);
			if (bastidor.trim()) e.bastidor = validateBastidor(bastidor);
		}

		if ((variant === 'cancelacion' || variant === 'baja-temporal') && s === 1) {
			e.matricula = validateMatricula(matricula);
		}

		if (variant === 'duplicado' && s === 1) {
			if (!motivoDuplicado) e.motivoDuplicado = 'Selecciona el motivo del duplicado';
			e.matricula = validateMatricula(matricula);
		}

		if (s === 2 && variant !== 'cancelacion') {
			e.email = validateEmail(email);
			e.nif = validateNifNie(nif);
			e.nombre = validateRequired(nombre, isEmpresa ? 'La razón social' : 'El nombre');
			if (!isEmpresa) {
				e.apellido1 = validateRequired(apellido1, 'El primer apellido');
				if (!sexo) e.sexo = 'Selecciona el sexo';
				e.fechaNacimiento = validateDate(fechaNacimiento, {
					label: 'La fecha de nacimiento',
					notFuture: true,
					minAgeYears: 16
				});
			}
			e.telefono = validatePhone(telefono);
		}

		if (variant === 'cancelacion' && s === 2) {
			e.email = validateEmail(email);
			e.nif = validateNifNie(nif);
			e.nombre = validateRequired(nombre, isEmpresa ? 'La razón social' : 'El nombre');
			if (!isEmpresa) e.apellido1 = validateRequired(apellido1, 'El primer apellido');
			e.telefono = validatePhone(telefono);
			if (!provincia) e.provincia = 'Selecciona la provincia';
			e.municipio = validateRequired(municipio, 'El municipio');
			e.localidad = validateRequired(localidad, 'La localidad');
			e.direccion = validateRequired(direccion, 'El nombre de la vía');
			e.numero = validateRequired(numero, 'El número');
			e.cp = validateCodigoPostal(cp);
		}

		if (
			s === 3 &&
			(variant === 'etiqueta' ||
				variant === 'etiqueta-vmp' ||
				variant === 'informe' ||
				variant === 'duplicado' ||
				variant === 'nota-simple' ||
				variant === 'baja-temporal')
		) {
			if (!provincia) e.provincia = 'Selecciona la provincia';
			e.municipio = validateRequired(municipio, 'El municipio');
			e.direccion = validateRequired(direccion, 'El nombre de la vía');
			e.numero = validateRequired(numero, 'El número');
			e.cp = validateCodigoPostal(cp);
		}

		if (s === 3) {
			const missing = missingRequiredDocs(docGroups, docFiles);
			if (missing.length) {
				e.docs = 'Sube todos los documentos obligatorios (foto o archivo).';
				for (const id of missing) {
					e[id] = 'Documento obligatorio';
				}
			}
		}

		if (s === finalStep) {
			if (!acceptPrivacy) e.privacy = 'Debes aceptar la política de privacidad';
		}

		return e;
	}

	function stepHasErrors(s: number): boolean {
		return Object.values(validateStepAt(s)).some(Boolean);
	}

	function firstInvalidStep(): number {
		for (let s = 1; s <= finalStep; s++) {
			if (stepHasErrors(s)) return s;
		}
		return finalStep;
	}

	function applyValidationState(): boolean {
		const merged: Record<string, string | null> = {};
		const bad: number[] = [];
		for (let s = 1; s <= finalStep; s++) {
			const e = validateStepAt(s);
			Object.assign(merged, e);
			if (Object.values(e).some(Boolean)) bad.push(s);
		}
		errors = merged;
		errorSteps = bad;
		const ok = bad.length === 0;
		// Quitar el aviso global al corregir los campos
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
		if (n < 1 || n > finalStep || n === step) return;
		funnel.stepViewed({
			tramite: tipo,
			step: n,
			step_name: steps[n - 1],
			total_steps: steps.length
		});
		step = n;
		noteProgress();
		save();
		void scrollWizardToTop(wizardRoot);
	}

	$effect(() => {
		void page.data.user;
		void page.data.profile;
		void showDraftRestore;
		applyProfilePrefill();
	});

	function next() {
		if (step >= finalStep) return;
		funnel.stepCompleted({
			tramite: tipo,
			step,
			step_name: steps[step - 1],
			total_steps: steps.length
		});
		noteProgress();
		save();
		step++;
		funnel.stepViewed({
			tramite: tipo,
			step,
			step_name: steps[step - 1],
			total_steps: steps.length
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
		return {
			tipo,
			variant,
			wizardStep: step,
			matricula,
			bastidor,
			tipoVehiculo,
			servicioVehiculo,
			distintivoTipo,
			vmpCertificado,
			vmpTipoSolicitud,
			vmpNumCertificado,
			vmpNumSerie,
			vmpMarca,
			vmpModelo,
			vmpMarcaId,
			vmpModeloId,
			motivoDuplicado,
			entidadFinanciera,
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
			acceptPrivacy,
			docsAttached: Object.keys(docFiles).filter((k) => docFiles[k]),
			priceLines: priceLines.lines,
			total: priceLines.total,
			amount: priceLines.total
		};
	}

	function setDocFile(id: string, file: File | null) {
		docFiles = { ...docFiles, [id]: file };
		if (file) void saveDraftFile(storageKey, id, file);
		else void removeDraftFile(storageKey, id);
		noteProgress();
	}

	async function uploadDocsIfAny(id: string, accessToken?: string | null) {
		const result = await uploadTramiteDocuments({
			solicitudId: id,
			files: docFiles,
			accessToken
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
				tipo,
				storageKey,
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
			void scrollWizardToTop(wizardRoot);
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
				tramite: tipo,
				step,
				total_steps: steps.length,
				order_id: result.solicitudId
			});
			funnel.paymentStarted({
				tramite: tipo,
				step,
				total_steps: steps.length
			});
			clearDraft(storageKey);
			void clearDraftFiles(storageKey);
			await goto(result.pagoUrl);
		} finally {
			submitting = false;
		}
	}
</script>

<section class="section wizard-section" bind:this={wizardRoot}>
	<div class="wrap wizard-layout">
		<div class="main card pad">
			<WizardStepper current={step} labels={steps} {errorSteps} onchange={goTo} />
			<h1>{title}</h1>
			{#if saveMsg}<p class="save-ok" role="status">{saveMsg}</p>{/if}
			{#if saveError}<p class="field-error" role="alert">{saveError}</p>{/if}

				{#if variant === 'etiqueta' && step === 1}
					<FormField
						label="Matrícula del vehículo"
						error={errors.matricula}
						hint="Ej: 3990WDS (sin espacios ni guiones)"
						required
					>
						<input bind:value={matricula} placeholder="3990WDS" oninput={noteProgress} />
					</FormField>
					{#if distintivoConsulta?.status === 'ok'}
						<div class="distintivo-info" role="status">
							<p>
								Distintivo correspondiente: <strong>{distintivoConsulta.tipo}</strong>
							</p>
						</div>
					{:else if distintivoConsulta?.status === 'unavailable'}
						<div class="distintivo-warning" role="status">
							<p>
								No podemos mostrar de momento la pegatina correspondiente a esta matrícula. Si el
								vehículo no tiene derecho a distintivo medioambiental, no podrás completar este
								trámite.
							</p>
						</div>
					{/if}
				{:else if variant === 'etiqueta-vmp' && step === 1}
					<p class="info">
						Datos de tu Vehículo de Movilidad Personal (patinete). Si está certificado, elige marca y
						modelo del listado oficial DGT. Si no lo está, puedes solicitar inscripción temporal
						hasta el 22/01/2027.
					</p>
					<FormField label="Qué solicitas" required>
						<RadioCards
							name="vmpTipoSolicitud"
							bind:value={vmpTipoSolicitud}
							options={[
								{ value: 'inscripcion_adhesivo', label: 'Inscripción VMP + adhesivo matrícula' },
								{ value: 'inscripcion', label: 'Solo inscripción VMP' },
								{ value: 'adhesivo', label: 'Solo adhesivo matrícula VMP' }
							]}
						/>
					</FormField>
					<FormField label="Servicio del vehículo" required>
						<select bind:value={servicioVehiculo}>
							{#each vehicleServiceOptions as s}
								<option value={s.value}>{s.label}</option>
							{/each}
						</select>
					</FormField>
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
						<VmpModelPicker
							bind:marcaId={vmpMarcaId}
							bind:marcaNombre={vmpMarca}
							bind:modeloId={vmpModeloId}
							bind:modeloNombre={vmpModelo}
							bind:numCertificado={vmpNumCertificado}
							errors={{
								marca: errors.vmpMarca,
								modelo: errors.vmpModelo,
								certificado: errors.vmpNumCertificado
							}}
						/>
					{:else}
						<div class="row-2">
							<FormField label="Marca" error={errors.vmpMarca} required>
								<input bind:value={vmpMarca} oninput={noteProgress} />
							</FormField>
							<FormField label="Modelo">
								<input bind:value={vmpModelo} />
							</FormField>
						</div>
					{/if}
					<FormField label="Número de serie" error={errors.vmpNumSerie} required>
						<input
							bind:value={vmpNumSerie}
							placeholder="Número de serie del VMP"
							oninput={noteProgress}
						/>
					</FormField>
				{:else if variant === 'informe' && step === 1}
					<FormField
						label="Matrícula del vehículo"
						error={errors.matricula}
						hint="Dato principal para generar el informe oficial DGT"
						required
					>
						<input bind:value={matricula} placeholder="3990WDS" oninput={noteProgress} />
					</FormField>
					<FormField label="Bastidor (opcional)" error={errors.bastidor} hint="Ayuda a confirmar el vehículo">
						<input
							bind:value={bastidor}
							placeholder="17 caracteres VIN"
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
					<p class="info">Informe completo emitido por la DGT con autentificación adicional.</p>
				{:else if variant === 'nota-simple' && step === 1}
					<FormField
						label="Matrícula del vehículo"
						error={errors.matricula}
						hint="Dato principal para la nota del Registro de Bienes Muebles"
						required
					>
						<input bind:value={matricula} placeholder="3990WDS" oninput={noteProgress} />
					</FormField>
					<FormField
						label="Bastidor (opcional)"
						error={errors.bastidor}
						hint="Recomendado si lo tienes: mejora la identificación registral"
					>
						<input
							bind:value={bastidor}
							placeholder="17 caracteres VIN"
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
				{:else if (variant === 'cancelacion' || variant === 'baja-temporal') && step === 1}
					<FormField label="Tipo de vehículo" required>
						<RadioCards
							name="tipoVehiculo"
							bind:value={tipoVehiculo}
							options={[...vehicleTypeOptions]}
						/>
					</FormField>
					<FormField label="Matrícula del vehículo" error={errors.matricula} required>
						<input bind:value={matricula} oninput={noteProgress} />
					</FormField>
					{#if variant === 'cancelacion'}
						<FormField label="Entidad financiera (si la conoces)">
							<input
								bind:value={entidadFinanciera}
								placeholder="Nombre del banco o financiera"
							/>
						</FormField>
					{/if}
				{:else if variant === 'duplicado' && step === 1}
					<FormField label="Motivo" error={errors.motivoDuplicado} required>
						<select bind:value={motivoDuplicado}>
							<option value="">Selecciona un motivo</option>
							{#each duplicadoMotivos as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
					</FormField>
					<FormField label="Tipo de vehículo" required>
						<RadioCards
							name="tipoVehiculoDup"
							bind:value={tipoVehiculo}
							options={[...vehicleTypeOptions]}
						/>
					</FormField>
					<FormField label="Matrícula del vehículo" error={errors.matricula} required>
						<input bind:value={matricula} oninput={noteProgress} />
					</FormField>
				{:else if step === 2 && variant !== 'cancelacion'}
					<FormField label="Correo electrónico" error={errors.email} required>
						<input type="email" bind:value={email} autocomplete="email" />
					</FormField>
					{#if email.trim() && !validateEmail(email) && !page.data.user}
						<ExistingAccountNotice bind:exists={emailAccountExists} email={email.trim()} />
					{/if}
					<FormField
						label="NIF/NIE/CIF"
						error={errors.nif}
						hint="Escribe los dígitos: la letra se calcula sola"
						required
					>
						<NifInput bind:value={nif} />
					</FormField>
					<div class="row-2">
						<FormField label={isEmpresa ? 'Razón social' : 'Nombre'} error={errors.nombre} required>
							<input bind:value={nombre} />
						</FormField>
						{#if !isEmpresa}
							<FormField label="Primer apellido" error={errors.apellido1} required>
								<input bind:value={apellido1} />
							</FormField>
						{/if}
					</div>
					{#if !isEmpresa}
						<FormField label="Segundo apellido" error={errors.apellido2}>
							<input bind:value={apellido2} />
						</FormField>
					{/if}
					<FormField label="Teléfono" error={errors.telefono} required>
						<input type="tel" bind:value={telefono} inputmode="tel" placeholder="612345678" />
					</FormField>
					{#if !isEmpresa}
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
							<DateInput bind:value={fechaNacimiento} max={todayIso()} />
						</FormField>
					</div>
					{/if}
				{:else if variant === 'cancelacion' && step === 2}
					<FormField label="Correo electrónico" error={errors.email} required>
						<input type="email" bind:value={email} autocomplete="email" />
					</FormField>
					{#if email.trim() && !validateEmail(email) && !page.data.user}
						<ExistingAccountNotice bind:exists={emailAccountExists} email={email.trim()} />
					{/if}
					<FormField
						label="NIF/NIE/CIF"
						error={errors.nif}
						hint="Escribe los dígitos: la letra se calcula sola"
						required
					>
						<NifInput bind:value={nif} />
					</FormField>
					<div class="row-2">
						<FormField label={isEmpresa ? 'Razón social' : 'Nombre'} error={errors.nombre} required>
							<input bind:value={nombre} />
						</FormField>
						{#if !isEmpresa}
							<FormField label="Primer apellido" error={errors.apellido1} required>
								<input bind:value={apellido1} />
							</FormField>
						{/if}
					</div>
					{#if !isEmpresa}
						<FormField label="Segundo apellido" error={errors.apellido2}>
							<input bind:value={apellido2} />
						</FormField>
					{/if}
					<FormField label="Teléfono" error={errors.telefono} required>
						<input type="tel" bind:value={telefono} inputmode="tel" placeholder="612345678" />
					</FormField>
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
						<FormField label="Localidad / Ciudad" error={errors.localidad} required>
							<input bind:value={localidad} />
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
						<FormField label="Nombre de la vía" error={errors.direccion} required>
							<input bind:value={direccion} autocomplete="address-line1" />
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
						<input bind:value={cp} maxlength="5" inputmode="numeric" autocomplete="postal-code" />
					</FormField>
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
						<FormField label="Nombre de la vía" error={errors.direccion} required>
							<input bind:value={direccion} autocomplete="address-line1" />
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
						<input bind:value={cp} maxlength="5" inputmode="numeric" autocomplete="postal-code" />
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
					{#if errors.docs}<p class="field-error">{errors.docs}</p>{/if}
					<TramiteDocumentosStep
						groups={docGroups}
						files={docFiles}
						{errors}
						onfile={setDocFile}
					/>
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
					{#if errors.docs}<p class="field-error">{errors.docs}</p>{/if}
					<TramiteDocumentosStep
						groups={docGroups}
						files={docFiles}
						{errors}
						onfile={setDocFile}
					/>
				{:else if step === finalStep}
					<div class="summary-final">
						<h2>Resumen de tu solicitud</h2>
						<p class="summary-lead">
							Revisa los datos antes de continuar a la pasarela de pago.
						</p>
						<ul class="sum">
							<li><span>Trámite</span><strong>{title}</strong></li>
							{#if variant === 'etiqueta-vmp'}
								<li>
									<span>VMP</span><strong
										>{vmpMarca}
										{vmpModelo || ''} · {vmpCertificado === 'si'
											? 'Certificado'
											: 'No certificado'}</strong
									>
								</li>
								<li><span>Nº serie</span><strong>{vmpNumSerie || '—'}</strong></li>
								{#if vmpCertificado === 'si'}
									<li><span>Nº certificado</span><strong>{vmpNumCertificado || '—'}</strong></li>
								{/if}
							{:else if variant === 'duplicado'}
								<li><span>Motivo</span><strong>{motivoDuplicado || '—'}</strong></li>
								<li><span>Matrícula</span><strong>{matricula || '—'}</strong></li>
								<li><span>Tipo</span><strong>{vehicleTypeLabel(tipoVehiculo)}</strong></li>
							{:else}
								<li><span>Matrícula</span><strong>{matricula || '—'}</strong></li>
								{#if bastidor && (variant === 'nota-simple' || variant === 'informe')}
									<li><span>Bastidor</span><strong>{bastidor}</strong></li>
								{/if}
								{#if (variant === 'cancelacion' || variant === 'baja-temporal') && tipoVehiculo}
									<li>
										<span>Tipo</span><strong>{vehicleTypeLabel(tipoVehiculo)}</strong>
									</li>
								{/if}
								{#if distintivoTipo}
									<li><span>Distintivo</span><strong>{distintivoTipo}</strong></li>
								{/if}
							{/if}
							<li>
								<span>Solicitante</span><strong>{isEmpresa ? nombre : [nombre, apellido1, apellido2].filter(Boolean).join(' ')}</strong>
							</li>
							<li><span>NIF/NIE</span><strong>{nif || '—'}</strong></li>
							<li><span>Email</span><strong>{email}</strong></li>
							<li><span>Teléfono</span><strong>{telefono || '—'}</strong></li>
							{#if direccion || cp}
								<li>
									<span>Dirección</span>
									<strong
										>{[tipoVia, direccion, numero, cp, municipio || localidad, provincia]
											.filter(Boolean)
											.join(', ')}</strong
									>
								</li>
							{/if}
							{#if isEtiquetaShip}
								<li><span>Envío</span><strong>{tipoEnvio || '—'}</strong></li>
							{/if}
							{#each priceLines.lines as line}
								<li>
									<span>{line.label}</span><strong>{formatEur(line.amount)}</strong>
								</li>
							{/each}
							<li class="total-row">
								<span>Total</span><strong>{formatEur(priceLines.total)}</strong>
							</li>
						</ul>

						<ExistingAccountNotice
							bind:exists={emailAccountExists}
							{email}
							mode="reminder"
						/>
						<PrivacyAcceptField bind:checked={acceptPrivacy} error={errors.privacy} />
						{#if payError}<p class="field-error">{payError}</p>{/if}

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

				<div class="nav">
					{#if step > 1}
						<button type="button" class="btn ghost" onclick={prev}>Anterior</button>
					{:else}<span></span>{/if}
					<div class="nav-right">
						<button
							type="button"
							class="btn ghost save-btn"
							onclick={saveToAccount}
							disabled={saving || submitting}
						>
							{saving ? 'Guardando…' : page.data.user ? 'Guardar' : 'Guardar (iniciar sesión)'}
						</button>
						{#if step < finalStep}
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
	.wizard-section {
		padding-top: 40px;
		padding-bottom: 80px;
		scroll-margin-top: 88px;
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
	.distintivo-info,
	.distintivo-warning {
		padding: 12px 14px;
		border-radius: var(--radius);
		margin-bottom: 12px;
		font-size: 14px;
		line-height: 1.45;
	}
	.distintivo-info {
		background: var(--primary-dim);
		border-left: 3px solid var(--brand-teal);
	}
	.distintivo-warning {
		background: #fff8e8;
		border-left: 3px solid #e6a800;
		color: var(--text2);
	}
	.distintivo-info p,
	.distintivo-warning p {
		margin: 0;
	}
	.summary-final h2 {
		margin: 0 0 6px;
		font-size: 1.2rem;
		color: #003050;
	}
	.summary-lead {
		margin: 0 0 16px;
		color: var(--text2);
		font-size: 0.92rem;
	}
	.sum {
		list-style: none;
		margin: 0 0 18px;
		padding: 0;
	}
	.sum li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 0;
		border-bottom: 1px solid var(--border-light);
		font-size: 14px;
		color: var(--text2);
	}
	.sum li strong {
		text-align: right;
		color: var(--ink, #1a2b3c);
	}
	.sum li.total-row {
		font-size: 1.05rem;
		border-bottom: none;
		padding-top: 14px;
	}
	.sum li.total-row strong {
		color: #00a8b3;
		font-size: 1.15rem;
	}
	.pay-cta {
		width: 100%;
		margin-top: 8px;
		padding: 14px 18px;
		font-weight: 800;
	}
	.pay-cta:disabled {
		opacity: 0.55;
		cursor: not-allowed;
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
	.save-ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 14px;
		margin-bottom: 16px;
	}
	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin-top: 28px;
		padding-top: 20px;
		border-top: 1px solid var(--border-light);
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
