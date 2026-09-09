const KEY = 'tdgt-datos-verificados';
const MAX_MS = 30 * 60 * 1000;

/** El usuario acaba de confirmar que los datos son correctos (wizard → pasarela). */
export function markDatosConfirmados() {
	try {
		sessionStorage.setItem(KEY, String(Date.now()));
	} catch {
		/* private mode */
	}
}

/** Consume el flag: si es reciente, la pasarela no vuelve a pedir el aviso. */
export function consumeDatosConfirmados(): boolean {
	try {
		const raw = sessionStorage.getItem(KEY);
		sessionStorage.removeItem(KEY);
		const t = Number(raw || 0);
		return t > 0 && Date.now() - t < MAX_MS;
	} catch {
		return false;
	}
}
