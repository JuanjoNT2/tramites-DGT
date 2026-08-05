<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>{data.title} | Trámites DGT Online</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="section">
	<div class="wrap card pad">
		<h1>{data.title}</h1>
		<p class="lead">{data.lead}</p>

		{#if form?.error}
			<p class="err" role="alert">{form.error}</p>
		{/if}

		<form method="POST" class="form">
			<input type="hidden" name="token_hash" value={data.token_hash} />
			<input type="hidden" name="code" value={data.code} />
			<input type="hidden" name="type" value={data.type} />
			<input type="hidden" name="next" value={data.next} />
			<button type="submit" class="btn">Continuar</button>
		</form>

		<p class="hint">
			Si no has solicitado este enlace, cierra esta página.
			<a href="/login">Volver al login</a>
		</p>
	</div>
</section>

<style>
	.pad {
		max-width: 440px;
		margin: 48px auto;
		padding: 28px 24px;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 14px;
	}
	h1 {
		margin: 0 0 8px;
		color: #003050;
		font-size: 1.4rem;
	}
	.lead {
		margin: 0 0 20px;
		color: #5a6b7d;
		line-height: 1.45;
		font-size: 0.95rem;
	}
	.form {
		margin: 0;
	}
	.btn {
		padding: 12px 18px;
		background: #00c6d1;
		color: #003050;
		font-weight: 800;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
		font-size: 1rem;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
	}
	.hint {
		margin-top: 18px;
		font-size: 0.85rem;
		color: #5a6b7d;
	}
	.hint a {
		color: #003050;
		font-weight: 700;
	}
</style>
