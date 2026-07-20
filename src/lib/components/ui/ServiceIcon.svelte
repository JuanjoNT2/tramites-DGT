<script lang="ts">
	let { id, size = 28 }: { id: string; size?: number } = $props();
</script>

<svg
	class="service-icon"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if id === 'transferencia'}
		<path d="M5 17h14v-5H5v5Z" />
		<path d="M7 12V7.5A2.5 2.5 0 0 1 9.5 5h5A2.5 2.5 0 0 1 17 7.5V12" />
		<circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
		<circle cx="16.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
	{:else if id === 'etiqueta'}
		<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z" />
		<circle cx="15" cy="9" r="1.25" fill="currentColor" stroke="none" />
	{:else if id === 'etiqueta-vmp'}
		<path d="M5 16h10" />
		<circle cx="7" cy="16" r="2.5" />
		<circle cx="15" cy="16" r="2.5" />
		<path d="M9.5 16 12 9h3" />
		<path d="M12 9v3" />
		<path d="M15 9h2.5v2" />
	{:else if id === 'informe'}
		<path d="M7 3h7l3 3v15H7V3Z" />
		<path d="M14 3v4h4" />
		<path d="M9 12h6M9 16h6" />
	{:else if id === 'duplicado'}
		<rect x="4" y="5" width="16" height="14" rx="2" />
		<circle cx="10" cy="11" r="2" />
		<path d="M14 15H8M16 9h2" />
	{:else if id === 'cancelacion'}
		<path d="M7 3h7l3 3v15H7V3Z" />
		<path d="M14 3v4h4" />
		<path d="m10 14 4 4M14 14l-4 4" />
	{:else}
		<rect x="4" y="4" width="16" height="16" rx="2" />
	{/if}
</svg>

<style>
	.service-icon {
		display: block;
		flex-shrink: 0;
		color: var(--brand-teal);
	}
</style>
