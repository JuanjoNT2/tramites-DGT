<script lang="ts">
</script>

<div class="guide" role="region" aria-label="Instrucciones para escanear documentos">
	<div class="ok">
		<div class="ok-frame" aria-hidden="true">
			<svg viewBox="0 0 120 80" width="120" height="80" fill="none">
				<rect x="28" y="18" width="64" height="44" rx="4" stroke="currentColor" stroke-width="2" />
				<circle cx="48" cy="36" r="8" stroke="currentColor" stroke-width="2" />
				<path d="M36 54h48M70 30h14v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<path d="M18 14h12M18 14v12M102 14H90M102 14v12M18 66h12M18 66V54M102 66H90M102 66V54" stroke="var(--brand-teal)" stroke-width="3" stroke-linecap="round" />
			</svg>
		</div>
		<p>Fondo blanco, con margen y desde arriba</p>
	</div>
	<ul class="bads">
		{#each [
			{ id: 'doblar', label: 'No doblar' },
			{ id: 'dedos', label: 'No dedos' },
			{ id: 'flash', label: 'No flash' },
			{ id: 'sombras', label: 'No sombras' },
			{ id: 'cortar', label: 'No cortar' },
			{ id: 'desenfocar', label: 'No desenfocar' }
		] as item}
			<li>
				<span class="icon" aria-hidden="true">
					<svg viewBox="0 0 48 48" width="40" height="40">
						<rect x="10" y="14" width="28" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
						<line x1="8" y1="40" x2="40" y2="8" stroke="var(--brand-teal)" stroke-width="2.5" stroke-linecap="round" />
					</svg>
				</span>
				<span class="lbl">{item.label}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.guide {
		display: grid;
		grid-template-columns: minmax(140px, 200px) 1fr;
		gap: 20px;
		align-items: center;
		padding: 18px 16px;
		margin-bottom: 24px;
		border-radius: 12px;
		background: #1a2b3c;
		color: #fff;
	}
	.ok {
		text-align: center;
	}
	.ok-frame {
		display: grid;
		place-items: center;
		background: #fff;
		color: #1a2b3c;
		border-radius: 8px;
		padding: 10px;
		margin-bottom: 8px;
	}
	.ok p {
		font-size: 12px;
		font-weight: 600;
		line-height: 1.3;
		margin: 0;
		color: rgba(255, 255, 255, 0.9);
	}
	.bads {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px 10px;
		margin: 0;
		padding: 0;
	}
	.bads li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		text-align: center;
		color: rgba(255, 255, 255, 0.85);
	}
	.icon {
		color: rgba(255, 255, 255, 0.75);
	}
	.lbl {
		font-size: 11px;
		font-weight: 600;
	}
	@media (max-width: 640px) {
		.guide {
			grid-template-columns: 1fr;
		}
		.bads {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
