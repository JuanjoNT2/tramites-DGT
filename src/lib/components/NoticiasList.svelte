<script lang="ts">
	import type { Post } from '$lib/data/posts';

	let {
		items,
		page,
		totalPages
	}: {
		items: Post[];
		page: number;
		totalPages: number;
	} = $props();

	function pageHref(n: number) {
		return n <= 1 ? '/noticias' : `/noticias/page/${n}`;
	}
</script>

<section class="section noticias">
	<div class="wrap">
		<header class="head">
			<h1>Mantente informado</h1>
			<p class="eyebrow">noticias</p>
		</header>

		<div class="grid">
			{#each items as post (post.slug)}
				<article class="card">
					<a class="thumb-link" href="/{post.slug}" tabindex="-1" aria-hidden="true">
						{#if post.image}
							<img class="thumb" src={post.image} alt="" loading="lazy" />
						{:else}
							<div class="thumb placeholder"></div>
						{/if}
					</a>
					<div class="body">
						<h2 class="title">
							<a href="/{post.slug}">{post.title}</a>
						</h2>
						{#if post.excerpt}
							<p class="excerpt">{post.excerpt}</p>
						{/if}
						{#if post.date}
							<time datetime={post.datetime || undefined}>{post.date}</time>
						{/if}
					</div>
				</article>
			{/each}
		</div>

		{#if totalPages > 1}
			<nav class="pager" aria-label="Paginación de noticias">
				{#if page > 1}
					<a class="btn ghost" href={pageHref(page - 1)}>Anterior</a>
				{/if}
				<span class="pages">Página {page} de {totalPages}</span>
				{#if page < totalPages}
					<a class="btn" href={pageHref(page + 1)}>Siguiente</a>
				{/if}
			</nav>
		{/if}
	</div>
</section>

<style>
	.noticias {
		background: var(--bg-deep);
		padding: 48px 0 72px;
	}

	.head {
		text-align: center;
		margin-bottom: 40px;
	}

	h1 {
		font-size: clamp(28px, 4vw, 40px);
		font-weight: 800;
		color: #fff;
		margin-bottom: 8px;
	}

	.eyebrow {
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: lowercase;
		color: var(--primary);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.card {
		background: #fff;
		border-radius: var(--radius-lg);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 100%;
		box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
	}

	.thumb-link {
		display: block;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: #d9e3ea;
	}

	.thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumb.placeholder {
		width: 100%;
		height: 100%;
		background: #0a4060;
	}

	.body {
		padding: 20px 22px 24px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
	}

	.title {
		font-size: 17px;
		font-weight: 700;
		line-height: 1.35;
		color: var(--ink);
	}

	.title a:hover {
		color: var(--primary-dark);
	}

	.excerpt {
		font-size: 14px;
		line-height: 1.55;
		color: var(--text2);
		flex: 1;
	}

	time {
		font-size: 13px;
		color: var(--text3);
		margin-top: 4px;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		margin-top: 40px;
	}

	.pages {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.8);
	}

	@media (max-width: 960px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
