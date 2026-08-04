<script lang="ts">
	import CuentaShell from '$lib/components/cuenta/CuentaShell.svelte';

	let { data, children } = $props();
</script>

<svelte:head>
	<title>Mi área | Trámites DGT Online</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<CuentaShell
	email={data.email}
	displayName={data.displayName}
	unread={data.unread}
	profileIncomplete={data.profileIncomplete}
>
	{@render children()}
</CuentaShell>
