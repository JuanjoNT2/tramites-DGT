<script lang="ts">
	const LOGO_ON_LIGHT = '/brand/logo-oscuro.svg';
	const LOGO_ON_DARK = '/brand/logo-blanco.svg';

	let {
		variant = 'white',
		height = 56
	}: {
		variant?: 'default' | 'white' | 'dark' | 'mark';
		height?: number;
	} = $props();

	const isMark = $derived(variant === 'mark');
	const onDark = $derived(variant === 'white' || variant === 'default');
	const src = $derived(onDark ? LOGO_ON_DARK : LOGO_ON_LIGHT);
</script>

{#if isMark}
	<img class="logo mark" src="/favicon.png" alt="Trámites DGT Online" style="height: {height}px" />
{:else}
	<div class="lockup" class:on-light={!onDark}>
		<img
			class="wordmark"
			src={src}
			alt="Trámites DGT Online"
			width="250"
			height="66"
			style="height: {height}px; width: auto"
		/>
		<p class="powered">
			Powered by <span class="brand">Gestoria</span>
		</p>
	</div>
{/if}

<style>
	.lockup {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 3px;
		flex-shrink: 0;
	}

	.wordmark {
		display: block;
		/* evita que se recorte "DGT Online" */
		max-width: none;
		object-fit: contain;
		object-position: left top;
	}

	.powered {
		margin: 0;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.02em;
		line-height: 1.2;
		white-space: nowrap;
		color: rgba(255, 255, 255, 0.72);
	}

	.lockup.on-light .powered {
		color: rgba(26, 43, 60, 0.55);
	}

	.brand {
		color: var(--brand-teal);
		font-weight: 800;
	}

	.mark {
		display: block;
		flex-shrink: 0;
		width: auto;
		border-radius: 6px;
	}
</style>
