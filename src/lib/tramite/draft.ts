import { browser } from '$app/environment';

const ACK_KEY = 'tdgt_draft_storage_ack';

/** El usuario ya vio el aviso de que se guarda un borrador. */
export function hasDraftStorageAck(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(ACK_KEY) === '1';
	} catch {
		return false;
	}
}

export function setDraftStorageAck(): void {
	if (!browser) return;
	try {
		localStorage.setItem(ACK_KEY, '1');
	} catch {
		/* ignore */
	}
}

export function loadDraft<T extends Record<string, unknown>>(key: string): T | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const data = JSON.parse(raw);
		return data && typeof data === 'object' ? (data as T) : null;
	} catch {
		return null;
	}
}

export function saveDraft(key: string, data: Record<string, unknown>): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
	} catch {
		/* ignore */
	}
}

export function clearDraft(key: string): void {
	if (!browser) return;
	try {
		localStorage.removeItem(key);
	} catch {
		/* ignore */
	}
}

/** ¿Hay datos suficientes para considerar que el usuario ha empezado el trámite? */
export function looksLikeStartedDraft(value: string | null | undefined): boolean {
	return Boolean(value && value.trim().length >= 2);
}

/** ¿El borrador guardado merece preguntar si continuar o empezar de nuevo? */
export function draftLooksMeaningful(data: Record<string, unknown> | null): boolean {
	if (!data) return false;
	if (typeof data.step === 'number' && data.step > 1) return true;
	const keys = [
		'matricula',
		'bastidor',
		'email',
		'nombre',
		'nif',
		'telefono',
		'modeloNombre',
		'modeloMotoNombre',
		'vmpNumSerie',
		'motivoDuplicado'
	];
	for (const k of keys) {
		const v = data[k];
		if (typeof v === 'string' && looksLikeStartedDraft(v)) return true;
	}
	return false;
}
