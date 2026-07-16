<script lang="ts">
	import { onMount } from 'svelte';

	type Testimonial = {
		name: string;
		text: string;
	};

	let {
		items
	}: {
		items: Testimonial[];
	} = $props();

	let index = $state(0);
	let paused = $state(false);

	const total = $derived(items.length);

	function go(next: number) {
		if (total === 0) return;
		index = ((next % total) + total) % total;
	}

	function prev() {
		go(index - 1);
	}

	function next() {
		go(index + 1);
	}

	onMount(() => {
		const id = setInterval(() => {
			if (!paused) go(index + 1);
		}, 5000);
		return () => clearInterval(id);
	});
</script>

<div
	class="carousel"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	onfocusin={() => (paused = true)}
	onfocusout={() => (paused = false)}
>
	<button type="button" class="nav prev" aria-label="Opinión anterior" onclick={prev}>‹</button>

	<div class="viewport" aria-live="polite">
		<div class="track" style="transform: translateX(-{index * 100}%)">
			{#each items as t, i (t.name + i)}
				<article class="slide" aria-hidden={i !== index}>
					<blockquote class="card">
						<div class="stars" aria-label="5 de 5 estrellas">
							{#each [1, 2, 3, 4, 5] as star (star)}
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path
										d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
									/>
								</svg>
							{/each}
						</div>
						<p>"{t.text}"</p>
						<footer>
							<span class="avatar" aria-hidden="true">{t.name.charAt(0)}</span>
							<div>
								<strong>{t.name}</strong>
								<small>Reseña de Google</small>
							</div>
						</footer>
					</blockquote>
				</article>
			{/each}
		</div>
	</div>

	<button type="button" class="nav next" aria-label="Opinión siguiente" onclick={next}>›</button>

	<div class="dots" role="tablist" aria-label="Seleccionar opinión">
		{#each items as _, i}
			<button
				type="button"
				role="tab"
				class:active={i === index}
				aria-selected={i === index}
				aria-label="Opinión {i + 1}"
				onclick={() => go(i)}
			></button>
		{/each}
	</div>
</div>

<style>
	.carousel {
		position: relative;
		max-width: 820px;
		margin: 0 auto;
		padding: 0 48px;
	}

	.viewport {
		overflow: hidden;
	}

	.track {
		display: flex;
		transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.slide {
		flex: 0 0 100%;
		padding: 4px 8px 12px;
		box-sizing: border-box;
	}

	.card {
		margin: 0;
		background: #ffffff;
		border-radius: 14px;
		padding: 28px 28px 24px;
		box-shadow: 0 12px 36px rgba(0, 24, 40, 0.18);
		border: 1px solid rgba(0, 48, 80, 0.06);
		min-height: 220px;
		display: flex;
		flex-direction: column;
	}

	.stars {
		display: flex;
		gap: 3px;
		margin-bottom: 14px;
	}

	.stars svg {
		width: 20px;
		height: 20px;
		fill: #fbbc04;
	}

	.card p {
		margin: 0;
		font-size: 16px;
		line-height: 1.6;
		color: #003050;
		flex: 1;
	}

	.card footer {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid rgba(0, 48, 80, 0.08);
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #e8f3f7;
		color: #003050;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 15px;
		flex-shrink: 0;
	}

	.card footer strong {
		display: block;
		font-size: 15px;
		font-weight: 800;
		color: #003050;
		line-height: 1.2;
	}

	.card footer small {
		display: block;
		margin-top: 2px;
		font-size: 12px;
		font-weight: 600;
		color: #5a6b7d;
	}

	.nav {
		position: absolute;
		top: 42%;
		transform: translateY(-50%);
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		font-size: 28px;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		transition: background 0.2s ease;
	}

	.nav:hover {
		background: var(--brand-teal);
		border-color: var(--brand-teal);
		color: #003050;
	}

	.nav.prev {
		left: 0;
	}

	.nav.next {
		right: 0;
	}

	.dots {
		display: flex;
		justify-content: center;
		gap: 8px;
		margin-top: 18px;
	}

	.dots button {
		width: 9px;
		height: 9px;
		padding: 0;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.35);
		cursor: pointer;
	}

	.dots button.active {
		background: var(--brand-teal);
		width: 22px;
		border-radius: 999px;
	}

	@media (max-width: 640px) {
		.carousel {
			padding: 0 36px;
		}

		.card {
			padding: 22px 20px 20px;
			min-height: 240px;
		}

		.card p {
			font-size: 15px;
		}
	}
</style>
