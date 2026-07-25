<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SeoHead
	title="Pago no completado"
	description="El pago no se ha completado. Puedes reintentarlo."
	path="/pago/ko"
	robots="noindex,nofollow"
/>

<section class="section">
	<div class="wrap card pad">
		<div class="ko">!</div>
		<h1>Pago no completado</h1>
		<p>
			La operación se canceló o el banco no la autorizó. Tu solicitud sigue registrada como pendiente
			de pago.
		</p>
		{#if data.solicitudId}
			<p class="ref">Referencia: <strong>{data.solicitudId}</strong></p>
		{/if}
		<div class="actions">
			{#if data.pagoUrl}
				<a class="btn" href={data.pagoUrl}>Reintentar pago</a>
			{/if}
			{#if data.solicitudId}
				<a class="btn secondary" href="/cuenta/tramites/{data.solicitudId}">Ver mi trámite</a>
			{/if}
			<a class="btn ghost" href={data.retryTramite}>Empezar de nuevo el trámite</a>
			<a class="btn ghost" href="/">Volver al inicio</a>
		</div>
	</div>
</section>

<style>
	.pad {
		max-width: 520px;
		margin: 40px auto;
		padding: 40px 28px;
		text-align: center;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 14px;
	}
	.ko {
		width: 56px;
		height: 56px;
		margin: 0 auto 16px;
		border-radius: 50%;
		background: #fef3f2;
		color: #b42318;
		display: grid;
		place-items: center;
		font-size: 24px;
		font-weight: 800;
	}
	h1 {
		font-size: 26px;
		font-weight: 800;
		margin-bottom: 10px;
		color: #003050;
	}
	p {
		color: var(--text2, #5a6b7d);
		line-height: 1.5;
		margin-bottom: 12px;
	}
	.ref {
		font-size: 14px;
		word-break: break-all;
	}
	.actions {
		display: grid;
		gap: 10px;
		margin-top: 18px;
	}
	.btn {
		display: inline-flex;
		justify-content: center;
		padding: 12px 16px;
		border-radius: 10px;
		font-weight: 800;
		text-decoration: none;
		background: #00c6d1;
		color: #003050;
	}
	.btn.secondary {
		background: #003050;
		color: #fff;
	}
	.btn.ghost {
		background: transparent;
		border: 1px solid #c5d0da;
		color: #003050;
	}
</style>
