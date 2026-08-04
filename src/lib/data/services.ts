export type ServiceGroupId = 'titularidad' | 'documentacion' | 'etiquetas' | 'situacion';

export type Service = {
	id: string;
	slug: string;
	title: string;
	description: string;
	landingPath: string;
	tramitarPath: string;
	image: string;
	/** Agrupación para menús (titularidad, docs, etiquetas…) */
	group: ServiceGroupId;
};

export const SERVICE_GROUPS: { id: ServiceGroupId; label: string }[] = [
	{ id: 'titularidad', label: 'Titularidad y compraventa' },
	{ id: 'documentacion', label: 'Documentación del vehículo' },
	{ id: 'etiquetas', label: 'Etiquetas y distintivos' },
	{ id: 'situacion', label: 'Situación del vehículo' }
];

export const services: Service[] = [
	{
		id: 'transferencia',
		slug: 'transferencia-vehiculos',
		title: 'Transferencia de Vehículos',
		description: 'Cambia la titularidad de tu vehículo de manera fácil y rápida',
		landingPath: '/transferencia-vehiculos',
		tramitarPath: '/tramitar/transferencia',
		image: '/images/services/transferencia.webp',
		group: 'titularidad'
	},
	{
		id: 'notificacion-venta',
		slug: 'notificacion-de-venta',
		title: 'Notificación de venta',
		description: 'Notifica la venta de tu vehículo ante la DGT de forma online',
		landingPath: '/notificacion-de-venta',
		tramitarPath: '/tramitar/notificacion-venta',
		image: '/images/services/transferencia.webp',
		group: 'titularidad'
	},
	{
		id: 'cancelacion',
		slug: 'cancelacion-de-reserva-de-dominio',
		title: 'Cancelación de reserva de dominio',
		description: 'Cancela la reserva de dominio a la entidad de crédito',
		landingPath: '/cancelacion-de-reserva-de-dominio',
		tramitarPath: '/tramitar/cancelacion-reserva',
		image: '/images/services/cancelacion.webp',
		group: 'titularidad'
	},
	{
		id: 'informe',
		slug: 'informe-trafico',
		title: 'Informe de Vehículo DGT',
		description: 'Emitido directamente por la DGT y autentificado por nosotros',
		landingPath: '/informe-trafico',
		tramitarPath: '/tramitar/informe-dgt',
		image: '/images/services/informe.webp',
		group: 'documentacion'
	},
	{
		id: 'nota-simple',
		slug: 'nota-simple-vehiculo',
		title: 'Nota simple de vehículo',
		description: 'Obtén la nota simple registral del vehículo de forma rápida y online',
		landingPath: '/nota-simple-vehiculo',
		tramitarPath: '/tramitar/nota-simple',
		image: '/images/services/informe.webp',
		group: 'documentacion'
	},
	{
		id: 'duplicado',
		slug: 'duplicado-de-carnet-de-conducir',
		title: 'Duplicado permiso de circulación',
		description: 'Solicita un duplicado del permiso de circulación de tu vehículo',
		landingPath: '/duplicado-de-carnet-de-conducir',
		tramitarPath: '/tramitar/duplicado-carnet',
		image: '/images/services/duplicado.webp',
		group: 'documentacion'
	},
	{
		id: 'etiqueta',
		slug: 'distintivo-medioambiental',
		title: 'Etiqueta Medioambiental',
		description: 'Consigue la etiqueta medioambiental oficial de la DGT para tu vehículo',
		landingPath: '/distintivo-medioambiental',
		tramitarPath: '/tramitar/etiqueta',
		image: '/images/services/etiqueta.webp',
		group: 'etiquetas'
	},
	{
		id: 'etiqueta-vmp',
		slug: 'etiqueta-vmp',
		title: 'Etiqueta VMP (patinete)',
		description:
			'Inscripción y etiqueta identificativa de tu patinete eléctrico (VMP) según la normativa DGT',
		landingPath: '/etiqueta-vmp',
		tramitarPath: '/tramitar/etiqueta-vmp',
		image: '/images/services/etiqueta-vmp.webp',
		group: 'etiquetas'
	},
	{
		id: 'baja-temporal',
		slug: 'baja-temporal-vehiculo',
		title: 'Baja temporal de vehículo',
		description: 'Tramita la baja temporal de tu vehículo ante la DGT sin desplazamientos',
		landingPath: '/baja-temporal-vehiculo',
		tramitarPath: '/tramitar/baja-temporal',
		image: '/images/services/cancelacion.webp',
		group: 'situacion'
	}
];

