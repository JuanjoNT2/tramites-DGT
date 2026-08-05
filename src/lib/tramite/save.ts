import { page } from '$app/state';
import { goto } from '$app/navigation';
import { loginUrl } from '$lib/auth/urls';
import { saveDraft } from '$lib/tramite/draft';

export type GuardarTramiteResult =
	| {
			ok: true;
			solicitudId: string;
			cuentaUrl: string | null;
			vehiculoSaved: boolean;
			message: string;
	  }
	| { ok: false; error: string; needsLogin?: boolean };

/** Persiste borrador en cuenta (status nueva). Requiere sesión. */
export async function guardarTramiteEnCuenta(opts: {
	tipo: string;
	payload: Record<string, unknown>;
	solicitudId?: string | null;
}): Promise<GuardarTramiteResult> {
	const res = await fetch('/api/cuenta/guardar-tramite', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			tipo: opts.tipo,
			payload: opts.payload,
			solicitudId: opts.solicitudId || undefined
		})
	});
	const data = await res.json().catch(() => ({}));
	if (res.status === 401) {
		return { ok: false, error: 'Debes iniciar sesión para guardar.', needsLogin: true };
	}
	if (!res.ok) {
		return {
			ok: false,
			error: typeof data.error === 'string' ? data.error : 'No se pudo guardar el trámite'
		};
	}
	return {
		ok: true,
		solicitudId: String(data.solicitudId || ''),
		cuentaUrl: typeof data.cuentaUrl === 'string' ? data.cuentaUrl : null,
		vehiculoSaved: Boolean(data.vehiculoSaved),
		message: typeof data.message === 'string' ? data.message : 'Trámite guardado.'
	};
}

/** Si no hay sesión: guarda draft local y redirige a login. Si hay: guarda en cuenta. */
export async function handleWizardSave(opts: {
	tipo: string;
	storageKey: string;
	draftSnapshot: Record<string, unknown>;
	payload: Record<string, unknown>;
	solicitudId: string | null;
	returnPath: string;
}): Promise<
	| { kind: 'saved'; result: Extract<GuardarTramiteResult, { ok: true }> }
	| { kind: 'login' }
	| { kind: 'error'; error: string }
> {
	const loggedIn = Boolean(page.data.user);
	saveDraft(opts.storageKey, {
		...opts.draftSnapshot,
		solicitudId: opts.solicitudId
	});

	if (!loggedIn) {
		const next = opts.returnPath.startsWith('/') ? opts.returnPath : `/${opts.returnPath}`;
		await goto(loginUrl(next));
		return { kind: 'login' };
	}

	const result = await guardarTramiteEnCuenta({
		tipo: opts.tipo,
		payload: opts.payload,
		solicitudId: opts.solicitudId
	});

	if (!result.ok) {
		if (result.needsLogin) {
			const next = opts.returnPath.startsWith('/') ? opts.returnPath : `/${opts.returnPath}`;
			await goto(loginUrl(next));
			return { kind: 'login' };
		}
		return { kind: 'error', error: result.error };
	}

	return { kind: 'saved', result };
}
