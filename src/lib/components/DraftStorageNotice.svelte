<script lang="ts">
	import PrivacyPolicyModal from '$lib/components/legal/PrivacyPolicyModal.svelte';

	let {
		open = false,
		onconfirm
	}: {
		open?: boolean;
		onconfirm: () => void;
	} = $props();

	let privacyOpen = $state(false);

	function openPrivacy(e: MouseEvent) {
		e.preventDefault();
		privacyOpen = true;
	}
</script>

{#if open}
	<div class="overlay" role="presentation">
		<div
			class="modal"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="draft-notice-title"
			aria-describedby="draft-notice-desc"
		>
			<h2 id="draft-notice-title">Guardamos un borrador de tu trámite</h2>
			<p id="draft-notice-desc">
				A partir de ahora almacenamos en este dispositivo los datos que vayas introduciendo
				(matrícula, contacto, trámite y fotos/documentos adjuntos) para que no los pierdas si cierras
				la página o vuelves más tarde.
			</p>
			<p class="legal">
				El borrador se guarda de forma local en tu navegador (los documentos en un almacén del propio
				dispositivo). Cuando completes el trámite, los datos se envían a nuestros sistemas para
				gestionar la solicitud. Más información en la
				<a href="/politica-de-privacidad" onclick={openPrivacy}>política de privacidad</a>.
			</p>
			<button type="button" class="ok" onclick={onconfirm}>Entendido</button>
		</div>
	</div>
{/if}

<PrivacyPolicyModal open={privacyOpen} onclose={() => (privacyOpen = false)} />

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 300;
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
		margin: 0 0 12px;
		font-size: 0.95rem;
		line-height: 1.5;
		color: #1a2b3c;
	}
	.legal {
		font-size: 0.82rem;
		color: #5a6b7d;
		margin-bottom: 18px;
	}
	.legal a {
		color: #003050;
		font-weight: 700;
	}
	.ok {
		width: 100%;
		padding: 12px 16px;
		border: none;
		border-radius: 10px;
		background: #00c6d1;
		color: #003050;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}
	.ok:hover {
		filter: brightness(1.05);
	}
</style>
