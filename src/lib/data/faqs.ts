/** Preguntas frecuentes por categoría (trámites + general). */
export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; items: FaqItem[] };

export const faqSections: FaqSection[] = [
	{
		id: 'general',
		title: 'General',
		items: [
			{
				q: '¿Puedo hacer los trámites desde el móvil?',
				a: 'Sí. Todos los formularios están pensados para móvil, tablet y ordenador. Solo necesitas conexión a Internet y fotos o escaneos de la documentación.'
			},
			{
				q: '¿Necesito cita previa en Tráfico o Hacienda?',
				a: 'No. Tramitamos online a través de gestorías colegiadas. No tienes que desplazarte a la DGT ni pedir cita previa.'
			},
			{
				q: '¿Cómo adjunto la documentación?',
				a: 'Puedes fotografiar o escanear cada documento. Procura que se vea completo, nítido, sin recortes ni dedos, preferiblemente sobre fondo claro y sin flash.'
			},
			{
				q: '¿Cómo se paga el trámite?',
				a: 'El pago se realiza de forma segura con tarjeta a través de nuestra pasarela (Stripe). No almacenamos los datos de tu tarjeta.'
			},
			{
				q: '¿Es seguro facilitar mis datos y documentos?',
				a: 'Sí. La conexión va cifrada (HTTPS), el pago lo gestiona la pasarela bancaria y tratamos los datos conforme a la normativa de protección de datos. Solo se usan para gestionar tu trámite.'
			},
			{
				q: '¿Puedo guardar el trámite y continuar más tarde?',
				a: 'Sí. En los formularios puedes guardar el borrador o tu solicitud en curso e iniciar sesión para recuperarla desde tu área de usuario.'
			},
			{
				q: '¿Puedo hacer el trámite por teléfono?',
				a: 'El trámite se completa online en la web. Si tienes dudas, puedes escribirnos desde la página de contacto o a info@tramitesdgtonline.com y te orientamos sobre el proceso y la documentación.'
			}
		]
	},
	{
		id: 'transferencia',
		title: 'Transferencia de vehículos',
		items: [
			{
				q: '¿Cómo realizar el cambio de nombre de un coche o moto online?',
				a: 'Elige el trámite de transferencia, introduce los datos del vehículo (marca, modelo, fechas, matrícula…), los del comprador y vendedor, adjunta la documentación, revisa el resumen y paga. Nosotros gestionamos tasas, ITP (si aplica) y el cambio de titularidad ante la DGT.'
			},
			{
				q: '¿Cuánto cuesta transferir un vehículo?',
				a: 'Depende del valor fiscal, la comunidad del comprador y los extras (por ejemplo informe DGT). Puedes calcularlo en nuestra calculadora de precio de transferencia antes de iniciar el trámite.'
			},
			{
				q: '¿El precio incluye el ITP?',
				a: 'En el presupuesto verás el desglose: Impuesto de Transmisiones Patrimoniales (si lo liquidamos nosotros), tasas DGT, tramitación y, si lo eliges, el informe del vehículo. El total se muestra antes de pagar.'
			},
			{
				q: '¿Cuánto tarda una transferencia de vehículo?',
				a: 'El plazo habitual para recibir el nuevo permiso de circulación en domicilio es de unos 15 días laborables desde que el expediente está completo, aunque depende de la carga de trabajo de la DGT.'
			},
			{
				q: '¿Qué documentos necesito para la transferencia?',
				a: 'Normalmente: DNI/NIE (anverso y reverso) de comprador y vendedor, permiso de circulación, ficha técnica (frontal y trasera) y, si aplica, factura de venta o contrato. El formulario te indica exactamente qué subir según tu caso.'
			},
			{
				q: '¿Necesito solicitar el informe del vehículo en Tráfico?',
				a: 'No es obligatorio, pero sí muy recomendable antes de comprar: permite ver titulares, cargas, reserva de dominio u otras incidencias. Puedes añadirlo en el propio trámite o solicitarlo aparte.'
			},
			{
				q: '¿Puedo circular mientras la transferencia está en trámite?',
				a: 'Cuando el expediente avanza correctamente, se gestiona la autorización provisional de circulación (válida un tiempo limitado, habitualmente hasta 90 días) hasta que llegue el permiso definitivo.'
			},
			{
				q: 'Ya he pagado el ITP. ¿Puedo hacer solo el cambio de nombre en DGT?',
				a: 'Sí. En el formulario puedes indicar que no liquidamos el ITP con nosotros y aportar el justificante del modelo 620/621 ya abonado para continuar solo con la gestión en Tráfico.'
			},
			{
				q: '¿Necesito aportar el impuesto de circulación (IVTM)?',
				a: 'Habitualmente no, salvo que conste como impagado en Tráfico. Si hubiera incidencias, te lo indicaríamos para resolverlas.'
			},
			{
				q: 'Soy el vendedor. ¿Cómo sé si el comprador ha transferido el vehículo?',
				a: 'Puedes solicitar un informe de vehículo DGT para comprobar la titularidad actual, o contactarnos si el trámite se ha iniciado con nosotros. También puedes hacer una notificación de venta para protegerte si el comprador se demora.'
			}
		]
	},
	{
		id: 'notificacion-venta',
		title: 'Notificación de venta',
		items: [
			{
				q: '¿Qué es la notificación de venta?',
				a: 'Es el trámite con el que el vendedor comunica a la DGT que ha vendido el vehículo. No es el cambio de nombre completo, pero reduce el riesgo de que te imputen multas o impuestos si el comprador tarda en transferir.'
			},
			{
				q: '¿Cuánto tiempo tengo para notificar la venta?',
				a: 'El plazo habitual es de 30 días desde la firma del contrato de compraventa. Conviene hacerlo cuanto antes para tu seguridad.'
			},
			{
				q: '¿Qué documentación necesito?',
				a: 'Identificación del vendedor, permiso de circulación, ficha técnica y contrato de compraventa (o factura si el vendedor es empresa). El formulario te guía paso a paso.'
			}
		]
	},
	{
		id: 'informe',
		title: 'Informe de vehículo DGT',
		items: [
			{
				q: '¿Qué información incluye el informe completo?',
				a: 'Datos del titular, identificación del vehículo, seguro, ITV, historial de titulares, cargas o gravámenes, lecturas de kilometraje, información técnica y medioambiental, entre otros.'
			},
			{
				q: '¿Cuánto tarda en llegar el informe?',
				a: 'En condiciones normales se genera de forma muy rápida una vez pagado el trámite. Si la DGT tiene incidencias puntuales, puede demorarse y te lo comunicaríamos.'
			},
			{
				q: '¿Qué diferencia hay con la nota simple?',
				a: 'El informe DGT resume si hay cargas e incidencias y el historial administrativo. La nota simple del Registro de Bienes Muebles detalla tipo de carga, entidad e importe; es especialmente útil para cancelar una reserva de dominio.'
			}
		]
	},
	{
		id: 'cancelacion',
		title: 'Cancelación de reserva de dominio',
		items: [
			{
				q: '¿Qué es la reserva de dominio?',
				a: 'Es una carga habitual cuando el coche se compró a plazos: la financiera retiene la propiedad hasta liquidar el crédito. Mientras exista, no podrás transferir, dar de baja ni vender con normalidad.'
			},
			{
				q: '¿Cuánto tarda cancelar la reserva de dominio?',
				a: 'Depende sobre todo de la respuesta de la entidad financiera (a menudo 2–4 semanas). Nosotros gestionamos el proceso online; el plazo final varía según cada financiera y el Registro.'
			},
			{
				q: '¿Qué documentos necesito?',
				a: 'Identificación del titular, permiso de circulación, ficha técnica y, si la tienes, la carta de fin de pago o cancelación de la financiera. Si no la tienes, te orientamos en cómo solicitarla.'
			}
		]
	},
	{
		id: 'vmp',
		title: 'Inscripción y etiqueta VMP',
		items: [
			{
				q: '¿Es obligatorio inscribir el patinete (VMP) en la DGT?',
				a: 'Sí, según la normativa vigente los VMP que circulen por vías públicas deben estar inscritos y portar la identificación correspondiente. Circular sin registro puede conllevar sanciones.'
			},
			{
				q: '¿Puedo inscribir un VMP sin certificado?',
				a: 'En determinados casos excepcionales se permite inscripción temporal de modelos no certificados, con validez limitada según la normativa. En el formulario indicarás si tu patinete tiene certificado o no.'
			},
			{
				q: '¿Qué documentación necesito para la inscripción VMP?',
				a: 'Identificación del titular, número de serie/bastidor (ficha o foto de la placa) y, si no está certificado, foto del vehículo. Si es sharing u otros usos, pueden pedirse documentos adicionales.'
			}
		]
	},
	{
		id: 'duplicado',
		title: 'Duplicado del permiso de circulación',
		items: [
			{
				q: '¿Cuándo debo solicitar un duplicado del permiso de circulación?',
				a: 'Por pérdida, robo, deterioro o extravío. También puede necesitarse renovación por cambio de servicio, cambios en ficha técnica ITV o cambio de datos del titular (manteniendo el mismo NIF/CIF).'
			},
			{
				q: '¿Cuánto tarda el duplicado?',
				a: 'El plazo orientativo suele ser de una a tres semanas hasta la recepción en domicilio, dependiendo de la DGT y el envío.'
			},
			{
				q: '¿Qué documentos necesito?',
				a: 'Identificación del titular. Según el motivo, puede pedirse denuncia o justificante de extravío, o foto del permiso actual y ficha técnica si hay cambios técnicos o de servicio.'
			}
		]
	},
	{
		id: 'nota-simple',
		title: 'Nota simple de vehículo',
		items: [
			{
				q: '¿Para qué sirve la nota simple?',
				a: 'Para conocer en detalle las cargas inscritas en el Registro de Bienes Muebles (reserva de dominio, embargo, leasing, etc.), la entidad responsable y el importe. Es clave antes de comprar o para cancelar una reserva.'
			},
			{
				q: '¿Qué necesito para solicitarla?',
				a: 'Principalmente la matrícula del vehículo. El bastidor es opcional pero ayuda a identificarlo con más precisión.'
			}
		]
	},
	{
		id: 'baja-temporal',
		title: 'Baja temporal',
		items: [
			{
				q: '¿Qué es la baja temporal de un vehículo?',
				a: 'Es un trámite DGT para inhabilitar temporalmente el uso del vehículo (máximo un año según la normativa habitual) y evitar seguros, IVTM u otras cargas mientras no circulas.'
			},
			{
				q: '¿Cuánto dura la baja temporal?',
				a: 'Como máximo un año; pasado ese plazo el vehículo puede darse de alta automáticamente. Si quieres prolongarla, hay que solicitar prórroga dentro de los plazos previstos.'
			},
			{
				q: '¿Qué documentos necesito?',
				a: 'Identificación del titular y permiso de circulación. Si no tienes el permiso, el formulario te indicará cómo declarar el extravío.'
			}
		]
	},
	{
		id: 'etiqueta',
		title: 'Etiqueta medioambiental',
		items: [
			{
				q: '¿Qué es la etiqueta medioambiental de la DGT?',
				a: 'Es el distintivo que clasifica el vehículo según emisiones (0, ECO, C, B…). Es necesario para circular en muchas Zonas de Bajas Emisiones y aparcamientos regulados.'
			},
			{
				q: '¿Qué necesito para solicitarla?',
				a: 'Datos del vehículo (matrícula) e identificación del solicitante, además del permiso de circulación. Te enviaremos la etiqueta física según las opciones de envío del trámite.'
			}
		]
	}
];

export function allFaqsFlat(): FaqItem[] {
	return faqSections.flatMap((s) => s.items);
}
