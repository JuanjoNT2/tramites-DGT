<script lang="ts">
	import { browser } from '$app/environment';
	import { CtaIds, trackClick } from '$lib/analytics';
	import { services, calculators } from '$lib/data/services';
	import Logo from '$lib/components/layout/Logo.svelte';

	let open = $state(false);
	let openTramites = $state(false);
	let openCalculador = $state(false);

	function closeMobile() {
		open = false;
		openTramites = false;
		openCalculador = false;
	}

	function toggleMobile() {
		open = !open;
		if (!open) {
			openTramites = false;
			openCalculador = false;
		}
	}

	$effect(() => {
		if (!browser) return;
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	$effect(() => {
		if (!browser || !open) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') closeMobile();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<header class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/" onclick={closeMobile}>
			<Logo variant="dark" height={58} />
		</a>

		<nav class="links" aria-label="Principal">
			<div class="dropdown">
				<button type="button" class="drop-btn">Trámites ▾</button>
				<div class="drop-menu" role="menu">
					{#each services as s (s.id)}
						<a
							href={s.landingPath}
							role="menuitem"
							data-analytics={CtaIds.NAV_TRAMITE}
							onclick={() =>
								trackClick(CtaIds.NAV_TRAMITE, { tramite: s.id, destination: s.landingPath })}
						>
							{s.title}
						</a>
					{/each}
				</div>
			</div>
			<div class="dropdown">
				<button type="button" class="drop-btn">Calculador ▾</button>
				<div class="drop-menu" role="menu">
					{#each calculators as c}
						<a
							href={c.path}
							role="menuitem"
							data-analytics={CtaIds.NAV_CALCULADOR}
							onclick={() => trackClick(CtaIds.NAV_CALCULADOR, { destination: c.path })}
						>
							{c.title}
						</a>
					{/each}
				</div>
			</div>
			<a
				href="/noticias"
				data-analytics={CtaIds.NAV_LINK}
				onclick={() => trackClick(CtaIds.NAV_LINK, { destination: '/noticias' })}>Noticias</a
			>
			<a
				href="/quienes-somos"
				data-analytics={CtaIds.NAV_LINK}
				onclick={() => trackClick(CtaIds.NAV_LINK, { destination: '/quienes-somos' })}
				>Quiénes somos</a
			>
			<a
				href="/preguntas-frecuentes"
				data-analytics={CtaIds.NAV_LINK}
				onclick={() => trackClick(CtaIds.NAV_LINK, { destination: '/preguntas-frecuentes' })}
				>FAQS</a
			>
			<a
				href="/contacto"
				data-analytics={CtaIds.NAV_LINK}
				onclick={() => trackClick(CtaIds.NAV_LINK, { destination: '/contacto' })}>Contacto</a
			>
		</nav>

		<a
			href="/tramitar/transferencia"
			class="btn cta desktop-cta"
			data-analytics={CtaIds.NAV_LOGIN}
			onclick={() =>
				trackClick(CtaIds.NAV_LOGIN, { tramite: 'transferencia', destination: '/tramitar/transferencia' })}
		>
			Iniciar sesión
		</a>

		<button
			type="button"
			class="burger"
			aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
			aria-expanded={open}
			aria-controls="mobile-menu"
			onclick={toggleMobile}
		>
			<span class="burger-lines" class:is-open={open} aria-hidden="true">
				<span></span>
				<span></span>
				<span></span>
			</span>
		</button>
	</div>

	{#if open}
		<div
			id="mobile-menu"
			class="mobile-panel"
			role="dialog"
			aria-modal="true"
			aria-label="Menú de navegación"
		>
			<nav class="mobile-nav" aria-label="Menú móvil">
				<div class="mobile-group">
					<button
						type="button"
						class="mobile-toggle"
						aria-expanded={openTramites}
						onclick={() => (openTramites = !openTramites)}
					>
						Trámites
						<span aria-hidden="true">{openTramites ? '▴' : '▾'}</span>
					</button>
					{#if openTramites}
						<div class="mobile-sub">
							{#each services as s (s.id)}
								<a
									href={s.landingPath}
									onclick={() => {
										trackClick(CtaIds.NAV_TRAMITE, {
											tramite: s.id,
											destination: s.landingPath,
											nav: 'mobile'
										});
										closeMobile();
									}}>{s.title}</a
								>
							{/each}
						</div>
					{/if}
				</div>

				<div class="mobile-group">
					<button
						type="button"
						class="mobile-toggle"
						aria-expanded={openCalculador}
						onclick={() => (openCalculador = !openCalculador)}
					>
						Calculador
						<span aria-hidden="true">{openCalculador ? '▴' : '▾'}</span>
					</button>
					{#if openCalculador}
						<div class="mobile-sub">
							{#each calculators as c}
								<a
									href={c.path}
									onclick={() => {
										trackClick(CtaIds.NAV_CALCULADOR, { destination: c.path, nav: 'mobile' });
										closeMobile();
									}}>{c.title}</a
								>
							{/each}
						</div>
					{/if}
				</div>

				<a
					href="/noticias"
					onclick={() => {
						trackClick(CtaIds.NAV_LINK, { destination: '/noticias', nav: 'mobile' });
						closeMobile();
					}}>Noticias</a
				>
				<a
					href="/quienes-somos"
					onclick={() => {
						trackClick(CtaIds.NAV_LINK, { destination: '/quienes-somos', nav: 'mobile' });
						closeMobile();
					}}>Quiénes somos</a
				>
				<a
					href="/preguntas-frecuentes"
					onclick={() => {
						trackClick(CtaIds.NAV_LINK, { destination: '/preguntas-frecuentes', nav: 'mobile' });
						closeMobile();
					}}>FAQS</a
				>
				<a
					href="/contacto"
					onclick={() => {
						trackClick(CtaIds.NAV_LINK, { destination: '/contacto', nav: 'mobile' });
						closeMobile();
					}}>Contacto</a
				>
				<a
					href="/tramitar/transferencia"
					class="btn mobile-cta"
					onclick={() => {
						trackClick(CtaIds.NAV_LOGIN, {
							tramite: 'transferencia',
							destination: '/tramitar/transferencia',
							nav: 'mobile'
						});
						closeMobile();
					}}
				>
					Iniciar sesión
				</a>
			</nav>
		</div>
	{/if}
</header>

<style>
	.nav {
		position: sticky;
		top: 0;
		z-index: 100;
		background: #f3f7fa;
		border-bottom: 1px solid rgba(0, 48, 80, 0.1);
		box-shadow: 0 2px 16px rgba(0, 48, 80, 0.08);
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
		color: var(--ink);
		background: none;
		border: none;
		cursor: pointer;
		padding: 10px 0;
		white-space: nowrap;
	}

	.links > a:hover,
	.drop-btn:hover,
	.dropdown:focus-within .drop-btn {
		color: var(--primary-dark);
	}

	.dropdown {
		position: relative;
	}

	/* Puente invisible para no perder el hover al bajar al menú */
	.drop-menu {
		display: none;
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 260px;
		padding-top: 10px;
		z-index: 20;
	}

	.drop-menu::before {
		content: '';
		position: absolute;
		inset: 10px 0 0;
		background: #fff;
		border: 1px solid rgba(0, 48, 80, 0.1);
		border-top: 3px solid var(--brand-teal);
		border-radius: var(--radius);
		box-shadow: 0 12px 32px rgba(0, 48, 80, 0.14);
		z-index: -1;
	}

	.dropdown:hover .drop-menu,
	.dropdown:focus-within .drop-menu {
		display: block;
	}

	.drop-menu a {
		display: block;
		position: relative;
		padding: 10px 16px;
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
	}

	.drop-menu a:first-child {
		padding-top: 14px;
	}

	.drop-menu a:last-child {
		padding-bottom: 14px;
	}

	.drop-menu a:hover {
		background: var(--primary-dim);
		color: var(--primary-dark);
	}

	.cta {
		height: 42px;
		font-size: 14px;
		padding: 0 18px;
		flex-shrink: 0;
	}

	.burger {
		display: none;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		margin-right: -6px;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--ink);
		flex-shrink: 0;
	}

	.burger-lines {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 22px;
		height: 16px;
	}

	.burger-lines span {
		display: block;
		height: 2px;
		width: 100%;
		background: currentColor;
		border-radius: 1px;
		transition:
			transform 0.2s var(--ease),
			opacity 0.2s var(--ease);
		transform-origin: center;
	}

	.burger-lines.is-open span:nth-child(1) {
		transform: translateY(7px) rotate(45deg);
	}

	.burger-lines.is-open span:nth-child(2) {
		opacity: 0;
	}

	.burger-lines.is-open span:nth-child(3) {
		transform: translateY(-7px) rotate(-45deg);
	}

	.mobile-panel {
		display: none;
		border-top: 1px solid rgba(0, 48, 80, 0.1);
		background: #eef3f7;
		max-height: calc(100vh - 84px);
		overflow-y: auto;
	}

	.mobile-nav {
		display: flex;
		flex-direction: column;
		padding: 8px 0 24px;
	}

	.mobile-nav > a,
	.mobile-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 14px 20px;
		font-size: 16px;
		font-weight: 600;
		color: var(--ink);
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
	}

	.mobile-nav > a:hover,
	.mobile-toggle:hover {
		color: var(--primary-dark);
		background: rgba(0, 198, 209, 0.1);
	}

	.mobile-sub {
		display: flex;
		flex-direction: column;
		padding: 0 0 8px;
		background: rgba(0, 48, 80, 0.04);
	}

	.mobile-sub a {
		display: block;
		padding: 12px 20px 12px 32px;
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
	}

	.mobile-sub a:hover {
		color: var(--primary-dark);
		background: rgba(0, 198, 209, 0.1);
	}

	.mobile-cta {
		margin: 16px 20px 0;
		height: 46px;
		justify-content: center;
	}

	@media (max-width: 980px) {
		.links,
		.desktop-cta {
			display: none;
		}

		.burger {
			display: flex;
		}

		.mobile-panel {
			display: block;
		}
	}
</style>