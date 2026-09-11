<script lang="ts">
	let {
		email,
		role = null,
		vista = 'inicio',
		children
	}: {
		email?: string | null;
		role?: string | null;
		vista?: string;
		children: import('svelte').Snippet;
	} = $props();

	let menuOpen = $state(false);

	function closeMenu() {
		menuOpen = false;
	}
</script>

<div class="proveedor">
	<aside class="side" class:open={menuOpen}>
		<div class="top">
			<div class="brand">
				<img src="/brand/ideauto.png" alt="Ideauto" width="472" height="151" />
				<span class="brand-sub">Distintivos ambientales</span>
			</div>
			<button
				type="button"
				class="menu-btn"
				aria-expanded={menuOpen}
				aria-controls="proveedor-nav"
				onclick={() => (menuOpen = !menuOpen)}
			>
				{menuOpen ? 'Cerrar' : 'Menú'}
			</button>
		</div>

		<div id="proveedor-nav" class="drawer" class:open={menuOpen}>
			<nav>
				<a href="/proveedor" class:active={vista === 'inicio'} onclick={closeMenu}>Distintivos</a>
				<a href="/proveedor/ajustes" class:active={vista === 'ajustes'} onclick={closeMenu}>
					Envío automático
				</a>
				<a href="/proveedor/seguridad" class:active={vista === 'seguridad'} onclick={closeMenu}>
					Cambiar contraseña
				</a>
			</nav>

			<div class="foot">
				{#if email}
					<p class="who">
						{email}
						{#if role}<span class="role">{role}</span>{/if}
					</p>
				{:else}
					<p class="who">
						Sin sesión · <a href="/login?next=/proveedor">Iniciar sesión</a>
					</p>
				{/if}
				<form method="POST" action="/proveedor?/logout" class="logout">
					<button type="submit">Cerrar sesión</button>
				</form>
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
	.proveedor {
		display: grid;
		grid-template-columns: 260px 1fr;
		min-height: 100vh;
		background: #f4f7fb;
		color: #1a2b3c;
		font-family: 'Open Sans', system-ui, sans-serif;
	}
	.side {
		background: #000038;
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
		gap: 8px;
		min-width: 0;
	}
	/* El logotipo es azul marino sobre transparente: necesita fondo claro */
	.brand img {
		width: 100%;
		max-width: 180px;
		height: auto;
		background: #fff;
		border-radius: 8px;
		padding: 8px 10px;
	}
	.brand-sub {
		font-size: 0.78rem;
		opacity: 0.75;
	}
	.menu-btn {
		display: none;
		border: 1px solid rgba(255, 255, 255, 0.35);
		background: transparent;
		color: #fff;
		border-radius: 8px;
		padding: 6px 10px;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
	}
	.drawer nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.drawer a {
		color: rgba(255, 255, 255, 0.88);
		text-decoration: none;
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
	}
	.drawer a:hover {
		background: rgba(255, 255, 255, 0.08);
	}
	.drawer a.active {
		background: #397ab2;
		color: #fff;
	}
	.foot {
		margin-top: auto;
		padding-top: 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.15);
		display: grid;
		gap: 10px;
	}
	.who {
		margin: 0;
		font-size: 0.78rem;
		opacity: 0.9;
		overflow-wrap: anywhere;
	}
	.who a {
		color: #8bb8dd;
	}
	.role {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.15);
		font-size: 0.65rem;
		text-transform: uppercase;
		font-weight: 800;
	}
	.logout {
		margin: 0;
	}
	.logout button {
		width: 100%;
		border: none;
		border-radius: 8px;
		padding: 9px 12px;
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		font: inherit;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.logout button:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	.scrim {
		display: none;
	}
	.main {
		padding: 24px 28px 48px;
		min-width: 0;
	}

	@media (max-width: 900px) {
		.proveedor {
			grid-template-columns: 1fr;
		}
		.side {
			position: sticky;
			min-height: 0;
			padding-bottom: 12px;
		}
		.brand img {
			max-width: 140px;
		}
		.menu-btn {
			display: inline-flex;
		}
		.drawer {
			display: none;
		}
		.drawer.open {
			display: block;
		}
		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			border: none;
			background: rgba(0, 0, 0, 0.35);
			z-index: 30;
		}
		.main {
			padding: 16px;
		}
	}
</style>
