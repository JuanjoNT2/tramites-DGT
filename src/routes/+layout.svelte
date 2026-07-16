<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import '$lib/styles/tokens.css';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { initAnalytics, trackPageView } from '$lib/analytics';

	let { children } = $props();

	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));

	function injectGtm(id: string) {
		if (document.getElementById('gtm-script')) return;
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
		const script = document.createElement('script');
		script.id = 'gtm-script';
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
		document.head.appendChild(script);

		const noscript = document.createElement('noscript');
		noscript.id = 'gtm-noscript';
		noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
		document.body.insertBefore(noscript, document.body.firstChild);
	}

	onMount(() => {
		if (isAdmin) return;
		initAnalytics();
		const gtmId = env.PUBLIC_GTM_ID;
		if (gtmId) injectGtm(gtmId);
	});

	afterNavigate(({ to }) => {
		if (to?.url.pathname && !to.url.pathname.startsWith('/admin')) {
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

{#if isAdmin}
	{@render children()}
{:else}
	<Nav />
	<main>{@render children()}</main>
	<Footer />
{/if}

<style>
	main {
		min-height: 60vh;
	}
</style>
