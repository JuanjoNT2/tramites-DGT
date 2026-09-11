<script lang="ts">
	import ProveedorShell from '$lib/components/proveedor/ProveedorShell.svelte';
	let { data, children } = $props();
</script>

<svelte:head>
	<title>Panel Ideauto | Trámites DGT Online</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<ProveedorShell email={data.email} role={data.role} vista={data.vista}>
	{@render children()}
</ProveedorShell>
