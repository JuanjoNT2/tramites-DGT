<script lang="ts">
	import { DOC_ACCEPT, MAX_DOC_BYTES } from '$lib/tramite/documentos';

	let {
		label,
		hint = null,
		file = null,
		error = null,
		onchange
	}: {
		label: string;
		hint?: string | null;
		file?: File | null;
		error?: string | null;
		onchange: (file: File | null) => void;
	} = $props();

	let fileInput: HTMLInputElement | undefined = $state();
	let cameraInput: HTMLInputElement | undefined = $state();
	let dragging = $state(false);
	let localError = $state<string | null>(null);
	let previewUrl = $state<string | null>(null);

	$effect(() => {
		const f = file;
		let url: string | null = null;
		if (f && f.type.startsWith('image/')) {
			url = URL.createObjectURL(f);
			previewUrl = url;
		} else {
			previewUrl = null;
		}
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	});

	const displayError = $derived(error || localError);

	function acceptFile(f: File | null | undefined) {
		localError = null;
		if (!f) {
			onchange(null);
			return;
		}
		if (f.size > MAX_DOC_BYTES) {
			localError = 'El archivo supera 10 MB.';
			return;
		}
		const okType =
			f.type.startsWith('image/') ||
			f.type === 'application/pdf' ||
			/\.pdf$/i.test(f.name);
		if (!okType) {
			localError = 'Solo imágenes o PDF.';
			return;
		}
		onchange(f);
	}

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		acceptFile(input.files?.[0]);
		input.value = '';
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		acceptFile(e.dataTransfer?.files?.[0]);
	}
</script>

<div class="card" class:has-error={!!displayError}>
	<div class="head">
		<h3>{label}</h3>
		{#if hint}
			<span class="info" title={hint} aria-label={hint}>i</span>
		{/if}
	</div>

	{#if file}
		<div class="preview">
			{#if previewUrl}
				<img src={previewUrl} alt="Vista previa de {label}" />
			{:else}
				<p class="fname">{file.name}</p>
			{/if}
			<div class="preview-actions">
				<button type="button" class="btn-sm" onclick={() => cameraInput?.click()}>Repetir foto</button>
				<button type="button" class="btn-sm ghost" onclick={() => fileInput?.click()}>Otro archivo</button>
				<button type="button" class="btn-sm danger" onclick={() => acceptFile(null)}>Quitar</button>
			</div>
		</div>
	{:else}
		<div
			class="drop"
			class:dragging
			role="button"
			tabindex="0"
			onclick={() => fileInput?.click()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					fileInput?.click();
				}
			}}
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={() => (dragging = false)}
			ondrop={onDrop}
		>
			<svg class="cloud" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
				<path
					d="M14 34h22a8 8 0 0 0 0-16 10 10 0 0 0-19.2-3A7 7 0 0 0 14 34z"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				/>
				<path d="M24 30V18M24 18l-5 5M24 18l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			<p>Haga click o arrastre archivo aquí.</p>
		</div>

		<div class="actions">
			<button type="button" class="cam" onclick={() => cameraInput?.click()} aria-label="Hacer foto">
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					<path
						fill="currentColor"
						d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm8-5.7h-1.7l-1.2-2H6.9l-1.2 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm0 10H4v-8h3.1l1.2-2h7.4l1.2 2H20v8z"
					/>
				</svg>
			</button>
			<button type="button" class="linkish" onclick={() => fileInput?.click()}>Elegir archivo</button>
			<button type="button" class="linkish primary-touch" onclick={() => cameraInput?.click()}
				>Hacer foto</button
			>
		</div>
	{/if}

	{#if displayError}
		<p class="err" role="alert">{displayError}</p>
	{/if}

	<input
		bind:this={fileInput}
		type="file"
		accept={DOC_ACCEPT}
		class="sr"
		onchange={onFileChange}
	/>
	<input
		bind:this={cameraInput}
		type="file"
		accept="image/*"
		capture="environment"
		class="sr"
		onchange={onFileChange}
	/>
</div>

<style>
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 14px;
	}
	.card.has-error {
		border-color: var(--error);
	}
	.head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;
	}
	h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		color: var(--ink, #1a2b3c);
		line-height: 1.3;
	}
	.info {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1.5px solid #8896a6;
		color: #8896a6;
		font-size: 11px;
		font-weight: 800;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		cursor: help;
	}
	.drop {
		display: grid;
		place-items: center;
		gap: 8px;
		min-height: 120px;
		padding: 16px;
		border: 2px dashed #c5d0da;
		border-radius: 10px;
		background: #f7f9fb;
		color: #5a6b7d;
		cursor: pointer;
		text-align: center;
	}
	.drop.dragging {
		border-color: var(--brand-teal);
		background: var(--primary-dim);
	}
	.drop p {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
	}
	.cloud {
		color: #8896a6;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin-top: 12px;
	}
	.cam {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: none;
		background: var(--brand-teal);
		color: var(--brand-navy);
		display: grid;
		place-items: center;
		cursor: pointer;
	}
	.linkish {
		border: none;
		background: transparent;
		color: var(--brand-navy);
		font: inherit;
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
		text-decoration: underline;
	}
	.primary-touch {
		display: none;
	}
	.preview img {
		width: 100%;
		max-height: 160px;
		object-fit: contain;
		border-radius: 8px;
		background: #f0f4f8;
	}
	.fname {
		font-size: 13px;
		word-break: break-all;
		color: var(--text2);
	}
	.preview-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 10px;
	}
	.btn-sm {
		border: none;
		border-radius: 8px;
		padding: 8px 10px;
		font: inherit;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		background: var(--brand-teal);
		color: var(--brand-navy);
	}
	.btn-sm.ghost {
		background: #e8eef3;
		color: var(--brand-navy);
	}
	.btn-sm.danger {
		background: #fde8e8;
		color: #9b1c1c;
	}
	.err {
		margin: 8px 0 0;
		color: var(--error);
		font-size: 13px;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}
	@media (max-width: 720px), (pointer: coarse) {
		.primary-touch {
			display: inline;
			text-decoration: none;
			background: var(--brand-navy);
			color: #fff;
			padding: 10px 14px;
			border-radius: 8px;
		}
		.cam {
			width: 56px;
			height: 56px;
		}
	}
</style>
