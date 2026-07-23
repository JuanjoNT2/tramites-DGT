<script lang="ts">
	let {
		email,
		children
	}: {
		email?: string | null;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="gestor">
	<aside class="side">
		<div class="brand">Panel gestor</div>
		<nav>
			<a href="/gestor">Solicitudes</a>
			<a href="/cuenta">Mi cuenta</a>
		</nav>
		{#if email}
			<p class="who">{email}</p>
		{/if}
		<a class="home" href="/">← Sitio público</a>
	</aside>
	<div class="main">
		{@render children()}
	</div>
</div>

<style>
	.gestor {
		display: grid;
		grid-template-columns: 220px 1fr;
		min-height: 100vh;
		background: #f4f7fa;
		color: #1a2b3c;
		font-family: 'Open Sans', system-ui, sans-serif;
	}
	.side {
		background: #003050;
		color: #fff;
		padding: 24px 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.brand {
		font-weight: 800;
		font-size: 1.05rem;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	nav a {
		color: #fff;
		text-decoration: none;
		padding: 8px 10px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
	}
	nav a:hover {
		background: rgba(255, 255, 255, 0.12);
	}
	.who {
		margin-top: auto;
		font-size: 0.75rem;
		opacity: 0.8;
		word-break: break-all;
	}
	.home {
		color: #9fd8e8;
		font-size: 0.85rem;
		text-decoration: none;
	}
	.main {
		padding: 28px 32px;
		overflow: auto;
	}
	@media (max-width: 800px) {
		.gestor {
			grid-template-columns: 1fr;
		}
		.side {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
		}
		.who {
			margin-top: 0;
			width: 100%;
		}
	}
</style>
