<script lang="ts">
	let {
		title,
		description,
		steps,
		tramitarPath,
		calcPath = null
	}: {
		title: string;
		description: string;
		steps: string[];
		tramitarPath: string;
		calcPath?: string | null;
	} = $props();
</script>

<section class="hero">
	<div class="wrap">
		<h1>{title}</h1>
		<p class="sub">{description}</p>
		<div class="cta">
			<a class="btn big" href={tramitarPath}>Solicitar ahora</a>
			{#if calcPath}<a class="btn big ghost-on-dark" href={calcPath}>Calcular precio</a>{/if}
		</div>
	</div>
</section>

<section class="section">
	<div class="wrap">
		<h2>¿Cómo funciona?</h2>
		<ol class="steps">
			{#each steps as step, i}
				<li class="card"><span class="n">{i + 1}</span><span>{step}</span></li>
			{/each}
		</ol>
	</div>
</section>

<style>
	.hero {
		background: linear-gradient(135deg, var(--bg-navy), var(--bg-light));
		padding: 56px 0;
		color: #fff;
	}
	h1 {
		font-size: clamp(28px, 4vw, 40px);
		font-weight: 800;
		letter-spacing: -0.03em;
		color: #fff;
	}
	.sub {
		font-size: 18px;
		color: var(--text2-on-dark);
		margin-top: 14px;
		max-width: 60ch;
		line-height: 1.55;
	}
	.cta {
		display: flex;
		gap: 12px;
		margin-top: 28px;
		flex-wrap: wrap;
	}
	h2 {
		font-size: 28px;
		font-weight: 800;
		margin-bottom: 28px;
		color: var(--ink-on-dark);
	}
	.steps {
		list-style: none;
		display: grid;
		gap: 16px;
		max-width: 640px;
	}
	.steps li {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 18px 20px;
		font-size: 15px;
		color: var(--ink);
	}
	.n {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--brand-teal);
		color: #fff;
		font-weight: 800;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
</style>
