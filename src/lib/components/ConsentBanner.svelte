<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { trackPageView } from '$lib/analytics';
	import {
		getAnalyticsConsent,
		setAnalyticsConsent,
		type ConsentState
	} from '$lib/analytics/consent';

	let state = $state<ConsentState>('unknown');

	onMount(() => {
		state = getAnalyticsConsent();
	});

	function grant() {
		setAnalyticsConsent('granted');
		state = 'granted';
		trackPageView(window.location.pathname);
	}

	function deny() {
		setAnalyticsConsent('denied');
		state = 'denied';
	}
</script>

{#if browser && state === 'unknown'}
	<div class="banner" role="dialog" aria-label="Consentimiento de analítica">
		<div class="inner">
			<p>
				Usamos analítica propia (primera parte) para mejorar el embudo de trámites. No vendemos tus
				datos. Puedes aceptar o rechazar el seguimiento anónimo.
			</p>
			<div class="actions">
				<button type="button" class="ghost" onclick={deny}>Rechazar</button>
				<button type="button" class="ok" onclick={grant}>Aceptar</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.banner {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 200;
		padding: 16px;
		pointer-events: none;
	}
	.inner {
		pointer-events: auto;
		max-width: 720px;
		margin: 0 auto;
		background: #003050;
		color: #fff;
		border: 1px solid rgba(0, 198, 209, 0.45);
		border-radius: 10px;
		padding: 16px 18px;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
	}
	p {
		margin: 0;
		font-size: 13px;
		line-height: 1.45;
		flex: 1;
		min-width: 220px;
		color: rgba(255, 255, 255, 0.92);
	}
	.actions {
		display: flex;
		gap: 8px;
	}
	button {
		height: 38px;
		padding: 0 14px;
		border-radius: 6px;
		font-weight: 700;
		font-size: 13px;
		cursor: pointer;
		border: none;
	}
	.ok {
		background: #00c6d1;
		color: #003050;
	}
	.ghost {
		background: transparent;
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.35);
	}
</style>
