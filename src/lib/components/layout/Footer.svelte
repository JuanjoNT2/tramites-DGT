<script lang="ts">
	import { services, calculators } from '$lib/data/services';
	import Logo from '$lib/components/layout/Logo.svelte';
</script>

<footer class="footer">
	<div class="wrap grid">
		<div>
			<a href="/" class="brand-link"><Logo variant="white" height={52} /></a>
			<p class="desc">Trámites de vehículos 100% online. Tramitados al momento por nuestros expertos.</p>
			<p class="contact">
				<a href="mailto:info@tramitesdgtonline.com">info@tramitesdgtonline.com</a>
			</p>
		</div>
		<div>
			<h4>Trámites</h4>
			<ul>
				{#each services as s (s.id)}
					<li><a href={s.landingPath}>{s.title}</a></li>
				{/each}
			</ul>
		</div>
		<div>
			<h4>Calculadoras</h4>
			<ul>
				{#each calculators as c}
					<li><a href={c.path}>{c.title}</a></li>
				{/each}
			</ul>
		</div>
		<div>
			<h4>Enlaces</h4>
			<ul>
				<li><a href="/quienes-somos">Quiénes somos</a></li>
				<li><a href="/preguntas-frecuentes">Preguntas frecuentes</a></li>
				<li><a href="/noticias">Noticias</a></li>
				<li><a href="/contacto">Contacto</a></li>
			</ul>
		</div>
	</div>
	<div class="legal-bar">
		<div class="wrap legal">
			<p>© {new Date().getFullYear()} Trámites DGT Online · Todos los derechos reservados</p>
			<nav>
				<a href="/politica-de-privacidad">Privacidad</a>
				<a href="/politica-de-cookies">Cookies</a>
				<a href="/aviso-legal">Aviso legal</a>
				<a href="/politica-de-devoluciones">Devoluciones</a>
			</nav>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--bg-navy);
		color: #fff;
		padding: 48px 0 0;
		margin-top: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr 1fr 1fr;
		gap: 32px;
		padding-bottom: 40px;
	}

	.brand-link {
		display: inline-block;
		margin-bottom: 16px;
	}

	.desc {
		font-size: 14px;
		line-height: 1.55;
		margin-bottom: 16px;
		opacity: 0.85;
	}

	.contact a {
		color: var(--brand-teal);
		font-weight: 700;
		font-size: 14px;
	}

	.contact a:hover {
		text-decoration: underline;
	}

	h4 {
		color: var(--brand-teal);
		font-size: 14px;
		font-weight: 700;
		margin-bottom: 14px;
	}

	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	ul a {
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.85);
	}

	ul a:hover {
		color: var(--brand-teal);
	}

	.legal-bar {
		background: var(--footer-bar);
		padding: 6px 0;
	}

	.legal {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		font-size: 11px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
	}

	.legal nav {
		display: flex;
		gap: 16px;
	}

	.legal a {
		color: rgba(255, 255, 255, 0.85);
	}

	.legal a + a {
		border-left: 1px solid rgba(255, 255, 255, 0.3);
		padding-left: 16px;
	}

	@media (max-width: 800px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
