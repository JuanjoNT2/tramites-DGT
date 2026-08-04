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
	let menuOpen = $state(false);

	function closeMenu() {
		menuOpen = false;
	}
</script>

<div class="gestor">
	<aside class="side" class:open={menuOpen}>
		<div class="top">
			<div class="brand">
				<span class="brand-title">Panel de gestores</span>
				<span class="brand-sub">Usuarios y trámites</span>
			</div>
			<button
				type="button"
				class="menu-btn"
				aria-expanded={menuOpen}
				aria-controls="gestor-nav"
				onclick={() => (menuOpen = !menuOpen)}
			>
				{menuOpen ? 'Cerrar' : 'Menú'}
			</button>
		</div>

		<div id="gestor-nav" class="drawer" class:open={menuOpen}>
			<nav onclick={closeMenu}>
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

			<div class="foot">
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
			</div>
		</div>
	</aside>

	{#if menuOpen}
		<button type="button" class="scrim" aria-label="Cerrar menú" onclick={closeMenu}></button>
	{/if}

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
		padding: 20px 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		position: sticky;
		top: 0;
		align-self: start;
		min-height: 100vh;
		z-index: 40;
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}
	.brand {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
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
	.menu-btn {
		display: none;
		flex-shrink: 0;
		border: 1px solid rgba(255, 255, 255, 0.35);
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
		border-radius: 8px;
		padding: 8px 12px;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
	}
	.drawer {
		display: flex;
		flex-direction: column;
		gap: 16px;
		flex: 1;
		min-height: 0;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 6px;
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
	.foot {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.who {
		margin: 0;
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
	.scrim {
		display: none;
	}
	.main {
		padding: 28px 32px;
		overflow: auto;
		min-width: 0;
	}

	@media (max-width: 900px) {
		.gestor {
			grid-template-columns: 1fr;
		}
		.side {
			position: sticky;
			top: 0;
			min-height: 0;
			padding: 12px 14px;
			gap: 0;
		}
		.menu-btn {
			display: inline-flex;
			align-items: center;
		}
		.drawer {
			display: none;
			margin-top: 12px;
			padding-top: 4px;
			border-top: 1px solid rgba(255, 255, 255, 0.12);
		}
		.drawer.open {
			display: flex;
		}
		.foot {
			margin-top: 8px;
		}
		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 30;
			border: none;
			padding: 0;
			background: rgba(0, 24, 40, 0.35);
			cursor: pointer;
		}
		.side {
			z-index: 40;
		}
		.main {
			padding: 20px 16px;
		}
	}
</style>
