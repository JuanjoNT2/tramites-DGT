export const IDLE_WARN_MS = 39 * 60 * 1000;
export const WARN_COUNTDOWN_MS = 60 * 1000;

export type IdleTimeoutHandlers = {
	onWarn: () => void;
	onExpire: () => void;
};

/**
 * Watchdog de inactividad: avisa a los 39 min y expira 1 min después
 * si el usuario no confirma mantener la sesión.
 * Mientras el aviso está activo, la actividad del ratón/teclado no reinicia el reloj.
 */
export function createIdleTimeout(handlers: IdleTimeoutHandlers) {
	let warnTimer: ReturnType<typeof setTimeout> | null = null;
	let expireTimer: ReturnType<typeof setTimeout> | null = null;
	let warningActive = false;
	let stopped = false;

	const activityEvents = [
		'mousemove',
		'keydown',
		'click',
		'scroll',
		'touchstart',
		'visibilitychange'
	] as const;

	function clearTimers() {
		if (warnTimer) clearTimeout(warnTimer);
		if (expireTimer) clearTimeout(expireTimer);
		warnTimer = null;
		expireTimer = null;
	}

	function schedule() {
		clearTimers();
		if (stopped || warningActive) return;
		warnTimer = setTimeout(() => {
			warningActive = true;
			handlers.onWarn();
			expireTimer = setTimeout(() => {
				handlers.onExpire();
			}, WARN_COUNTDOWN_MS);
		}, IDLE_WARN_MS);
	}

	function onActivity() {
		if (stopped || warningActive) return;
		if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
		schedule();
	}

	function start() {
		stopped = false;
		warningActive = false;
		for (const ev of activityEvents) {
			window.addEventListener(ev, onActivity, { passive: true });
		}
		schedule();
	}

	function stop() {
		stopped = true;
		warningActive = false;
		clearTimers();
		for (const ev of activityEvents) {
			window.removeEventListener(ev, onActivity);
		}
	}

	/** Tras «Mantener sesión»: cierra el aviso y reinicia el idle. */
	function extend() {
		warningActive = false;
		clearTimers();
		schedule();
	}

	return { start, stop, extend };
}
