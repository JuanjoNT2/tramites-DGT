<script lang="ts">
	import {
		SITE_NAME,
		SITE_ORIGIN,
		DEFAULT_OG_IMAGE,
		DEFAULT_DESCRIPTION,
		canonical
	} from '$lib/seo/site';

	let {
		title,
		description = DEFAULT_DESCRIPTION,
		path = '/',
		image = DEFAULT_OG_IMAGE,
		type = 'website',
		robots = 'index,follow',
		jsonLd = null
	}: {
		title: string;
		description?: string;
		path?: string;
		image?: string;
		type?: 'website' | 'article';
		robots?: string;
		jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
	} = $props();

	const url = $derived(canonical(path));
	const ogImage = $derived(image.startsWith('http') ? image : `${SITE_ORIGIN}${image}`);
	const ld = $derived(
		jsonLd == null ? null : Array.isArray(jsonLd) ? jsonLd : [jsonLd]
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="robots" content={robots} />
	<link rel="canonical" href={url} />

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:locale" content="es_ES" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />

	{#if ld}
		{#each ld as item}
			{@html `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`}
		{/each}
	{/if}
</svelte:head>
