<script lang="ts">
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

	let inputEl = $state<HTMLInputElement | null>(null);

	function openPicker() {
		if (disabled || !inputEl) return;
		try {
			if (typeof inputEl.showPicker === 'function') {
				inputEl.showPicker();
			}
		} catch {
			/* algunos navegadores solo permiten showPicker tras gesto; el focus basta */
		}
	}
</script>

<input
	bind:this={inputEl}
	type="date"
	bind:value
	{max}
	{min}
	{disabled}
	onclick={openPicker}
	onfocus={openPicker}
/>