/** Servicios agrupados para menús (omite grupos vacíos). */
export function servicesByGroup(): { id: ServiceGroupId; label: string; items: Service[] }[] {
	return SERVICE_GROUPS.map((g) => ({
		...g,
		items: services.filter((s) => s.group === g.id)
	})).filter((g) => g.items.length > 0);
}

export const calculators = [
	{ title: 'Precio de una transferencia', path: '/calcular/precio-transferencia' },
	{ title: 'Valor venal en Hacienda', path: '/calcular/valor-venal' },
	{ title: 'Potencia fiscal', path: '/calcular/potencia-fiscal' },
	{ title: 'Calculadora de ITP', path: '/calcular/itp' }
];

export const advantages = [
	{ title: 'Cómodo', desc: 'Sin enviar papeles, todo desde la comodidad de tu teléfono.' },
	{ title: 'Rápido', desc: 'Solicita tus trámites en menos de 5 minutos.' },
	{ title: 'Sin esperas', desc: 'Recepción todos los días del año, las 24 horas del día.' },
	{ title: 'Seguro', desc: 'Garantizamos la seguridad del proceso, evitando fraudes o estafas.' }
];

export const processSteps = [
	{
		id: 'presupuesto',
		label: 'Calcula tu presupuesto',
		title: 'Calcula tu presupuesto',
		desc: 'Ingresa los datos técnicos del vehículo que quieres adquirir y calcula el presupuesto de la transferencia.',
		image: '/images/steps/presupuesto.webp'
	},
	{
		id: 'datos',
		label: 'Introduce los datos',
		title: 'Introduce los datos',
		desc: 'Introduce los datos del comprador, vendedor y matrícula y elige la forma de pago.',
		image: '/images/steps/datos.webp'
	},
	{
		id: 'identidad',
		label: 'Verifica tu identidad',
		title: 'Verifica tu identidad',
		desc: 'Verifica tu identidad de forma segura con DNI o NIE para continuar el trámite.',
		image: '/images/steps/identidad.webp'
	},
	{
		id: 'listo',
		label: 'Conduce tu nuevo vehículo',
		title: 'Conduce tu nuevo vehículo',
		desc: '¡Listo! Solo espera el permiso de circulación con nuevos datos; podrás conducir con el certificado que te enviamos.',
		image: '/images/steps/listo.webp'
	}
];

export const testimonials = [
	{
		name: 'José Castro',
		text: 'Muy satisfecho con el servicio. No fue necesario papeleo ni ningún trámite complicado, fue sencillo y práctico todo el proceso de transferir mi vehículo.'
	},
	{
		name: 'Daniela Sánchez',
		text: 'No tenía el distintivo ambiental y la verdad fue todo cosa de segundos, pagar y luego esperar para obtenerlo. Ninguna queja. ¡Recomendados!'
	},
	{
		name: 'Carlos Roa',
		text: 'A pesar de que la modalidad es virtual, pensé que tardaría un tiempo pero no fue así, en unos cuantos minutos mi trámite estaba listo. Son muy eficientes.'
	},
	{
		name: 'Laura Gómez',
		text: 'Sin duda adquirir el informe de tráfico en Trámites DGT Online fue muy sencillo. Lo recomiendo, ¡gracias por esta opción!'
	},
	{
		name: 'Andrea Medina',
		text: 'Tras consultar en diferentes compañías, el presupuesto que me dieron fue uno de los mejores que encontré, además el proceso fue rápido y sencillo. ¡Súper agradecida!'
	},
	{
		name: 'Miguel Torres',
		text: 'Todo el procedimiento para hacer el cambio de titularidad de mi vehículo fue online, súper fácil y sin ningún tipo de problema. Los recomiendo 100%.'
	},
	{
		name: 'Patricia Ruiz',
		text: 'Trámites DGT Online es lo más recomendable si quieres transferir tu vehículo. Hacen del proceso algo sencillo y rápido sin necesidad de papeleos complicados.'
	},
	{
		name: 'Elena Martín',
		text: 'Con un par de clicks he podido pedir el informe de tráfico del vehículo que quiero comprar. No se tarda nada en rellenar la información y es un trámite muy sencillo.'
	},
	{
		name: 'Javier Ortega',
		text: 'Es la segunda vez que pido el distintivo ambiental para otro coche que tengo y sin dudas lo recomiendo al 100%. No se tarda nada en pedir y en pocos días llega a casa.'
	}
];
