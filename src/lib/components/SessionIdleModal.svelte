<script lang="ts">
	import { WARN_COUNTDOWN_MS } from '$lib/auth/idle-timeout';

	let {
		open = false,
		onkeep,
		onlogout
	}: {
		open?: boolean;
		onkeep: () => void;
		onlogout: () => void;
	} = $props();

	let secondsLeft = $state(Math.ceil(WARN_COUNTDOWN_MS / 1000));

	$effect(() => {
		if (!open) {
			secondsLeft = Math.ceil(WARN_COUNTDOWN_MS / 1000);
			return;
		}
		secondsLeft = Math.ceil(WARN_COUNTDOWN_MS / 1000);
		const id = setInterval(() => {
			secondsLeft = Math.max(0, secondsLeft - 1);
		}, 1000);
		return () => clearInterval(id);
	});
</script>

{#if open}
	<div class="overlay" role="presentation">
		<div
			class="modal"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="idle-title"
			aria-describedby="idle-desc"
		>
			<h2 id="idle-title">Tu sesión va a caducar</h2>
			<p id="idle-desc">
				Llevas un rato sin actividad. ¿Quieres mantener la sesión abierta o cerrarla?
				{#if secondsLeft > 0}
					Si no eliges nada, se cerrará en <strong>{secondsLeft} s</strong>.
				{/if}
			</p>
			<div class="actions">
				<button type="button" class="ok" onclick={onkeep}>Mantener sesión</button>
				<button type="button" class="ghost" onclick={onlogout}>Cerrar sesión</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 400;
		background: rgba(0, 24, 40, 0.55);
		display: grid;
		place-items: center;
		padding: 20px;
	}
	.modal {
		width: min(440px, 100%);
		background: #fff;
		border-radius: 14px;
		padding: 24px 22px 20px;
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
		border: 1px solid #d8e0e8;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1.2rem;
		color: #003050;
		line-height: 1.3;
	}
	p {
		margin: 0 0 18px;
		font-size: 0.95rem;
		line-height: 1.5;
		color: #1a2b3c;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.ok,
	.ghost {
		width: 100%;
		padding: 12px 16px;
		border-radius: 10px;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}
	.ok {
		border: none;
		background: #00c6d1;
		color: #003050;
	}
	.ok:hover {
		filter: brightness(1.05);
	}
	.ghost {
		border: 1px solid #c5d0da;
		background: #fff;
		color: #003050;
	}
	.ghost:hover {
		background: #f4f7fa;
	}
</style>
