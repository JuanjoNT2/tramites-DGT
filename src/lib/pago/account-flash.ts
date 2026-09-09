const KEY = 'tramites_account_created';

/** Aviso breve en /pago tras alta automática (no reenvía la password). */
export function markAccountCreated(email?: string | null) {
	try {
		sessionStorage.setItem(
			KEY,
			JSON.stringify({ email: (email || '').trim().toLowerCase(), at: Date.now() })
		);
	} catch {
		/* ignore */
	}
}

export function consumeAccountCreated(): { email: string } | null {
	try {
		const raw = sessionStorage.getItem(KEY);
		if (!raw) return null;
		sessionStorage.removeItem(KEY);
		const data = JSON.parse(raw) as { email?: string; at?: number };
		if (!data.at || Date.now() - data.at > 15 * 60 * 1000) return null;
		return { email: typeof data.email === 'string' ? data.email : '' };
	} catch {
		return null;
	}
}
