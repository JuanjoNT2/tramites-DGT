<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let items = $state(data.items);

	$effect(() => {
		items = data.items;
	});

	async function markAll() {
		await fetch('/api/cuenta/notificaciones', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ all: true })
		});
		items = items.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }));
	}

	async function markOne(id: string) {
		await fetch('/api/cuenta/notificaciones', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		});
		items = items.map((n) =>
			n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n
		);
	}
</script>

<header class="head">
	<div>
		<h1>Notificaciones</h1>
		<p class="sub">Avisos sobre el estado de tus trámites.</p>
	</div>
	<button type="button" class="btn" onclick={markAll}>Marcar todas como leídas</button>
</header>

<ul class="list">
	{#each items as n}
		<li class:unread={!n.read_at}>
			{#if n.link}
				<a href={n.link} onclick={() => markOne(n.id)}>
					<strong>{n.titulo}</strong>
					{#if n.cuerpo}<p>{n.cuerpo}</p>{/if}
					<small>{new Date(n.created_at).toLocaleString('es-ES')}</small>
				</a>
			{:else}
				<button type="button" class="plain" onclick={() => markOne(n.id)}>
					<strong>{n.titulo}</strong>
					{#if n.cuerpo}<p>{n.cuerpo}</p>{/if}
					<small>{new Date(n.created_at).toLocaleString('es-ES')}</small>
				</button>
			{/if}
		</li>
	{:else}
		<li class="empty">No hay notificaciones.</li>
	{/each}
</ul>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}
	h1 {
		margin: 0 0 6px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
	}
	.btn {
		padding: 8px 12px;
		background: #fff;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font-weight: 700;
		cursor: pointer;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
	}
	.list li {
		border-bottom: 1px solid #e8eef3;
	}
	.list a,
	.plain {
		display: block;
		width: 100%;
		text-align: left;
		padding: 14px 16px;
		text-decoration: none;
		color: inherit;
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
	}
	.unread {
		background: #f0fbfd;
	}
	.list p {
		margin: 4px 0;
		color: #5a6b7d;
	}
	small {
		color: #5a6b7d;
	}
	.empty {
		padding: 16px;
		color: #5a6b7d;
	}
</style>
