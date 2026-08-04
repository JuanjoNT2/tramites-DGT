<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import '$lib/styles/tokens.css';
	import ConsentBanner from '$lib/components/ConsentBanner.svelte';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import SessionIdleModal from '$lib/components/SessionIdleModal.svelte';
	import { createIdleTimeout } from '$lib/auth/idle-timeout';
	import { getSupabaseBrowser } from '$lib/supabase/browser';
	import { initAnalytics, trackPageView } from '$lib/analytics';
	import { organizationJsonLd, websiteJsonLd } from '$lib/seo/site';

	let { children } = $props();

	const isShell = $derived(
		page.url.pathname.startsWith('/admin') ||
			page.url.pathname.startsWith('/gestor') ||
			page.url.pathname.startsWith('/cuenta')
	);
	const siteLd = $derived(isShell ? null : [organizationJsonLd(), websiteJsonLd()]);
	const isLoggedIn = $derived(Boolean(page.data.user));

	let showIdleWarn = $state(false);
	let idleCtrl: ReturnType<typeof createIdleTimeout> | null = null;
	let loggingOut = false;

	async function logoutIdle() {
		if (loggingOut) return;
		loggingOut = true;
		showIdleWarn = false;
		idleCtrl?.stop();
		idleCtrl = null;
		try {
			const sb = getSupabaseBrowser();
			if (sb) await sb.auth.signOut();
		} catch {
			/* ignore */
		}
		await goto('/login?reason=idle', { invalidateAll: true });
		loggingOut = false;
	}

	function keepSession() {
		showIdleWarn = false;
		idleCtrl?.extend();
	}

	function syncIdleWatch() {
		if (!browser) return;
		if (!isLoggedIn) {
			showIdleWarn = false;
			idleCtrl?.stop();
			idleCtrl = null;
			return;
		}
		if (idleCtrl) return;
		idleCtrl = createIdleTimeout({
			onWarn: () => {
				showIdleWarn = true;
			},
			onExpire: () => {
				void logoutIdle();
			}
		});
		idleCtrl.start();
	}

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
		syncIdleWatch();
		if (!isShell) {
			initAnalytics();
			const gtmId = env.PUBLIC_GTM_ID;
			if (gtmId) injectGtm(gtmId);
		}
		return () => {
			idleCtrl?.stop();
			idleCtrl = null;
		};
	});

	$effect(() => {
		void isLoggedIn;
		syncIdleWatch();
	});

	afterNavigate(({ to }) => {
		const p = to?.url.pathname;
		if (
			p &&
			!p.startsWith('/admin') &&
			!p.startsWith('/gestor') &&
			!p.startsWith('/cuenta')
		) {
			trackPageView(p);
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
	{#if siteLd}
		{#each siteLd as item}
			{@html `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`}
		{/each}
	{/if}
</svelte:head>

{#if isShell}
	{@render children()}
{:else}
	<Nav />
	<main>{@render children()}</main>
	<Footer />
	<ConsentBanner />
{/if}

<SessionIdleModal open={showIdleWarn} onkeep={keepSession} onlogout={logoutIdle} />

<style>
	main {
		min-height: 60vh;
	}
</style>
