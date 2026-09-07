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
		<img
			class="powered"
			src={onDark ? '/brand/valoe-gestoria-blanco.png' : '/brand/valoe-gestoria.png'}
			alt="Valoe Gestoría Administrativa"
			width="214"
			height="54"
		/>
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
		display: block;
		margin: 1px 0 0;
		height: 20px;
		width: auto;
		max-width: 128px;
		object-fit: contain;
		object-position: left center;
	}

	.mark {
		display: block;
		flex-shrink: 0;
		width: auto;
		border-radius: 6px;
	}
</style>
