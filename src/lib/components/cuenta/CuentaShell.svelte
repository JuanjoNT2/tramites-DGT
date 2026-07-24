<script lang="ts">
	let {
		email,
		displayName,
		unread = 0,
		children
	}: {
		email?: string | null;
		displayName?: string | null;
		unread?: number;
		children: import('svelte').Snippet;
	} = $props();

	const links = [
		{ href: '/cuenta', label: 'Resumen' },
		{ href: '/cuenta/tramites?estado=en_curso', label: 'Trámites en curso' },
		{ href: '/cuenta/tramites?estado=realizados', label: 'Trámites realizados' },
		{ href: '/cuenta/vehiculos', label: 'Mis vehículos' },
		{ href: '/cuenta/datos', label: 'Mis datos' },
		{ href: '/cuenta/documentos', label: 'Documentos' },
		{ href: '/cuenta/notificaciones', label: 'Notificaciones', badge: true }
	];
</script>

<div class="cuenta">
	<aside class="side">
		<div class="brand">Mi área</div>
		{#if displayName}
			<p class="who-name">{displayName}</p>
		{/if}
		{#if email}
			<p class="who">{email}</p>
		{/if}
		<nav>
			{#each links as l}
				<a href={l.href}>
					{l.label}
					{#if l.badge && unread > 0}
						<span class="badge">{unread}</span>
					{/if}
				</a>
			{/each}
		</nav>
		<form method="POST" action="?/logout" class="logout">
			<button type="submit">Cerrar sesión</button>
		</form>
		<a class="home" href="/">← Sitio público</a>
	</aside>
	<div class="main">
		{@render children()}
	</div>
</div>

<style>
	.cuenta {
		display: grid;
		grid-template-columns: 240px 1fr;
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
		gap: 12px;
	}
	.brand {
		font-weight: 800;
		font-size: 1.1rem;
	}
	.who-name {
		margin: 0;
		font-weight: 700;
	}
	.who {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.8;
		word-break: break-all;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 8px;
	}
	nav a {
		color: #fff;
		text-decoration: none;
		padding: 8px 10px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.88rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	nav a:hover {
		background: rgba(255, 255, 255, 0.12);
	}
	.badge {
		background: #00c6d1;
		color: #003050;
		font-size: 0.7rem;
		font-weight: 800;
		padding: 2px 7px;
		border-radius: 999px;
	}
	.logout {
		margin-top: auto;
	}
	.logout button {
		width: 100%;
		padding: 10px;
		border: none;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
		font-weight: 700;
		cursor: pointer;
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
	@media (max-width: 860px) {
		.cuenta {
			grid-template-columns: 1fr;
		}
		.side {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
		}
		nav {
			width: 100%;
			flex-direction: row;
			flex-wrap: wrap;
		}
		.logout {
			margin-top: 0;
			width: 100%;
		}
	}
</style>
