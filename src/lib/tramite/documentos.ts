export type DocSlot = {
	id: string;
	label: string;
	hint?: string;
	required: boolean;
};

export type DocGroup = {
	title: string;
	slots: DocSlot[];
};

export type DocCatalogContext = {
	motivoDuplicado?: string;
	otraParteEmail?: string;
	/** comprador | vendedor — para priorizar hints */
	rol?: string;
	tipoSolicitudVmp?: string;
	facturaEmpresa?: string;
	/** cancelación: el usuario declara tener carta de fin de pago */
	cartaFinalizacion?: string;
};

const nifFrontal = (prefix: string, who: string): DocSlot => ({
	id: `${prefix}_nif_frontal`,
	label: `NIF ${who} (frontal)`,
	hint: 'Anverso del DNI/NIE/CIF, legible y completo. Si el NIE no tiene firma, adjunta pasaporte o permiso de conducir.',
	required: true
});

const nifTrasero = (prefix: string, who: string): DocSlot => ({
	id: `${prefix}_nif_trasero`,
	label: `NIF ${who} (trasero)`,
	hint: 'Reverso del DNI/NIE/CIF.',
	required: true
});

const cifEmpresa = (prefix: string, who: string): DocSlot => ({
	id: `${prefix}_cif_empresa`,
	label: `CIF / escritura ${who}`,
	hint: 'Solo si es empresa o autónomo con factura.',
	required: false
});

