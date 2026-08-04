<script lang="ts">
	import { parseDateInput, toIsoDate } from '$lib/utils/validators';

	let {
		value = $bindable(''),
		max = undefined,
		min = undefined,
		disabled = false
	}: {
		value?: string;
		max?: string;
		min?: string;
		disabled?: boolean;
	} = $props();

	let pickerEl = $state<HTMLInputElement | null>(null);

	function toDmy(d: Date): string {
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		return `${day}/${month}/${d.getFullYear()}`;
	}

	/** Borradores antiguos en ISO → mostrar dd/mm/aaaa */
	$effect(() => {
		const v = value.trim();
		if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
		const d = parseDateInput(v);
		if (d) value = toDmy(d);
	});

	const isoForPicker = $derived.by(() => {
		const d = parseDateInput(value);
		return d ? toIsoDate(d) : '';
	});

	function openPicker() {
		if (disabled || !pickerEl) return;
		try {
			if (typeof pickerEl.showPicker === 'function') {
				pickerEl.showPicker();
				return;
			}
		} catch {
			/* showPicker puede fallar sin gesto de usuario */
		}
		pickerEl.focus();
		pickerEl.click();
	}

	function onPickerChange(e: Event) {
		const raw = (e.currentTarget as HTMLInputElement).value;
		if (!raw) return;
		const d = parseDateInput(raw);
		if (d) value = toDmy(d);
	}
</script>

<div class="date-input">
	<input
		type="text"
		inputmode="numeric"
		placeholder="dd/mm/aaaa"
		autocomplete="off"
		bind:value
		{disabled}
		maxlength={10}
		aria-label="Fecha"
	/>
	<button
		type="button"
		class="cal"
		onclick={openPicker}
		{disabled}
		tabindex="-1"
		aria-label="Abrir calendario"
		title="Abrir calendario"
	>
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" />
			<path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
		</svg>
	</button>
	<input
		bind:this={pickerEl}
		class="picker"
		type="date"
		value={isoForPicker}
		{max}
		{min}
		tabindex="-1"
		aria-hidden="true"
		onchange={onPickerChange}
	/>
</div>

<style>
	.date-input {
		position: relative;
	}

	.date-input input[type='text'] {
		width: 100%;
		padding-right: 44px;
	}

	.cal {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text3, #5a6b7d);
		cursor: pointer;
		padding: 0;
	}

	.cal:hover:not(:disabled) {
		color: var(--brand-navy, #003050);
		background: rgba(0, 87, 166, 0.08);
	}

	.cal:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.picker {
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		width: 0;
		height: 0;
		border: 0;
		padding: 0;
	}
</style>
