<script lang="ts">
	import { PRIVACY_UPDATED } from '$lib/legal/privacy-updated';

	let {
		showTitle = true
	}: {
		showTitle?: boolean;
	} = $props();
</script>

<div class="privacy-content">
	{#if showTitle}
		<h1 class="title" id="privacy-policy-heading">Política de privacidad</h1>
	{/if}
	<p class="meta">Última actualización: {PRIVACY_UPDATED}</p>

	<p>
		En Trámites DGT Online nos tomamos en serio la protección de tus datos personales. Esta Política
		explica quién es el responsable del tratamiento, qué datos recabamos, con qué finalidad, durante
		cuánto tiempo y cuáles son tus derechos, de conformidad con el Reglamento (UE) 2016/679 (RGPD) y
		la Ley Orgánica 3/2018 (LOPDGDD).
	</p>

	<h2>1. Responsable del tratamiento</h2>
	<ul>
		<li><strong>Identidad:</strong> Planning, Strategy and Growth S.L.</li>
		<li><strong>NIF:</strong> B01907211</li>
		<li><strong>Domicilio:</strong> Calle Joaquim Costa, 4 – 13, 46005 Valencia (España)</li>
		<li>
			<strong>Email de contacto:</strong>
			<a href="mailto:info@tramitesdgtonline.com">info@tramitesdgtonline.com</a>
		</li>
		<li>
			<strong>Sitio web:</strong>
			<a href="https://tramitesdgtonline.com">https://tramitesdgtonline.com</a>
		</li>
	</ul>

	<h2>2. Delegado de Protección de Datos (DPD)</h2>
	<p>
		Puedes contactar con nuestro Delegado de Protección de Datos en
		<a href="mailto:dpd@tramitesdgtonline.com">dpd@tramitesdgtonline.com</a>.
	</p>

	<h2>3. Datos que tratamos</h2>
	<p>Según el servicio que uses, podemos tratar:</p>
	<ul>
		<li>
			<strong>Datos de identificación y contacto:</strong> nombre, apellidos, NIF/NIE/CIF, email,
			teléfono, dirección postal.
		</li>
		<li>
			<strong>Datos del vehículo y del trámite:</strong> matrícula, bastidor, marca, modelo,
			combustible, fechas, comunidad autónoma, documentación aportada (DNI, ficha técnica, permiso
			de circulación, etc.).
		</li>
		<li>
			<strong>Datos de la operación:</strong> rol (comprador/vendedor), precio de compraventa,
			preferencias del servicio e información necesaria para liquidar tasas e impuestos cuando
			proceda.
		</li>
		<li>
			<strong>Datos de navegación y analítica:</strong> páginas visitadas, eventos del embudo,
			dispositivo/navegador de forma agregada o seudonimizada, si aceptas la analítica.
		</li>
	</ul>

	<h2>4. Finalidades y base jurídica</h2>
	<ul>
		<li>
			<strong>Gestionar tu solicitud de trámite</strong> (ejecución de medidas precontractuales /
			contrato, art. 6.1.b RGPD).
		</li>
		<li>
			<strong>Atender consultas</strong> enviadas por formularios o email (interés legítimo o
			consentimiento, art. 6.1.f / 6.1.a RGPD).
		</li>
		<li>
			<strong>Cumplir obligaciones legales</strong> frente a la Administración y la normativa
			aplicable (art. 6.1.c RGPD).
		</li>
		<li>
			<strong>Enviar comunicaciones comerciales</strong> sobre servicios relacionados, solo si nos
			das tu consentimiento o cuando la ley lo permita; puedes oponerte en cualquier momento (art.
			6.1.a / 6.1.f RGPD).
		</li>
		<li>
			<strong>Analítica web</strong> para mejorar el sitio y el embudo de trámites, solo con tu
			consentimiento previo cuando no sea estrictamente necesaria (art. 6.1.a RGPD).
		</li>
	</ul>

	<h2>5. Destinatarios</h2>
	<p>Tus datos podrán comunicarse, solo cuando sea necesario, a:</p>
	<ul>
		<li>
			<strong>Administraciones públicas competentes</strong> (por ejemplo, DGT y Hacienda
			autonómica) para la ejecución del trámite solicitado.
		</li>
		<li>
			<strong>Gestores administrativos y profesionales autorizados</strong> que intervengan en la
			tramitación, bajo el correspondiente encargo o relación contractual.
		</li>
		<li>
			<strong>Proveedores tecnológicos</strong> que nos prestan hosting, email, almacenamiento o
			analítica (encargados del tratamiento), con las garantías exigidas por el RGPD.
		</li>
	</ul>
	<p>No vendemos tus datos personales a terceros.</p>

	<h2>6. Transferencias internacionales</h2>
	<p>
		Con carácter general no realizamos transferencias internacionales de datos. Si algún proveedor
		ubicado fuera del Espacio Económico Europeo interviene (por ejemplo, infraestructura cloud), se
		aplicarán las garantías adecuadas previstas en el RGPD (cláusulas contractuales tipo u otras
		medidas equivalentes).
	</p>

	<h2>7. Plazos de conservación</h2>
	<ul>
		<li>
			<strong>Datos del trámite y documentación:</strong> durante la gestión y, como máximo,
			<strong>2 años</strong> desde la finalización o archivo del expediente, salvo obligación legal
			de conservarlos más tiempo.
		</li>
		<li>
			<strong>Email y/o teléfono para ofertas:</strong> mientras no retires el consentimiento o te
			opongas al tratamiento.
		</li>
		<li>
			<strong>Datos de facturación y obligaciones legales:</strong> los plazos exigidos por la
			normativa mercantil, fiscal o administrativa aplicable.
		</li>
		<li>
			<strong>Analítica:</strong> en forma agregada o seudonimizada según la configuración vigente y
			el consentimiento otorgado.
		</li>
	</ul>

	<h2>8. Derechos de las personas interesadas</h2>
	<p>Puedes ejercer los derechos de:</p>
	<ul>
		<li>Acceso, rectificación, supresión y oposición</li>
		<li>Limitación del tratamiento</li>
		<li>Portabilidad (cuando proceda)</li>
		<li>Retirada del consentimiento, sin efectos retroactivos</li>
	</ul>
	<p>
		Para ejercerlos, escribe a
		<a href="mailto:info@tramitesdgtonline.com">info@tramitesdgtonline.com</a> o a
		<a href="mailto:dpd@tramitesdgtonline.com">dpd@tramitesdgtonline.com</a>, indicando el derecho
		que solicitas y acompañando copia de tu documento identificativo si fuera necesario para
		verificar tu identidad.
	</p>
	<p>
		También puedes presentar una reclamación ante la
		<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer"
			>Agencia Española de Protección de Datos (AEPD)</a
		>.
	</p>

	<h2>9. Menores</h2>
	<p>
		Los servicios de este sitio no están dirigidos a menores de 14 años. Si detectamos datos de un
		menor sin la autorización correspondiente, procederemos a eliminarlos.
	</p>

	<h2>10. Seguridad</h2>
	<p>
		Aplicamos medidas técnicas y organizativas adecuadas al riesgo (control de accesos, cifrado en
		tránsito, minimización y formación) para proteger los datos personales frente a acceso, pérdida o
		tratamiento no autorizado.
	</p>

	<h2>11. Decisiones automatizadas y elaboración de perfiles</h2>
	<p>
		No tomamos decisiones automatizadas con efectos jurídicos significativos ni elaboramos perfiles
		con esa finalidad sobre la base de tus datos de trámite. La analítica web, si la aceptas, se usa
		para estadísticas y mejora del servicio.
	</p>

	<h2>12. Cookies y tecnologías similares</h2>
	<p>
		Utilizamos cookies y/o almacenamiento local necesarios para el funcionamiento del sitio, y
		analítica no esencial solo si das tu consentimiento a través del banner. Consulta la
		<a href="/politica-de-cookies">Política de cookies</a> para más detalle.
	</p>

	<h2>13. Actualizaciones</h2>
	<p>
		Podemos actualizar esta Política para adaptarla a cambios legales o del servicio. La versión
		vigente será siempre la publicada en esta página, con su fecha de actualización.
	</p>
</div>

<style>
	.title {
		font-size: 28px;
		font-weight: 800;
		margin: 0 0 8px;
		letter-spacing: -0.02em;
		color: var(--ink, #003050);
	}
	.meta {
		color: var(--text3, #5a6b7d);
		font-size: 14px;
		margin: 0 0 24px;
	}
	.privacy-content h2 {
		font-size: 18px;
		font-weight: 800;
		margin: 28px 0 10px;
		color: var(--ink, #003050);
	}
	.privacy-content p,
	.privacy-content li {
		color: var(--text2, #1a2b3c);
		line-height: 1.65;
		font-size: 15px;
	}
	.privacy-content ul {
		margin: 0 0 8px;
		padding-left: 1.2em;
	}
	.privacy-content li {
		margin-bottom: 6px;
	}
	.privacy-content a {
		color: var(--primary, #003050);
	}
</style>