/** Catálogo de documentos a escanear/subir según el tipo de trámite. */
export function getDocumentGroups(
	tipoOrVariant: string,
	ctx: DocCatalogContext = {}
): DocGroup[] {
	const key = tipoOrVariant.replace(/^cancelacion.*/, 'cancelacion');

	switch (key) {
		case 'transferencia':
			return [
				{
					title: 'Documentación del comprador',
					slots: [
						nifFrontal('comprador', 'del comprador'),
						nifTrasero('comprador', 'del comprador'),
						cifEmpresa('comprador', 'de la empresa compradora')
					]
				},
				{
					title: 'Documentación del vendedor',
					slots: [
						nifFrontal('vendedor', 'del vendedor'),
						nifTrasero('vendedor', 'del vendedor'),
						cifEmpresa('vendedor', 'de la empresa vendedora')
					]
				},
				{
					title: 'Documentación del vehículo',
					slots: [
						{
							id: 'permiso_circulacion',
							label: 'Permiso de circulación',
							hint: 'Parte interior con los datos del vehículo.',
							required: true
						},
						{
							id: 'ficha_tecnica_frontal',
							label: 'Ficha técnica (frontal)',
							required: true
						},
						{
							id: 'ficha_tecnica_trasera',
							label: 'Ficha técnica (trasera)',
							required: true
						}
					]
				},
				{
					title: 'Otros',
					slots: [
						{
							id: 'contrato_compraventa',
							label: 'Contrato de compraventa',
							hint: 'Opcional si ya lo tienes firmado.',
							required: false
						},
						{
							id: 'factura_venta',
							label: 'Factura de venta',
							hint: 'Obligatoria si el vendedor es empresa/autónomo con factura.',
							required: ctx.facturaEmpresa === 'si'
						}
					]
				}
			];
		case 'notificacion-venta':
			return [
				{
					title: 'Documentación del vendedor',
					slots: [
						nifFrontal('vendedor', 'del vendedor'),
						nifTrasero('vendedor', 'del vendedor'),
						cifEmpresa('vendedor', 'de la empresa vendedora')
					]
				},
				{
					title: 'Documentación del comprador',
					slots: [
						nifFrontal('comprador', 'del comprador'),
						nifTrasero('comprador', 'del comprador'),
						cifEmpresa('comprador', 'de la empresa compradora')
					]
				},
				{
					title: 'Documentación del vehículo',
					slots: [
						{
							id: 'permiso_circulacion',
							label: 'Permiso de circulación',
							required: true
						},
						{
							id: 'ficha_tecnica_frontal',
							label: 'Ficha técnica (frontal)',
							required: true
						},
						{
							id: 'ficha_tecnica_trasera',
							label: 'Ficha técnica (trasera)',
							required: true
						}
					]
				},
				{
					title: 'Otros',
					slots: [
						{
							id: 'contrato_compraventa',
							label: 'Contrato de compraventa',
							hint: 'Contrato firmado entre las partes.',
							required: true
						},
						{
							id: 'factura_venta',
							label: 'Factura de venta del vehículo',
							hint: 'Si la venta es con factura de empresa.',
							required: false
						}
					]
				}
			];
		case 'nota-simple':
			return [
				{
					title: 'Documentación del solicitante',
					slots: [
						nifFrontal('solicitante', 'del solicitante'),
						nifTrasero('solicitante', 'del solicitante')
					]
				}
			];
		case 'baja-temporal':
			return [
				{
					title: 'Documentación del titular',
					slots: [
						nifFrontal('titular', 'del titular'),
						nifTrasero('titular', 'del titular'),
						cifEmpresa('titular', 'de la empresa')
					]
				},
				{
					title: 'Documentación del vehículo',
					slots: [
						{
							id: 'permiso_circulacion',
							label: 'Permiso de circulación',
							required: true
						},
						{
							id: 'ficha_tecnica_frontal',
							label: 'Tarjeta ITV / ficha técnica (frontal)',
							required: true
						},
						{
							id: 'ficha_tecnica_trasera',
							label: 'Tarjeta ITV / ficha técnica (trasera)',
							required: true
						}
					]
				}
			];
		case 'cancelacion':
		case 'cancelacion-reserva':
			return [
				{
					title: 'Documentación del propietario',
					slots: [
						nifFrontal('propietario', 'del propietario'),
						nifTrasero('propietario', 'del propietario'),
						cifEmpresa('propietario', 'de la empresa')
					]
				},
				{
					title: 'Documentación del vehículo',
					slots: [
						{
							id: 'permiso_circulacion',
							label: 'Permiso de circulación',
							required: true
						},
						{
							id: 'ficha_tecnica_frontal',
							label: 'Ficha técnica (frontal)',
							required: true
						},
						{
							id: 'ficha_tecnica_trasera',
							label: 'Ficha técnica (trasera)',
							required: true
						}
					]
				},
				{
					title: 'Otros',
					slots: [
						{
							id: 'carta_cancelacion',
							label: 'Carta de finalización de pago / cancelación',
							hint:
								ctx.cartaFinalizacion === 'si'
									? 'Adjunta la carta de la entidad financiera.'
									: 'Opcional si aún no la tienes; el gestor podrá solicitarla.',
							required: ctx.cartaFinalizacion === 'si'
						}
					]
				}
			];
		case 'etiqueta':
			return [
				{
					title: 'Documentación del solicitante',
					slots: [
						nifFrontal('solicitante', 'del solicitante'),
						nifTrasero('solicitante', 'del solicitante')
					]
				},
				{
					title: 'Documentación del vehículo',
					slots: [
						{
							id: 'permiso_circulacion',
							label: 'Permiso de circulación',
							required: true
						}
					]
				}
			];
		case 'etiqueta-vmp':
			return [
				{
					title: 'Documentación del propietario',
					slots: [
						nifFrontal('propietario', 'del propietario'),
						nifTrasero('propietario', 'del propietario'),
						cifEmpresa('propietario', 'de la empresa propietaria')
					]
				},
				{
					title: 'Documentación del vehículo',
					slots: [
						{
							id: 'ficha_vmp',
							label: 'Ficha técnica o foto placa identificativa del VMP',
							hint: 'Certificado / placa con número de serie visible.',
							required: true
						},
						{
							id: 'foto_vehiculo',
							label: 'Foto del vehículo',
							hint: 'Foto clara del patinete completo.',
							required: true
						},
						{
							id: 'permiso_circulacion',
							label: 'Permiso / certificado de circulación del VMP',
							hint: 'Si ya dispone de inscripción previa.',
							required: false
						}
					]
				}
			];
		case 'informe':
		case 'informe-dgt':
			return [
				{
					title: 'Documentación del solicitante',
					slots: [
						nifFrontal('solicitante', 'del solicitante'),
						nifTrasero('solicitante', 'del solicitante')
					]
				}
			];
		case 'duplicado':
		case 'duplicado-carnet': {
			const motivo = (ctx.motivoDuplicado || '').toLowerCase();
			const isRobo = motivo.includes('sustra') || motivo.includes('robo');
			const needsFicha =
				motivo.includes('servicio') ||
				motivo.includes('ficha') ||
				motivo.includes('itv') ||
				motivo.includes('datos');
			const slots: DocSlot[] = [
				nifFrontal('solicitante', 'del titular'),
				nifTrasero('solicitante', 'del titular'),
				cifEmpresa('solicitante', 'de la empresa')
			];
			if (isRobo) {
				slots.push({
					id: 'denuncia_justificante',
					label: 'Denuncia o justificante de sustracción',
					hint: 'Documento de denuncia ante autoridades.',
					required: true
				});
			} else if (!needsFicha) {
				slots.push({
					id: 'foto_permiso',
					label: 'Foto del permiso de circulación',
					hint: 'Si lo tienes (aunque esté deteriorado).',
					required: motivo.includes('deterior')
				});
			}
			if (needsFicha) {
				slots.push(
					{
						id: 'ficha_tecnica_frontal',
						label: 'Ficha técnica (frontal)',
						hint: 'Obligatoria en cambios de servicio o datos técnicos.',
						required: true
					},
					{
						id: 'ficha_tecnica_trasera',
						label: 'Ficha técnica (trasera)',
						required: true
					},
					{
						id: 'permiso_circulacion',
						label: 'Permiso de circulación actual',
						required: true
					}
				);
			}
			return [{ title: 'Documentación', slots }];
		}
		default:
			return [
				{
					title: 'Documentación',
					slots: [
						nifFrontal('solicitante', 'del solicitante'),
						nifTrasero('solicitante', 'del solicitante')
					]
				}
			];
	}
}

export function flattenDocSlots(groups: DocGroup[]): DocSlot[] {
	return groups.flatMap((g) => g.slots);
}

export function missingRequiredDocs(
	groups: DocGroup[],
	files: Record<string, File | null | undefined>
): string[] {
	return flattenDocSlots(groups)
		.filter((s) => s.required && !files[s.id])
		.map((s) => s.id);
}

export const MAX_DOC_BYTES = 10 * 1024 * 1024;
export const DOC_ACCEPT = 'image/*,.pdf,application/pdf';
