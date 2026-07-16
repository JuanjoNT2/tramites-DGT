<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import '$lib/styles/tokens.css';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { initAnalytics, trackPageView } from '$lib/analytics';

	let { children } = $props();

	onMount(() => initAnalytics());

	afterNavigate(({ to }) => {
		if (to?.url.pathname) {
			trackPageView(to.url.pathname);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" sizes="192x192" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<link rel="apple-touch-icon" href="/favicon.png" sizes="192x192" />
	<meta name="theme-color" content="#003050" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<Nav />
<main>{@render children()}</main>
<Footer />

<style>
	main {
		min-height: 60vh;
	}
</style>
