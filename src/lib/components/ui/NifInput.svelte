<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { applyNifNieLetter, nifNieControlLetter, normalizeDocumento } from '$lib/utils/validators';

	let {
		value = $bindable(''),
		name = undefined,
		placeholder = '12345678Z',
		required = false,
		disabled = false,
		autocomplete = 'off'
	}: {
		value?: string;
		name?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
	} = $props();

	const letterMismatch = $derived.by(() => {
		const v = normalizeDocumento(value);
		if (/^\d{8}[A-Z]$/.test(v) || /^[XYZ]\d{7}[A-Z]$/.test(v)) {
			const expected = nifNieControlLetter(v.slice(0, 8));
			if (expected && expected !== v[8]) {
				return expected;
			}
		}
		return null;
	});

	function onInput(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const next = applyNifNieLetter(el.value);
		value = next;
		if (el.value !== next) el.value = next;
	}
</script>

<div class="nif-input">
	<input
		type="text"
		inputmode="text"
		spellcheck="false"
		{name}
		{placeholder}
		{required}
		{disabled}
		{autocomplete}
		value={value}
		maxlength={9}
		oninput={onInput}
		aria-invalid={letterMismatch ? 'true' : undefined}
	/>
	{#if letterMismatch}
		<p class="mismatch" role="status">
			La letra de control no es correcta: debería ser <strong>{letterMismatch}</strong>
		</p>
	{/if}
</div>

<style>
	.mismatch {
		margin: 6px 0 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--error, #c0392b);
	}
</style>
