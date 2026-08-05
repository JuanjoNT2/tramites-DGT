<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { CtaIds, trackClick } from '$lib/analytics';
	import { isStaffRole } from '$lib/auth/roles';
	import { loginUrl } from '$lib/auth/urls';
	import { displayFirstName } from '$lib/cuenta/profile-prefill';
	import { servicesByGroup, calculators } from '$lib/data/services';
	import Logo from '$lib/components/layout/Logo.svelte';

	let open = $state(false);
	let openTramites = $state(false);
	let openCalculador = $state(false);
	let openAccount = $state(false);

	const tramiteGroups = servicesByGroup();

	const user = $derived(page.data.user);
	const profile = $derived(page.data.profile);
	const staff = $derived(isStaffRole(profile?.role));
	const brandHref = $derived(staff ? '/gestor' : '/');
	const displayName = $derived(displayFirstName(profile, user?.email));
	const accountLabel = $derived(`Hola, ${displayName}`);
	// Solo pathname: en prerender no se puede leer url.search
	const loginHref = $derived(loginUrl(page.url.pathname));

	function closeMobile() {
		open = false;
		openTramites = false;
		openCalculador = false;
		openAccount = false;
	}

	function toggleMobile() {
		openAccount = false;
		open = !open;
		if (!open) {
			openTramites = false;
			openCalculador = false;
		}
	}

	function toggleAccount() {
		open = false;
		openTramites = false;
		openCalculador = false;
		openAccount = !openAccount;
	}

	$effect(() => {
		if (!browser) return;
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	$effect(() => {
		if (!browser || (!open && !openAccount)) return;
		function onKey(e: KeyboardEvent) {
			if (e.key !== 'Escape') return;
			if (openAccount) openAccount = false;
			else closeMobile();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<header class="nav">
	<div class="wrap nav-in">
		<a class="brand" href={brandHref} onclick={closeMobile}>
			<Logo variant="dark" height={58} />
		</a>

		<nav class="links" aria-label="Principal">
			{#if staff}
				<a
					href="/gestor"
					data-analytics={CtaIds.NAV_LINK}
					onclick={() => trackClick(CtaIds.NAV_LINK, { destination: '/gestor' })}
				>
					Panel gestor
				</a>
			{:else}
				<div class="dropdown">
					<button type="button" class="drop-btn">Trámites ▾</button>
					<div class="drop-menu tramites-menu" role="menu">
						{#each tramiteGroups as group (group.id)}
							<div class="drop-section" data-group={group.id}>
								<span class="drop-section-label" role="presentation">{group.label}</span>
								{#each group.items as s (s.id)}
									<a
										href={s.tramitarPath}
										class="g-{group.id}"
										role="menuitem"
										data-analytics={CtaIds.NAV_TRAMITE}
										onclick={() =>
											trackClick(CtaIds.NAV_TRAMITE, {
												tramite: s.id,
												destination: s.tramitarPath
											})}
									>
										{s.title}
									</a>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			{/if}
			<div class="dropdown">
				<button type="button" class="drop-btn">Calculadora ▾</button>
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

		{#snippet accountMenu()}
			<div class="drop-menu account-menu" role="menu">
				{#if staff}
					<a href="/gestor" role="menuitem" onclick={() => (openAccount = false)}>Dashboard</a>
					<a href="/gestor/usuarios" role="menuitem" onclick={() => (openAccount = false)}
						>Usuarios</a
					>
					<a href="/gestor/seguridad" role="menuitem" onclick={() => (openAccount = false)}
						>Cambiar contraseña</a
					>
					<form method="POST" action="/gestor?/logout">
						<button type="submit" class="logout-item" role="menuitem">Cerrar sesión</button>
					</form>
				{:else}
					<a href="/cuenta" role="menuitem" onclick={() => (openAccount = false)}>Resumen</a>
					<a
						href="/cuenta/tramites?estado=en_curso"
						role="menuitem"
						onclick={() => (openAccount = false)}>Trámites en curso</a
					>
					<a
						href="/cuenta/tramites?estado=realizados"
						role="menuitem"
						onclick={() => (openAccount = false)}>Trámites realizados</a
					>
					<a href="/cuenta/vehiculos" role="menuitem" onclick={() => (openAccount = false)}
						>Mis vehículos</a
					>
					<a href="/cuenta/datos" role="menuitem" onclick={() => (openAccount = false)}>Mis datos</a>
					<a href="/cuenta/documentos" role="menuitem" onclick={() => (openAccount = false)}
						>Documentos</a
					>
					<a href="/cuenta/notificaciones" role="menuitem" onclick={() => (openAccount = false)}
						>Notificaciones</a
					>
					<form method="POST" action="/cuenta?/logout">
						<button type="submit" class="logout-item" role="menuitem">Cerrar sesión</button>
					</form>
				{/if}
			</div>
		{/snippet}

		{#if user}
			<div class="account-wrap dropdown account-drop">
				<button
					type="button"
					class="btn cta account-btn desktop-cta"
					title={user.email ?? 'Mi cuenta'}
					aria-label={`Sesión iniciada como ${displayName}`}
					aria-expanded={openAccount}
					onclick={toggleAccount}
				>
					{accountLabel} ▾
				</button>
				<!-- Menú colapsado: icono + «Hola…» a la izquierda del burger -->
				<button
					type="button"
					class="mobile-account-btn"
					title={user.email ?? 'Mi cuenta'}
					aria-label={`Sesión iniciada como ${displayName}`}
					aria-expanded={openAccount}
					onclick={toggleAccount}
				>
					<svg class="account-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
						<path
							fill="currentColor"
							d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"
						/>
					</svg>
					<span class="mobile-hello">{accountLabel}</span>
				</button>
				{#if openAccount}
					{@render accountMenu()}
				{/if}
			</div>
		{:else}
			<a
				href={loginHref}
				class="btn cta desktop-cta"
				data-analytics={CtaIds.NAV_LOGIN}
				onclick={() => trackClick(CtaIds.NAV_LOGIN, { destination: loginHref })}
			>
				Iniciar sesión
			</a>
		{/if}

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
				{#if staff}
					<a
						href="/gestor"
						onclick={() => {
							trackClick(CtaIds.NAV_LINK, { destination: '/gestor', nav: 'mobile' });
							closeMobile();
						}}>Panel gestor</a
					>
				{:else}
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
							<div class="mobile-sub tramites-mobile">
								{#each tramiteGroups as group (group.id)}
									<p class="mobile-section-label" data-group={group.id}>{group.label}</p>
									{#each group.items as s (s.id)}
										<a
											href={s.tramitarPath}
											class="g-{group.id}"
											onclick={() => {
												trackClick(CtaIds.NAV_TRAMITE, {
													tramite: s.id,
													destination: s.tramitarPath,
													nav: 'mobile'
												});
												closeMobile();
											}}>{s.title}</a
										>
									{/each}
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<div class="mobile-group">
					<button
						type="button"
						class="mobile-toggle"
						aria-expanded={openCalculador}
						onclick={() => (openCalculador = !openCalculador)}
					>
						Calculadora
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
				{#if user}
					{#if staff}
						<a href="/gestor" class="btn mobile-cta" onclick={closeMobile}>Panel gestor</a>
						<div class="mobile-sub account-mobile">
							<a href="/gestor/usuarios" onclick={closeMobile}>Usuarios</a>
							<a href="/gestor/seguridad" onclick={closeMobile}>Cambiar contraseña</a>
							<form method="POST" action="/gestor?/logout">
								<button type="submit" class="mobile-logout">Cerrar sesión</button>
							</form>
						</div>
					{:else}
						<p class="mobile-session" aria-live="polite">{accountLabel}</p>
						<div class="mobile-sub account-mobile">
							<a href="/cuenta" onclick={closeMobile}>Resumen</a>
							<a href="/cuenta/tramites?estado=en_curso" onclick={closeMobile}>Trámites en curso</a>
							<a href="/cuenta/tramites?estado=realizados" onclick={closeMobile}
								>Trámites realizados</a
							>
							<a href="/cuenta/vehiculos" onclick={closeMobile}>Mis vehículos</a>
							<a href="/cuenta/datos" onclick={closeMobile}>Mis datos</a>
							<a href="/cuenta/documentos" onclick={closeMobile}>Documentos</a>
							<a href="/cuenta/notificaciones" onclick={closeMobile}>Notificaciones</a>
							<form method="POST" action="/cuenta?/logout">
								<button type="submit" class="mobile-logout">Cerrar sesión</button>
							</form>
						</div>
					{/if}
				{:else}
					<a
						href={loginHref}
						class="btn mobile-cta"
						onclick={() => {
							trackClick(CtaIds.NAV_LOGIN, { destination: loginHref, nav: 'mobile' });
							closeMobile();
						}}
					>
						Iniciar sesión
					</a>
				{/if}
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

	.drop-menu.tramites-menu {
		min-width: 300px;
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

	.drop-section {
		position: relative;
		padding: 8px 0 4px;
	}

	.drop-section + .drop-section {
		border-top: 1px solid rgba(0, 48, 80, 0.08);
		margin-top: 2px;
	}

	.drop-section:first-child {
		padding-top: 12px;
	}

	.drop-section:last-child {
		padding-bottom: 10px;
	}

	.drop-section-label {
		display: block;
		padding: 4px 16px 6px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #6b7c8d;
	}

	.drop-section[data-group='titularidad'] .drop-section-label {
		color: #007a82;
	}
	.drop-section[data-group='documentacion'] .drop-section-label {
		color: #003050;
	}
	.drop-section[data-group='etiquetas'] .drop-section-label {
		color: #2f7d4a;
	}
	.drop-section[data-group='situacion'] .drop-section-label {
		color: #8a5a00;
	}

	.drop-menu a {
		display: block;
		position: relative;
		padding: 9px 16px 9px 14px;
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
		border-left: 3px solid transparent;
	}

	.drop-menu a.g-titularidad {
		border-left-color: #00c6d1;
	}
	.drop-menu a.g-documentacion {
		border-left-color: #003050;
	}
	.drop-menu a.g-etiquetas {
		border-left-color: #3da86a;
	}
	.drop-menu a.g-situacion {
		border-left-color: #d4a017;
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
		border: 1px solid transparent;
		border-radius: 10px;
		cursor: pointer;
		color: var(--ink);
		flex-shrink: 0;
		transition:
			background 0.18s var(--ease),
			border-color 0.18s var(--ease),
			color 0.18s var(--ease),
			transform 0.18s var(--ease);
	}

	.burger:hover {
		background: rgba(0, 198, 209, 0.12);
		border-color: rgba(0, 168, 179, 0.35);
		color: var(--navy, #003050);
		transform: scale(1.04);
	}

	.burger:active {
		transform: scale(0.97);
		background: rgba(0, 198, 209, 0.2);
	}

	.burger:focus-visible {
		outline: 2px solid var(--brand-teal, #00a8b3);
		outline-offset: 2px;
	}

	.burger:hover .burger-lines:not(.is-open) span:nth-child(1) {
		transform: translateY(-1px);
	}

	.burger:hover .burger-lines:not(.is-open) span:nth-child(3) {
		transform: translateY(1px);
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

	.mobile-section-label {
		margin: 10px 20px 2px;
		padding: 0 0 0 10px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #6b7c8d;
		border-left: 3px solid #c5d0da;
	}

	.mobile-section-label[data-group='titularidad'] {
		color: #007a82;
		border-left-color: #00c6d1;
	}
	.mobile-section-label[data-group='documentacion'] {
		color: #003050;
		border-left-color: #003050;
	}
	.mobile-section-label[data-group='etiquetas'] {
		color: #2f7d4a;
		border-left-color: #3da86a;
	}
	.mobile-section-label[data-group='situacion'] {
		color: #8a5a00;
		border-left-color: #d4a017;
	}

	.tramites-mobile a {
		border-left: 3px solid transparent;
		margin-left: 20px;
		padding-left: 12px;
	}
	.tramites-mobile a.g-titularidad {
		border-left-color: #00c6d1;
	}
	.tramites-mobile a.g-documentacion {
		border-left-color: #003050;
	}
	.tramites-mobile a.g-etiquetas {
		border-left-color: #3da86a;
	}
	.tramites-mobile a.g-situacion {
		border-left-color: #d4a017;
	}

	.mobile-cta {
		margin: 16px 20px 0;
		height: 46px;
		justify-content: center;
	}

	.mobile-session {
		margin: 16px 20px 8px;
		font-size: 15px;
		font-weight: 800;
		color: var(--navy, #003050);
	}

	.account-wrap {
		display: flex;
		align-items: center;
		position: relative;
		flex-shrink: 1;
		min-width: 0;
	}

	.account-btn {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 220px;
		border: none;
		cursor: pointer;
	}

	.mobile-account-btn {
		display: none;
		align-items: center;
		gap: 8px;
		max-width: min(200px, 46vw);
		height: 40px;
		padding: 0 10px;
		border: 1px solid rgba(0, 48, 80, 0.14);
		border-radius: 999px;
		background: #fff;
		color: var(--navy, #003050);
		font: inherit;
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
		min-width: 0;
	}

	.mobile-account-btn:hover,
	.mobile-account-btn[aria-expanded='true'] {
		border-color: var(--brand-teal, #00a8b3);
		background: rgba(0, 198, 209, 0.08);
	}

	.account-icon {
		flex-shrink: 0;
	}

	.mobile-hello {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.account-menu {
		right: 0;
		left: auto;
		min-width: 220px;
	}

	/* Visible al abrir por click (el hover del dropdown no basta en móvil) */
	.account-wrap > .account-menu {
		display: block;
	}

	.account-menu a,
	.logout-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 10px 14px;
		border: none;
		background: none;
		font: inherit;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
		cursor: pointer;
	}

	.account-menu a:hover,
	.logout-item:hover {
		background: rgba(0, 198, 209, 0.12);
	}

	.account-mobile {
		margin: 0 0 8px;
	}

	.mobile-logout {
		display: block;
		width: 100%;
		padding: 12px 20px 12px 32px;
		text-align: left;
		background: none;
		border: none;
		font: inherit;
		font-weight: 600;
		color: #9b1c1c;
		cursor: pointer;
	}

	.account-link {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--navy, #003050);
		text-decoration: none;
	}

	.mobile-staff {
		display: block;
		margin: 8px 20px 0;
		padding: 10px 16px;
		font-weight: 600;
		color: var(--ink);
	}

	@media (max-width: 980px) {
		.links,
		.desktop-cta {
			display: none;
		}

		.mobile-account-btn {
			display: inline-flex;
		}

		.burger {
			display: flex;
		}

		.mobile-panel {
			display: block;
		}
	}

	@media (max-width: 420px) {
		.mobile-hello {
			display: none;
		}

		.mobile-account-btn {
			width: 40px;
			padding: 0;
			justify-content: center;
			border-radius: 50%;
		}
	}
</style>