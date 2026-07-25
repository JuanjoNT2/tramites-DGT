<script lang="ts">
	let {
		email,
		role = null,
		vista = 'todos',
		children
	}: {
		email?: string | null;
		role?: string | null;
		vista?: string;
		children: import('svelte').Snippet;
	} = $props();

	const tramitesActive = $derived(typeof vista === 'string' && vista.startsWith('tramites'));
</script>

<div class="gestor">
	<aside class="side">
		<div class="brand">
			<span class="brand-title">Panel de gestores</span>
			<span class="brand-sub">Usuarios y trámites</span>
		</div>
		<p class="badge">Operación · no es el área del ciudadano ni /admin</p>
		<nav>
			<a href="/gestor?vista=todos" class:active={vista === 'todos'}>Todos los usuarios</a>
			<a
				href="/gestor?vista=en_curso"
				class:active={vista === 'en_curso' || vista === 'pendientes'}
				>Con trámites en curso</a
			>
			<a href="/gestor?vista=finalizados" class:active={vista === 'finalizados'}
				>Trámites finalizados</a
			>
			<a href="/gestor?vista=sin_tramites" class:active={vista === 'sin_tramites'}>Sin trámites</a>
			<a href="/gestor/tramites?vista=pendientes" class:active={tramitesActive}
				>Cola de trámites</a
			>
			<a href="/gestor/seguridad" class:active={vista === 'seguridad'}>Cambiar contraseña</a>
		</nav>
		{#if email}
			<p class="who">
				{email}
				{#if role}<span class="role">{role}</span>{/if}
			</p>
		{:else}
			<p class="who">
				Sin sesión · <a href="/login?next=/gestor">Iniciar sesión</a>
			</p>
		{/if}
		<form method="POST" action="/gestor?/logout" class="logout">
			<button type="submit">Cerrar sesión</button>
		</form>
		<a class="home" href="/">← Sitio público</a>
	</aside>
	<div class="main">
		{@render children()}
	</div>
</div>

<style>
	.gestor {
		display: grid;
		grid-template-columns: 260px 1fr;
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
		gap: 14px;
	}
	.brand {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.brand-title {
		font-weight: 800;
		font-size: 1.05rem;
	}
	.brand-sub {
		font-size: 0.75rem;
		opacity: 0.75;
		font-weight: 500;
	}
	.badge {
		margin: 0;
		font-size: 0.7rem;
		line-height: 1.35;
		padding: 8px 10px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: #c5e8f2;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	nav a {
		color: #fff;
		text-decoration: none;
		padding: 10px 12px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.88rem;
		line-height: 1.3;
	}
	nav a:hover,
	nav a.active {
		background: rgba(255, 255, 255, 0.14);
	}
	nav a.active {
		outline: 1px solid rgba(159, 216, 232, 0.45);
	}
	.who {
		margin-top: auto;
		font-size: 0.75rem;
		opacity: 0.9;
		word-break: break-all;
	}
	.who a {
		color: #9fd8e8;
	}
	.role {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 999px;
		background: rgba(159, 216, 232, 0.25);
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.logout {
		margin: 0;
	}
	.logout button {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.35);
		color: #fff;
		padding: 8px 10px;
		border-radius: 8px;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		width: 100%;
		text-align: left;
	}
	.logout button:hover {
		background: rgba(255, 255, 255, 0.1);
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
