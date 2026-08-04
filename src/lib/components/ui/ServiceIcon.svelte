<script lang="ts">
	let { id, size = 28 }: { id: string; size?: number } = $props();
</script>

<svg
	class="service-icon"
	width={size}
	height={size}
	viewBox="0 0 48 48"
	fill="none"
	aria-hidden="true"
>
	{#if id === 'transferencia'}
		<!-- Flecha superior → -->
		<path
			d="M12 5h18M24 2l6 3-6 3"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<!-- Flecha inferior ← (debajo de la anterior, ambas arriba del coche) -->
		<path
			d="M36 13H18M24 10l-6 3 6 3"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<!-- Turismo más grande, más abajo -->
		<path
			d="M4 40h40l-1.8-7.2c-.5-1.8-1.6-2.7-3.4-2.7H33l-3.6-7A2.7 2.7 0 0 0 27 21H17.2a2.7 2.7 0 0 0-2.4 1.4L11.6 30H9.2c-1.8 0-2.9 1-3.4 2.8L4 40Z"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
		<path
			d="M17.6 23.5 14.6 30h14.2l-2.8-6.5H17.6Z"
			stroke="currentColor"
			stroke-width="2.1"
			stroke-linejoin="round"
		/>
		<circle cx="14" cy="40.5" r="4.2" stroke="currentColor" stroke-width="2.3" />
		<circle cx="34" cy="40.5" r="4.2" stroke="currentColor" stroke-width="2.3" />
		<circle cx="14" cy="40.5" r="1.4" fill="currentColor" />
		<circle cx="34" cy="40.5" r="1.4" fill="currentColor" />
	{:else if id === 'etiqueta'}
		<!-- Distintivo DGT 0 (ocupa casi todo el lienzo) -->
		<circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="2.8" />
		<circle cx="24" cy="24" r="17.5" stroke="currentColor" stroke-width="1.5" opacity="0.45" />
		<text
			x="24"
			y="14.5"
			text-anchor="middle"
			dominant-baseline="middle"
			fill="currentColor"
			font-size="6"
			font-weight="800"
			font-family="system-ui, Arial, sans-serif"
			letter-spacing="0.4">DGT</text
		>
		<!-- 0 ovalado (más alto que ancho, como el dígito) -->
		<path
			fill="currentColor"
			fill-rule="evenodd"
			d="M24 17.2c-4.6 0-7.2 3.7-7.2 10.3S19.4 37.8 24 37.8s7.2-3.7 7.2-10.3S28.6 17.2 24 17.2Zm0 3.8c2.8 0 3.9 2.5 3.9 6.5S26.8 34 24 34s-3.9-2.5-3.9-6.5 1.1-6.5 3.9-6.5Z"
		/>
	{:else if id === 'etiqueta-vmp'}
		<circle cx="10" cy="36" r="6.2" stroke="currentColor" stroke-width="2.6" />
		<circle cx="10" cy="36" r="2" fill="currentColor" />
		<circle cx="38" cy="36" r="6.2" stroke="currentColor" stroke-width="2.6" />
		<circle cx="38" cy="36" r="2" fill="currentColor" />
		<path
			d="M10 32.5h20c1.5 0 2.5.7 3 1.9"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path
			d="M31 32.8 36.5 10"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
		/>
		<path
			d="M28 9.5h14"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
		/>
		<path
			d="M41.5 9.5v5.5"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linecap="round"
		/>
		<path
			d="M38 28c3.8.3 6.2 2.6 6.2 5.8"
			stroke="currentColor"
			stroke-width="2.2"
			stroke-linecap="round"
		/>
		<path
			d="M20 32.8 17.5 39"
			stroke="currentColor"
			stroke-width="2.2"
			stroke-linecap="round"
		/>
	{:else if id === 'informe'}
		<path
			d="M9 3h18l10 10v32H9V3Z"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linejoin="round"
		/>
		<path
			d="M27 3v12h12"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linejoin="round"
		/>
		<path
			d="M16 22h14M16 29h10"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linecap="round"
		/>
		<circle cx="34" cy="34" r="7" stroke="currentColor" stroke-width="2.6" />
		<path
			d="m39 39 5 5"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linecap="round"
		/>
	{:else if id === 'duplicado'}
		<rect
			x="3"
			y="10"
			width="42"
			height="28"
			rx="4"
			stroke="currentColor"
			stroke-width="2.6"
		/>
		<circle cx="15" cy="24" r="6" stroke="currentColor" stroke-width="2.6" />
		<path
			d="M26 18h14M26 24h11M26 30h8"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linecap="round"
		/>
	{:else if id === 'cancelacion'}
		<path
			d="M9 3h18l10 10v32H9V3Z"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linejoin="round"
		/>
		<path
			d="M27 3v12h12"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linejoin="round"
		/>
		<path
			d="m17 22 14 14M31 22 17 36"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
		/>
	{:else if id === 'notificacion-venta'}
		<text
			x="24"
			y="13"
			text-anchor="middle"
			fill="currentColor"
			font-size="16"
			font-weight="800"
			font-family="system-ui, Arial, sans-serif">€</text
		>
		<path
			d="M4 40h40l-1.8-7.2c-.5-1.8-1.6-2.7-3.4-2.7H33l-3.6-7A2.7 2.7 0 0 0 27 21H17.2a2.7 2.7 0 0 0-2.4 1.4L11.6 30H9.2c-1.8 0-2.9 1-3.4 2.8L4 40Z"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
		<path
			d="M17.6 23.5 14.6 30h14.2l-2.8-6.5H17.6Z"
			stroke="currentColor"
			stroke-width="2.1"
			stroke-linejoin="round"
		/>
		<circle cx="14" cy="40.5" r="4.2" stroke="currentColor" stroke-width="2.3" />
		<circle cx="34" cy="40.5" r="4.2" stroke="currentColor" stroke-width="2.3" />
		<circle cx="14" cy="40.5" r="1.4" fill="currentColor" />
		<circle cx="34" cy="40.5" r="1.4" fill="currentColor" />
	{:else if id === 'nota-simple'}
		<path
			d="M9 3h18l10 10v32H9V3Z"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linejoin="round"
		/>
		<path
			d="M27 3v12h12"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linejoin="round"
		/>
		<path
			d="M16 20h16M16 27h16M16 34h11"
			stroke="currentColor"
			stroke-width="2.6"
			stroke-linecap="round"
		/>
	{:else if id === 'baja-temporal'}
		<!-- X más arriba y separada del coche -->
		<path
			d="m17 3 14 14M31 3 17 17"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
		/>
		<path
			d="M4 42h40l-1.8-7.2c-.5-1.8-1.6-2.7-3.4-2.7H33l-3.6-7A2.7 2.7 0 0 0 27 23H17.2a2.7 2.7 0 0 0-2.4 1.4L11.6 32H9.2c-1.8 0-2.9 1-3.4 2.8L4 42Z"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
		<path
			d="M17.6 25.5 14.6 32h14.2l-2.8-6.5H17.6Z"
			stroke="currentColor"
			stroke-width="2.1"
			stroke-linejoin="round"
		/>
		<circle cx="14" cy="42.5" r="4.2" stroke="currentColor" stroke-width="2.3" />
		<circle cx="34" cy="42.5" r="4.2" stroke="currentColor" stroke-width="2.3" />
		<circle cx="14" cy="42.5" r="1.4" fill="currentColor" />
		<circle cx="34" cy="42.5" r="1.4" fill="currentColor" />
	{:else}
		<rect
			x="6"
			y="6"
			width="36"
			height="36"
			rx="6"
			stroke="currentColor"
			stroke-width="2.6"
		/>
	{/if}
</svg>

<style>
	.service-icon {
		display: block;
		flex-shrink: 0;
		color: var(--brand-teal);
	}
</style>
