<script lang="ts">
	import type { PageData } from './$types';
	import { SOLICITUD_TIPO_LABELS, SOLICITUD_STATUS_LABELS } from '$lib/supabase/types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();

	function tipoLabel(t: string) {
		return SOLICITUD_TIPO_LABELS[t] || t;
	}
	function statusLabel(s: string) {
		return SOLICITUD_STATUS_LABELS[s as SolicitudStatus] || s;
	}
</script>

<header class="head">
	<h1>Hola{data.profile?.full_name ? `, ${data.profile.full_name.split(/\s+/)[0]}` : ''}</h1>
	<p class="sub">Resumen de tu actividad en Trámites DGT Online.</p>
</header>

{#if !data.emailConfirmed}
	<p class="warn">Tu email aún no está verificado. Revisa tu correo o ve a Mis datos.</p>
{/if}

<div class="cards">
	<a class="card" href="/cuenta/tramites?estado=en_curso">
		<span class="n">{data.counts.enCurso}</span>
		<span>En curso</span>
	</a>
	<a class="card" href="/cuenta/tramites?estado=realizados">
		<span class="n">{data.counts.realizados}</span>
		<span>Realizados</span>
	</a>
	<a class="card" href="/cuenta/vehiculos">
		<span class="n">{data.counts.vehiculos}</span>
		<span>Vehículos</span>
	</a>
	<a class="card" href="/cuenta/notificaciones">
		<span class="n">{data.counts.unread}</span>
		<span>Avisos sin leer</span>
	</a>
</div>

<section class="block">
	<div class="block-h">
		<h2>Últimos trámites</h2>
		<a href="/cuenta/tramites?estado=en_curso">Ver todos</a>
	</div>
	{#if data.recientes.length}
		<ul class="list">
			{#each data.recientes as s}
				<li>
					<a href={`/cuenta/tramites/${s.id}`}>
						<strong>{tipoLabel(s.tipo)}</strong>
						<span>{statusLabel(String(s.status))}</span>
						<small>{new Date(s.created_at).toLocaleString('es-ES')}</small>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Aún no tienes trámites. <a href="/transferencia-vehiculos">Empieza uno</a>.</p>
	{/if}
</section>

<section class="block">
	<div class="block-h">
		<h2>Notificaciones</h2>
		<a href="/cuenta/notificaciones">Ver todas</a>
	</div>
	{#if data.notificaciones.length}
		<ul class="list">
			{#each data.notificaciones as n}
				<li class:unread={!n.read_at}>
					{#if n.link}
						<a href={n.link}>
							<strong>{n.titulo}</strong>
							<small>{new Date(n.created_at).toLocaleString('es-ES')}</small>
						</a>
					{:else}
						<div>
							<strong>{n.titulo}</strong>
							<small>{new Date(n.created_at).toLocaleString('es-ES')}</small>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Sin notificaciones.</p>
	{/if}
</section>

<style>
	.head {
		margin-bottom: 24px;
	}
	h1 {
		margin: 0 0 6px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
	}
	.warn {
		background: #fff4e5;
		color: #7a4b00;
		padding: 10px 12px;
		border-radius: 8px;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
		margin-bottom: 28px;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px;
		text-decoration: none;
		color: inherit;
		display: grid;
		gap: 4px;
	}
	.card .n {
		font-size: 1.6rem;
		font-weight: 800;
		color: #003050;
	}
	.block {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px 18px;
		margin-bottom: 16px;
	}
	.block-h {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	.block-h h2 {
		margin: 0;
		font-size: 1rem;
		color: #003050;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.list li {
		border-top: 1px solid #e8eef3;
	}
	.list a,
	.list div {
		display: grid;
		gap: 2px;
		padding: 10px 0;
		text-decoration: none;
		color: inherit;
	}
	.list.unread,
	.list li.unread {
		font-weight: 600;
	}
	.empty {
		color: #5a6b7d;
		margin: 0;
	}
	small {
		color: #5a6b7d;
	}
</style>
