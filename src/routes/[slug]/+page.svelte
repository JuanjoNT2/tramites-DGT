<script lang="ts">
	import { services } from '$lib/data/services';

	let { data } = $props();
	const post = $derived(data.post);
	const related = $derived(data.related);
</script>

<svelte:head>
	<title>{post.title} | Trámites DGT Online</title>
	{#if post.description}
		<meta name="description" content={post.description} />
	{/if}
	<link rel="canonical" href="https://tramitesdgtonline.com/{post.slug}/" />
	<meta property="og:title" content="{post.title} | Trámites DGT Online" />
	{#if post.description}
		<meta property="og:description" content={post.description} />
	{/if}
	{#if post.image}
		<meta property="og:image" content={post.image} />
	{/if}
</svelte:head>

<article class="section article">
	<div class="wrap article-wrap">
		<a class="back" href="/noticias">← volver a noticias</a>

		{#if post.image}
			<figure class="hero-img">
				<img src={post.image} alt="" loading="eager" />
			</figure>
		{/if}

		<header class="head">
			<h1>{post.title}</h1>
			{#if post.date}
				<time datetime={post.datetime || undefined}>{post.date}</time>
			{/if}
		</header>

		<div class="content">
			{#each post.blocks as block, i (i)}
				{#if block.type === 'h2'}
					<h2>{block.text}</h2>
				{:else if block.type === 'h3'}
					<h3>{block.text}</h3>
				{:else}
					<p>{block.text}</p>
				{/if}
			{/each}
		</div>
	</div>
</article>

<section class="section tramites">
	<div class="wrap">
		<p class="eyebrow">trámites</p>
		<h2 class="sec-title">Conoce nuestros trámites</h2>
		<div class="svc-grid">
			{#each services as s (s.id)}
				<article class="svc">
					<h3>{s.title}</h3>
					<p>{s.description}</p>
					<a class="btn" href={s.tramitarPath}>Solicitar</a>
				</article>
			{/each}
		</div>
	</div>
</section>

{#if related.length}
	<section class="section related">
		<div class="wrap">
			<h2 class="sec-title">Noticias relacionadas</h2>
			<div class="rel-grid">
				{#each related as r (r.slug)}
					<article class="rel-card">
						<a class="thumb-link" href="/{r.slug}" tabindex="-1" aria-hidden="true">
							{#if r.image}
								<img src={r.image} alt="" loading="lazy" />
							{/if}
						</a>
						<div class="rel-body">
							<h3><a href="/{r.slug}">{r.title}</a></h3>
							{#if r.excerpt}
								<p>{r.excerpt}</p>
							{/if}
							{#if r.date}
								<time datetime={r.datetime || undefined}>{r.date}</time>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>
{/if}

<style>
	.article {
		padding: 40px 0 56px;
		background: var(--bg-deep);
	}

	.article-wrap {
		max-width: 760px;
	}

	.back {
		display: inline-block;
		font-size: 14px;
		font-weight: 600;
		color: var(--primary);
		margin-bottom: 24px;
	}

	.back:hover {
		color: #fff;
	}

	.hero-img {
		margin: 0 0 28px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		aspect-ratio: 16 / 9;
		background: #0a4060;
	}

	.hero-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.head {
		margin-bottom: 28px;
	}

	h1 {
		font-size: clamp(28px, 4vw, 40px);
		font-weight: 800;
		line-height: 1.2;
		color: #fff;
		margin-bottom: 12px;
	}

	.head time {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.65);
	}

	.content h2 {
		font-size: 22px;
		font-weight: 700;
		color: #fff;
		margin: 32px 0 14px;
		line-height: 1.3;
	}

	.content h3 {
		font-size: 18px;
		font-weight: 700;
		color: #fff;
		margin: 24px 0 12px;
	}

	.content p {
		font-size: 16px;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.88);
		margin-bottom: 16px;
	}

	.tramites {
		background: #00263d;
		padding: 56px 0;
	}

	.eyebrow {
		text-align: center;
		font-size: 13px;
		font-weight: 600;
		color: var(--primary);
		text-transform: lowercase;
		margin-bottom: 8px;
	}

	.sec-title {
		text-align: center;
		font-size: 28px;
		font-weight: 800;
		color: #fff;
		margin-bottom: 32px;
	}

	.svc-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.svc {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(0, 198, 209, 0.25);
		border-radius: var(--radius);
		padding: 22px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.svc h3 {
		font-size: 16px;
		font-weight: 700;
		color: #fff;
	}

	.svc p {
		font-size: 14px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.75);
		flex: 1;
	}

	.svc .btn {
		align-self: flex-start;
		margin-top: 8px;
	}

	.related {
		padding: 56px 0 72px;
		background: var(--bg-deep);
	}

	.rel-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}

	.rel-card {
		background: #fff;
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.thumb-link {
		display: block;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: #d9e3ea;
	}

	.thumb-link img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.rel-body {
		padding: 18px 20px 22px;
	}

	.rel-body h3 {
		font-size: 16px;
		font-weight: 700;
		color: var(--ink);
		margin-bottom: 8px;
		line-height: 1.35;
	}

	.rel-body p {
		font-size: 14px;
		color: var(--text2);
		line-height: 1.5;
		margin-bottom: 10px;
	}

	.rel-body time {
		font-size: 13px;
		color: var(--text3);
	}

	@media (max-width: 900px) {
		.svc-grid,
		.rel-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
