<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/aviso-legal')!;
	const updated = '20 de julio de 2026';
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap card pad">
		<h1>Aviso legal</h1>
		<p class="meta">Última actualización: {updated}</p>

		<p>
			En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio
			Electrónico (LSSI-CE), se informa a los usuarios de los siguientes datos identificativos del
			titular de este sitio web.
		</p>

		<h2>1. Datos identificativos</h2>
		<ul>
			<li><strong>Denominación social:</strong> Planning, Strategy and Growth S.L.</li>
			<li><strong>NIF:</strong> B01907211</li>
			<li>
				<strong>Domicilio social:</strong> Calle Joaquim Costa, 4 – 13, 46005 Valencia (España)
			</li>
			<li>
				<strong>Email:</strong>
				<a href="mailto:info@tramitesdgtonline.com">info@tramitesdgtonline.com</a>
			</li>
			<li>
				<strong>Nombre de dominio:</strong>
				<a href="https://tramitesdgtonline.com">tramitesdgtonline.com</a>
			</li>
		</ul>

		<h2>2. Objeto</h2>
		<p>
			El titular pone a disposición de los usuarios el presente documento para cumplir las
			obligaciones previstas en la LSSI-CE y para informar sobre las condiciones de uso del sitio web
			<strong>Trámites DGT Online</strong>, dedicado a la información y gestión online de trámites
			relacionados con vehículos ante la DGT y otras administraciones, a través de gestores y
			profesionales autorizados cuando proceda.
		</p>
		<p>
			Toda persona que acceda a este sitio asume el papel de usuario y se compromete a observar y
			cumplir estrictamente las disposiciones aquí recogidas, así como cualquier otra norma legal
			que resulte de aplicación.
		</p>

		<h2>3. Condiciones de uso</h2>
		<p>
			El acceso y uso del sitio es libre y gratuito, sin perjuicio del coste de conexión a Internet
			del usuario y de los precios de los servicios que se contraten a través de la plataforma.
		</p>
		<p>El usuario se obliga a:</p>
		<ul>
			<li>Facilitar información veraz, completa y actualizada en los formularios.</li>
			<li>No utilizar el sitio de forma ilícita, fraudulenta o contraria a la buena fe.</li>
			<li>
				No introducir virus, malware ni realizar acciones que puedan dañar, sobrecargar o alterar el
				funcionamiento del sitio o de terceros.
			</li>
			<li>
				No reproducir, distribuir o comunicar públicamente contenidos del sitio sin autorización,
				salvo lo permitido por la ley.
			</li>
		</ul>
		<p>
			El titular se reserva el derecho de denegar o retirar el acceso al sitio, sin necesidad de
			preaviso, a usuarios que incumplan estas condiciones.
		</p>

		<h2>4. Propiedad intelectual e industrial</h2>
		<p>
			El sitio web —incluyendo, a título enunciativo, textos, imágenes, logotipos, diseño, código
			fuente, bases de datos y marcas— es propiedad del titular o de terceros que han autorizado su
			uso. Quedan reservados todos los derechos.
		</p>
		<p>
			Queda prohibida la reproducción, distribución, comunicación pública, transformación o cualquier
			otra forma de explotación de los contenidos sin autorización previa y por escrito del titular,
			salvo los usos permitidos por la normativa de propiedad intelectual.
		</p>

		<h2>5. Exclusión de garantías y responsabilidad</h2>
		<p>
			El titular no garantiza la disponibilidad continua, ausencia de errores o utilidad concreta del
			sitio o de sus contenidos, aunque procurará su correcto funcionamiento.
		</p>
		<p>En la medida permitida por la ley, el titular no se responsabiliza de:</p>
		<ul>
			<li>Interrupciones, demoras o fallos técnicos ajenos a su control razonable.</li>
			<li>
				Daños derivados del uso indebido del sitio o de la información facilitada por el usuario.
			</li>
			<li>
				Contenidos de sitios de terceros a los que se pueda acceder mediante enlaces, ni de los
				servicios que dichos terceros presten.
			</li>
			<li>
				Decisiones adoptadas por la DGT u otras administraciones en el marco de un trámite, sin
				perjuicio de las obligaciones contractuales asumidas en cada servicio contratado.
			</li>
		</ul>
		<p>
			La información publicada tiene carácter orientativo y no sustituye el asesoramiento
			profesional personalizado cuando este resulte necesario.
		</p>

		<h2>6. Enlaces</h2>
		<p>
			Este sitio puede incluir enlaces a páginas de terceros. Dichos enlaces tienen finalidad
			informativa. El titular no controla ni asume responsabilidad por los contenidos, políticas o
			prácticas de esos sitios. La inclusión de un enlace no implica relación, patrocinio ni
			aprobación.
		</p>

		<h2>7. Protección de datos</h2>
		<p>
			El tratamiento de datos personales se rige por la
			<a href="/politica-de-privacidad">Política de privacidad</a> y, en lo relativo a cookies y
			tecnologías similares, por la
			<a href="/politica-de-cookies">Política de cookies</a>.
		</p>

		<h2>8. Legislación aplicable y jurisdicción</h2>
		<p>
			Las presentes condiciones se rigen por la legislación española. Para cualquier controversia
			derivada del acceso o uso del sitio, las partes se someten a los juzgados y tribunales de
			Valencia (España), salvo que la normativa de consumidores y usuarios establezca otro fuero
			imperativo a favor del usuario.
		</p>

		<h2>9. Contacto</h2>
		<p>
			Para cualquier consulta relacionada con este Aviso legal, puedes escribir a
			<a href="mailto:info@tramitesdgtonline.com">info@tramitesdgtonline.com</a>.
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
