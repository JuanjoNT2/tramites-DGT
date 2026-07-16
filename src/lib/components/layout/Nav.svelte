<script lang="ts">
	import { services, calculators } from '$lib/data/services';
	import Logo from '$lib/components/layout/Logo.svelte';
</script>

<header class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/">
			<Logo variant="white" height={58} />
		</a>
		<nav class="links">
			<div class="dropdown">
				<button type="button" class="drop-btn">Trámites ▾</button>
				<div class="drop-menu">
					{#each services as s (s.id)}
						<a href={s.landingPath}>{s.title}</a>
					{/each}
				</div>
			</div>
			<div class="dropdown">
				<button type="button" class="drop-btn">Calculador ▾</button>
				<div class="drop-menu">
					{#each calculators as c}
						<a href={c.path}>{c.title}</a>
					{/each}
				</div>
			</div>
			<a href="/noticias">Noticias</a>
			<a href="/quienes-somos">Quiénes somos</a>
			<a href="/preguntas-frecuentes">FAQS</a>
			<a href="/contacto">Contacto</a>
		</nav>
		<a href="/tramitar/transferencia" class="btn cta">Iniciar sesión</a>
	</div>
</header>

<style>
	.nav {
		position: sticky;
		top: 0;
		z-index: 100;
		background: #003050;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.28);
	}

	.nav-in {
		display: flex;
		align-items: center;
		min-height: 84px;
		gap: 20px;
	}

	.brand {
		display: flex;
		align-items: center;
		margin-right: auto;
		flex-shrink: 0;
	}

	.brand:hover {
		opacity: 0.92;
	}

	.links {
		display: flex;
		align-items: center;
		gap: 18px;
	}

	.links > a,
	.drop-btn {
		font-size: 14px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.94);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		white-space: nowrap;
	}

	.links > a:hover,
	.drop-btn:hover {
		color: var(--brand-teal);
	}

	.dropdown {
		position: relative;
	}

	.drop-menu {
		display: none;
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 260px;
		background: #003050;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-top: 3px solid var(--brand-teal);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
		padding: 8px 0;
		margin-top: 8px;
	}

	.dropdown:hover .drop-menu {
		display: block;
	}

	.drop-menu a {
		display: block;
		padding: 10px 16px;
		font-size: 14px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.92);
	}

	.drop-menu a:hover {
		background: rgba(0, 198, 209, 0.14);
		color: var(--brand-teal);
	}

	.cta {
		height: 42px;
		font-size: 14px;
		padding: 0 18px;
	}

	@media (max-width: 980px) {
		.links {
			display: none;
		}
	}
</style>
