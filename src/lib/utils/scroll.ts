import { browser } from '$app/environment';
import { tick } from 'svelte';

/** Sube al inicio del wizard tras cambiar de paso (evita campos fuera de vista). */
export async function scrollWizardToTop(el: HTMLElement | null | undefined) {
	if (!browser || !el) return;
	await tick();
	el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
