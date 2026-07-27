<script lang="ts">
	import DocumentScanGuide from '$lib/components/tramite/DocumentScanGuide.svelte';
	import DocumentDropzone from '$lib/components/tramite/DocumentDropzone.svelte';
	import type { DocGroup } from '$lib/tramite/documentos';

	let {
		groups,
		files,
		errors = {},
		onfile
	}: {
		groups: DocGroup[];
		files: Record<string, File | null>;
		errors?: Record<string, string | null>;
		onfile: (id: string, file: File | null) => void;
	} = $props();
</script>

<div class="docs-step">
	<DocumentScanGuide />
	{#each groups as group}
		<section class="group">
			<h2>{group.title}</h2>
			<div class="grid">
				{#each group.slots as slot}
					<DocumentDropzone
						label={slot.label}
						hint={slot.hint ?? null}
						file={files[slot.id] ?? null}
						error={errors[slot.id] ?? null}
						onchange={(f) => onfile(slot.id, f)}
					/>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.docs-step {
		margin-top: 8px;
	}
	.group {
		margin-bottom: 22px;
	}
	.group h2 {
		margin: 0 0 12px;
		font-size: 16px;
		font-weight: 800;
		color: var(--brand-navy, #003050);
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}
	@media (max-width: 720px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
