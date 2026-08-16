<script lang="ts">
	let {
		email,
		displayName,
		unread = 0,
		profileIncomplete = false,
		children
	}: {
		email?: string | null;
		displayName?: string | null;
		unread?: number;
		profileIncomplete?: boolean;
		children: import('svelte').Snippet;
	} = $props();

	const links = [
		{ href: '/cuenta', label: 'Resumen' },
		{ href: '/cuenta/tramites?estado=en_curso', label: 'Trámites en curso' },
		{ href: '/cuenta/tramites?estado=realizados', label: 'Trámites realizados' },
		{ href: '/cuenta/vehiculos', label: 'Mis vehículos' },
		{ href: '/cuenta/datos', label: 'Mis datos' },
		{ href: '/cuenta/seguridad', label: 'Seguridad' },
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
		<form method="POST" action="/cuenta?/logout" class="logout">
			<button type="submit">Cerrar sesión</button>
		</form>
		<a class="home" href="/">← Volver a Trámites DGT Online</a>
	</aside>
	<div class="main">
		{#if profileIncomplete}
			<p class="incomplete" role="status">
				Faltan datos obligatorios (móvil y/o NIF/NIE).
				<a href="/cuenta/datos">Completar en Mis datos</a>
			</p>
		{/if}
		{@render children()}
	</div>
</div>

<style>
	.cuenta {
		display: grid;
		grid-template-columns: 200px minmax(0, 1fr);
		min-height: 100vh;
		max-width: 100%;
		overflow-x: clip;
		background: #f4f7fa;
		color: #1a2b3c;
		font-family: 'Open Sans', system-ui, sans-serif;
	}
	.side {
		width: 200px;
		max-width: 200px;
		box-sizing: border-box;
		background: #003050;
		color: #fff;
		padding: 16px 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.brand {
		font-weight: 800;
		font-size: 1.05rem;
	}
	.who-name {
		margin: 0;
		font-weight: 700;
		font-size: 0.92rem;
	}
	.who {
		margin: 0;
		font-size: 0.72rem;
		opacity: 0.8;
		word-break: break-all;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	nav a {
		color: #fff;
		text-decoration: none;
		padding: 6px 8px;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.82rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 6px;
		line-height: 1.25;
	}
	nav a:hover {
		background: rgba(255, 255, 255, 0.12);
	}
	.badge {
		background: #00c6d1;
		color: #003050;
		font-size: 0.68rem;
		font-weight: 800;
		padding: 2px 6px;
		border-radius: 999px;
		flex-shrink: 0;
	}
	.logout {
		margin-top: auto;
	}
	.logout button {
		width: 100%;
		padding: 8px;
		border: none;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.home {
		color: #9fd8e8;
		font-size: 0.8rem;
		text-decoration: none;
	}
	.main {
		min-width: 0;
		padding: 24px 28px;
		overflow-x: auto;
		overflow-y: auto;
	}
	.incomplete {
		margin: 0 0 16px;
		padding: 12px 14px;
		background: #fff4e5;
		color: #7a4b00;
		border-radius: 10px;
		font-size: 0.92rem;
		font-weight: 600;
	}
	.incomplete a {
		color: #003050;
		font-weight: 800;
	}
	@media (max-width: 860px) {
		.cuenta {
			grid-template-columns: minmax(0, 1fr);
		}
		.side {
			width: 100%;
			max-width: 100%;
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			gap: 6px 10px;
		}
		nav {
			width: 100%;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 4px;
		}
		.logout {
			margin-top: 0;
			width: 100%;
		}
		.main {
			padding: 20px 16px;
		}
	}
</style>
