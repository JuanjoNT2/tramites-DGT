<script lang="ts">
	import { CtaIds, trackClick } from '$lib/analytics';
	import { services, advantages, testimonials, processSteps } from '$lib/data/services';
	import ServiceIcon from '$lib/components/ui/ServiceIcon.svelte';
	import TestimonialsCarousel from '$lib/components/TestimonialsCarousel.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	let activeStep = $state(0);
	const seo = getStaticSeo('/')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="hero">
	<div class="hero-bg" aria-hidden="true"></div>
	<div class="wrap hero-copy">
		<h1>Los trámites que necesita <strong>tu vehículo</strong></h1>
		<p class="sub">
			En Trámites DGT Online puedes realizar los trámites que necesita tu vehículo, sin cita previa, ni
			esperas, todo desde tu dispositivo móvil o en cualquier dispositivo con conexión a Internet.
		</p>
	</div>
	<div class="wrap">
		<div class="service-row">
			{#each services as s (s.id)}
				<article class="service-card">
					<div class="icon-circle">
						<ServiceIcon id={s.id} size={22} />
					</div>
					<h3>{s.title}</h3>
					<p>{s.description}</p>
					<a
						class="tramitar"
						href={s.tramitarPath}
						data-analytics={CtaIds.HOME_TRAMITAR}
						onclick={() => trackClick(CtaIds.HOME_TRAMITAR, { tramite: s.id, destination: s.tramitarPath })}
					>
						Tramitar
					</a>
				</article>
			{/each}
		</div>
	</div>
</section>

<section class="section advantages">
	<div class="wrap">
		<div class="sec-head">
			<h2>Ventajas de realizar trámites 100% online</h2>
			<p class="sec-sub">
				Trámites DGT es la plataforma online que te permite transferir cualquier vehículo 100% online.
			</p>
		</div>
		<div class="grid-4">
			{#each advantages as a}
				<div class="adv">
					<h3>{a.title}</h3>
					<p>{a.desc}</p>
				</div>
			{/each}
		</div>
		<div class="adv-cta">
			<a class="btn" href="/quienes-somos">Sobre nosotros</a>
		</div>
	</div>
</section>

<section class="section servicios-img">
	<div class="wrap">
		<div class="sec-head">
			<h2>Conoce nuestros principales servicios:</h2>
		</div>
	</div>

	{#each services as s, i (s.id)}
		<article class="feature" class:reverse={i % 2 === 1}>
			<div class="feature-media">
				<img
					src={s.image}
					alt={s.title}
					width="1200"
					height="800"
					loading="lazy"
					decoding="async"
				/>
			</div>
			<div class="feature-copy">
				<div class="feature-copy-in">
					<h3>{s.title}</h3>
					<p>{s.description}</p>
					<div class="feature-actions">
						<a
							class="btn"
							href={s.tramitarPath}
							data-analytics={CtaIds.HOME_TRAMITAR}
							onclick={() =>
								trackClick(CtaIds.HOME_TRAMITAR, { tramite: s.id, destination: s.tramitarPath })}
						>
							Tramitar
						</a>
						<a
							class="btn ghost"
							href={s.landingPath}
							data-analytics={CtaIds.HOME_VER_TRAMITE}
							onclick={() =>
								trackClick(CtaIds.HOME_VER_TRAMITE, { tramite: s.id, destination: s.landingPath })}
						>
							Ver trámite
						</a>
					</div>
				</div>
			</div>
		</article>
	{/each}
</section>

<section class="section process">
	<div class="wrap">
		<p class="eyebrow">Transferencia de vehículos</p>
		<h2>
			Un funcionamiento muy sencillo e intuitivo, el sistema te guiará paso a paso durante todo el
			proceso.
		</h2>
		<p class="guide">A continuación una guía paso a paso:</p>

		<div class="tabs" role="tablist" aria-label="Pasos del trámite">
			{#each processSteps as step, i}
				<button
					type="button"
					role="tab"
					class:active={activeStep === i}
					aria-selected={activeStep === i}
					onclick={() => (activeStep = i)}
				>
					{step.label}
				</button>
			{/each}
		</div>

		{#each processSteps as step, i}
			{#if activeStep === i}
				<div class="step-panel" role="tabpanel">
					<div class="step-text">
						<span class="step-num">{i + 1}</span>
						<h3>{step.title}</h3>
						<p>{step.desc}</p>
						<a class="btn big" href="/tramitar/transferencia">Transferir mi vehículo ahora</a>
					</div>
					<div class="step-visual">
						<img
							src={step.image}
							alt={step.title}
							width="715"
							height="421"
							loading="lazy"
							decoding="async"
						/>
					</div>
				</div>
			{/if}
		{/each}
	</div>
</section>

<section class="section testimonials">
	<div class="wrap">
		<div class="sec-head">
			<h2>¿Qué opinan nuestros clientes?</h2>
		</div>
		<TestimonialsCarousel items={testimonials} />
	</div>
</section>

<style>
	.hero {
		position: relative;
		padding: 72px 0 56px;
		overflow: hidden;
		min-height: 70vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background-color: #003050;
		background-image:
			linear-gradient(105deg, rgba(0, 48, 80, 0.88) 0%, rgba(0, 48, 80, 0.72) 42%, rgba(0, 36, 56, 0.55) 100%),
			url('/images/hero.webp');
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center;
		z-index: 0;
	}

	.hero-bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(0, 48, 80, 0.25) 0%, rgba(0, 24, 40, 0.45) 100%);
		pointer-events: none;
	}

	.hero-copy,
	.service-row {
		position: relative;
		z-index: 1;
	}

	.hero-copy {
		max-width: 720px;
		margin-bottom: 40px;
	}

	h1 {
		font-size: clamp(32px, 5vw, 48px);
		font-weight: 700;
		line-height: 1.12;
		letter-spacing: -0.03em;
		color: #fff;
	}

	h1 strong {
		font-weight: 800;
	}

	.sub {
		margin-top: 16px;
		font-size: 17px;
		line-height: 1.55;
		color: var(--text2-on-dark);
		max-width: 54ch;
	}

	.service-row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 12px;
	}

	.service-card {
		display: flex;
		flex-direction: column;
		padding: 18px 14px;
		background: #00305066;
		border: 1px solid var(--brand-teal);
		border-radius: 12px;
		backdrop-filter: blur(6px);
		min-height: 220px;
		transition: background 0.25s var(--ease);
	}

	.service-card:hover {
		background: #003050;
	}

	.icon-circle {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--brand-teal);
		margin-bottom: 12px;
	}

	.icon-circle :global(.service-icon) {
		color: #fff;
	}

	.service-card h3 {
		font-size: 14px;
		font-weight: 800;
		color: #fff;
		line-height: 1.25;
		margin-bottom: 8px;
	}

	.service-card p {
		font-size: 12px;
		line-height: 1.4;
		color: rgba(255, 255, 255, 0.78);
		flex: 1;
		margin-bottom: 14px;
	}

	.tramitar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 40px;
		padding: 0 22px;
		border: 1px solid var(--brand-teal);
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		color: #fff;
		align-self: flex-start;
		margin-top: auto;
	}

	.tramitar:hover {
		background: var(--brand-teal);
		color: #003050;
	}

	.advantages {
		background: var(--bg-section);
	}

	.adv {
		padding: 22px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: var(--radius-lg);
		border-top: 3px solid var(--brand-teal);
	}

	.adv h3 {
		font-size: 18px;
		font-weight: 800;
		color: #fff;
		margin-bottom: 8px;
	}

	.adv p {
		font-size: 14px;
		color: var(--text2-on-dark);
		line-height: 1.5;
	}

	.adv-cta {
		display: flex;
		justify-content: center;
		margin-top: 28px;
	}

	.servicios-img {
		padding: 64px 0 0;
		background: #003050;
	}

	.servicios-img .sec-head {
		margin-bottom: 28px;
	}

	.feature {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		min-height: 340px;
	}

	.feature.reverse {
		grid-template-columns: 0.9fr 1.1fr;
	}

	.feature.reverse .feature-media {
		order: 2;
	}

	.feature.reverse .feature-copy {
		order: 1;
	}

	.feature-media {
		min-height: 280px;
		overflow: hidden;
		background: #00263d;
	}

	.feature-media img {
		width: 100%;
		height: 100%;
		min-height: 280px;
		object-fit: cover;
		display: block;
	}

	.feature-copy {
		display: flex;
		align-items: center;
		background: linear-gradient(160deg, #00263d 0%, #003050 100%);
		padding: 40px 36px;
	}

	.feature-copy-in {
		max-width: 420px;
	}

	.feature-copy h3 {
		font-size: clamp(24px, 3vw, 32px);
		font-weight: 800;
		color: #fff;
		margin-bottom: 12px;
		line-height: 1.2;
	}

	.feature-copy p {
		font-size: 16px;
		line-height: 1.55;
		color: var(--text2-on-dark);
		margin-bottom: 24px;
	}

	.feature-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.btn.ghost {
		background: transparent;
		border: 1px solid var(--brand-teal);
		color: #fff;
	}

	.btn.ghost:hover {
		background: var(--brand-teal);
		color: #003050;
	}

	.process {
		background: #fff;
		color: #003050;
	}

	.process .eyebrow {
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: var(--brand-teal);
		margin-bottom: 12px;
	}

	.process h2 {
		font-size: clamp(24px, 3.2vw, 36px);
		font-weight: 800;
		color: #003050;
		max-width: 28ch;
		line-height: 1.2;
		margin-bottom: 12px;
	}

	.guide {
		font-size: 16px;
		font-weight: 600;
		color: #4a6070;
		margin-bottom: 28px;
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 28px;
	}

	.tabs button {
		appearance: none;
		border: 1px solid rgba(0, 48, 80, 0.18);
		background: #f3f7fa;
		color: #003050;
		font-size: 13px;
		font-weight: 700;
		padding: 12px 16px;
		border-radius: 999px;
		cursor: pointer;
		transition:
			background 0.2s var(--ease),
			color 0.2s var(--ease),
			border-color 0.2s var(--ease);
	}

	.tabs button.active,
	.tabs button:hover {
		background: #003050;
		border-color: #003050;
		color: #fff;
	}

	.step-panel {
		display: grid;
		grid-template-columns: 0.9fr 1.1fr;
		gap: 32px;
		align-items: center;
	}

	.step-text .step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--brand-teal);
		color: #003050;
		font-weight: 800;
		margin-bottom: 14px;
	}

	.step-text h3 {
		font-size: 26px;
		font-weight: 800;
		color: #003050;
		margin-bottom: 12px;
	}

	.step-text p {
		font-size: 16px;
		line-height: 1.55;
		color: #4a6070;
		margin-bottom: 24px;
		max-width: 42ch;
	}

	.step-visual {
		background: #eef5f8 url('/images/steps/bg-service.png') center / cover no-repeat;
		border-radius: 16px;
		padding: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.step-visual img {
		width: 100%;
		max-width: 640px;
		height: auto;
		display: block;
		border-radius: 8px;
		box-shadow: 0 16px 40px rgba(0, 48, 80, 0.18);
	}

	.testimonials {
		background: #00263d;
	}

	@media (max-width: 1000px) {
		.service-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.feature,
		.feature.reverse {
			grid-template-columns: 1fr;
		}

		.feature.reverse .feature-media,
		.feature.reverse .feature-copy {
			order: initial;
		}

		.step-panel {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 560px) {
		.service-row {
			grid-template-columns: 1fr;
		}
	}
</style>
