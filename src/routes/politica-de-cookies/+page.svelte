<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/politica-de-cookies')!;
	const updated = '20 de julio de 2026';
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap card pad">
		<h1>Política de cookies</h1>
		<p class="meta">Última actualización: {updated}</p>

		<p>
			Esta Política explica qué cookies y tecnologías similares utiliza
			<strong>Trámites DGT Online</strong> (
			<em>Planning, Strategy and Growth S.L.</em>, NIF B01907211) y cómo puedes gestionarlas.
		</p>

		<h2>1. ¿Qué son las cookies?</h2>
		<p>
			Las cookies son pequeños ficheros que se almacenan en tu dispositivo. También pueden usarse
			tecnologías equivalentes (por ejemplo, almacenamiento local del navegador) con finalidades
			parecidas.
		</p>

		<h2>2. Tipos que usamos</h2>
		<ul>
			<li>
				<strong>Técnicas / necesarias:</strong> permiten navegar, mantener la seguridad, recordar
				preferencias esenciales (como tu decisión de consentimiento) y operar formularios. No
				requieren consentimiento.
			</li>
			<li>
				<strong>Analítica (no esencial):</strong> nos ayudan a entender el uso del sitio y mejorar
				el embudo de trámites (páginas vistas, pasos del formulario, etc.). Solo se activan si
				aceptas en el banner de consentimiento.
			</li>
		</ul>
		<p>No utilizamos cookies de publicidad de terceros para vender tus datos.</p>

		<h2>3. ¿Es necesario el banner?</h2>
		<p>
			Sí, para la analítica no esencial. En la UE/España, las cookies o el almacenamiento equivalentes
			que no sean estrictamente necesarios para prestar el servicio solicitado requieren
			<strong>información previa y consentimiento</strong> (normativa de privacidad y LSSI). Por eso
			mostramos un banner para aceptar o rechazar la analítica, aunque esta sea de primera parte y no
			se vendan datos.
		</p>

		<h2>4. Cómo gestionar el consentimiento</h2>
		<ul>
			<li>Puedes aceptar o rechazar la analítica en el banner la primera vez que nos visitas.</li>
			<li>
				También puedes borrar cookies y datos del sitio desde la configuración de tu navegador.
			</li>
			<li>
				Más información sobre el tratamiento de datos personales en la
				<a href="/politica-de-privacidad">Política de privacidad</a>.
			</li>
		</ul>

		<h2>5. Contacto</h2>
		<p>
			Responsable: Planning, Strategy and Growth S.L. ·
			<a href="mailto:info@tramitesdgtonline.com">info@tramitesdgtonline.com</a> · DPD:
			<a href="mailto:dpd@tramitesdgtonline.com">dpd@tramitesdgtonline.com</a>
		</p>
	</div>
</section>

<style>
	.pad {
		max-width: 760px;
		margin: 0 auto;
		padding: 40px;
	}
	h1 {
		font-size: 28px;
		font-weight: 800;
		margin-bottom: 8px;
		letter-spacing: -0.02em;
	}
	.meta {
		color: var(--text3);
		font-size: 14px;
		margin-bottom: 24px;
	}
	h2 {
		font-size: 18px;
		font-weight: 800;
		margin: 28px 0 10px;
	}
	p,
	li {
		color: var(--text2);
		line-height: 1.65;
		font-size: 15px;
	}
	ul {
		margin: 0 0 8px;
		padding-left: 1.2em;
	}
	li {
		margin-bottom: 6px;
	}
	a {
		color: var(--primary);
	}
</style>
