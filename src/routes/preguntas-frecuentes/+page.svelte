<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { allFaqsFlat, faqSections } from '$lib/data/faqs';
	import { faqPageJsonLd, getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/preguntas-frecuentes')!;
	const faqsForLd = allFaqsFlat();
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	jsonLd={faqPageJsonLd(faqsForLd)}
/>

<section class="section">
	<div class="wrap">
		<h1>Preguntas frecuentes</h1>
		<p class="lead">
			Respuestas sobre transferencia, informes, VMP, reservas de dominio y el resto de trámites que
			puedes hacer online con nosotros.
		</p>

		<div class="sections">
			{#each faqSections as section (section.id)}
				<section class="group" aria-labelledby="faq-{section.id}">
					<h2 id="faq-{section.id}">{section.title}</h2>
					<div class="faqs">
						{#each section.items as f (f.q)}
							<details class="card item">
								<summary>
									<span class="q">{f.q}</span>
									<span class="chev" aria-hidden="true"></span>
								</summary>
								<p>{f.a}</p>
							</details>
						{/each}
					</div>
				</section>
			{/each}
		</div>

		<p class="more">
			¿No encuentras tu duda?
			<a href="/contacto">Contacta con nosotros</a>
			o inicia el trámite desde el menú <strong>Trámites</strong>.
		</p>
	</div>
</section>

<style>
	h1 {
		font-size: clamp(1.75rem, 3vw, 2rem);
		font-weight: 800;
		margin: 0 0 10px;
		color: var(--ink, #003050);
	}

	.lead {
		margin: 0 0 28px;
		max-width: 58ch;
		color: var(--text2, #5a6b7d);
		line-height: 1.5;
		font-size: 1.05rem;
	}

	.sections {
		display: grid;
		gap: 36px;
		max-width: 760px;
	}

	.group h2 {
		margin: 0 0 12px;
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--ink, #003050);
		letter-spacing: -0.02em;
	}

	.faqs {
		display: grid;
		gap: 10px;
	}

	.item {
		padding: 0;
		overflow: hidden;
		background: #fff;
		border: 1px solid rgba(0, 48, 80, 0.12);
		border-radius: var(--radius, 10px);
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 16px 18px;
		font-weight: 700;
		cursor: pointer;
		list-style: none;
		color: var(--ink, #003050);
		line-height: 1.35;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	.q {
		flex: 1;
		min-width: 0;
	}

	.chev {
		flex-shrink: 0;
		width: 10px;
		height: 10px;
		border-right: 2px solid var(--brand-teal, #00c6d1);
		border-bottom: 2px solid var(--brand-teal, #00c6d1);
		transform: rotate(45deg);
		transition: transform 0.2s ease;
		margin-top: -4px;
	}

	details[open] .chev {
		transform: rotate(225deg);
		margin-top: 4px;
	}

	summary:hover {
		background: rgba(0, 198, 209, 0.06);
	}

	p {
		margin: 0;
		padding: 0 18px 18px;
		color: var(--text2, #5a6b7d);
		line-height: 1.55;
		font-size: 15px;
	}

	.more {
		margin: 40px 0 0;
		max-width: 760px;
		font-size: 0.95rem;
		color: var(--text2, #5a6b7d);
		line-height: 1.5;
	}

	.more a {
		font-weight: 700;
		color: var(--primary-dark, #003050);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
