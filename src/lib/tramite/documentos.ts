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
};

const nifFrontal = (prefix: string, who: string): DocSlot => ({
	id: `${prefix}_nif_frontal`,
	label: `NIF ${who} (frontal)`,
	hint: 'Anverso del DNI/NIE/CIF, legible y completo.',
	required: true
});

const nifTrasero = (prefix: string, who: string): DocSlot => ({
	id: `${prefix}_nif_trasero`,
	label: `NIF ${who} (trasero)`,
	hint: 'Reverso del DNI/NIE/CIF.',
	required: true
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
					slots: [nifFrontal('comprador', 'del comprador'), nifTrasero('comprador', 'del comprador')]
				},
				{
					title: 'Documentación del vendedor',
					slots: [nifFrontal('vendedor', 'del vendedor'), nifTrasero('vendedor', 'del vendedor')]
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
						}
					]
				}
			];
		case 'notificacion-venta':
			return [
				{
					title: 'Documentación del titular',
					slots: [nifFrontal('titular', 'del titular'), nifTrasero('titular', 'del titular')]
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
							id: 'ficha_tecnica',
							label: 'Ficha técnica',
							hint: 'Ficha técnica (verde o electrónica).',
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
						}
					]
				}
			];
		case 'nota-simple':
			return [
				{
					title: 'Documentación del solicitante',
					slots: [nifFrontal('solicitante', 'del solicitante'), nifTrasero('solicitante', 'del solicitante')]
				}
			];
		case 'baja-temporal':
			return [
				{
					title: 'Documentación del titular',
					slots: [nifFrontal('titular', 'del titular'), nifTrasero('titular', 'del titular')]
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
		case 'cancelacion':
		case 'cancelacion-reserva':
			return [
				{
					title: 'Documentación del propietario',
					slots: [
						nifFrontal('propietario', 'del propietario'),
						nifTrasero('propietario', 'del propietario')
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
							label: 'Carta de cancelación de reserva de dominio',
							hint: 'Documento de finalización de pago / cancelación de la entidad (opcional).',
							required: false
						}
					]
				}
			];
		case 'etiqueta':
			return [
				{
					title: 'Documentación del solicitante',
					slots: [nifFrontal('solicitante', 'del solicitante'), nifTrasero('solicitante', 'del solicitante')]
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
						nifTrasero('propietario', 'del propietario')
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
						}
					]
				}
			];
		case 'informe':
		case 'informe-dgt':
			return [
				{
					title: 'Documentación del solicitante',
					slots: [nifFrontal('solicitante', 'del solicitante'), nifTrasero('solicitante', 'del solicitante')]
				}
			];
		case 'duplicado':
		case 'duplicado-carnet': {
			const motivo = (ctx.motivoDuplicado || '').toLowerCase();
			const extra: DocSlot =
				motivo.includes('extrav') || motivo.includes('sustra') || motivo.includes('robo')
					? {
							id: 'denuncia_justificante',
							label: 'Denuncia o justificante de extravío',
							hint: 'Documento de denuncia o constancia de extravío/sustracción.',
							required: true
						}
					: {
							id: 'foto_permiso',
							label: 'Foto del permiso de circulación',
							hint: 'Foto del permiso actual (aunque esté deteriorado).',
							required: true
						};
			return [
				{
					title: 'Documentación del solicitante',
					slots: [
						nifFrontal('solicitante', 'del solicitante'),
						nifTrasero('solicitante', 'del solicitante'),
						extra
					]
				}
			];
		}
		default:
			return [
				{
					title: 'Documentación',
					slots: [nifFrontal('solicitante', 'del solicitante'), nifTrasero('solicitante', 'del solicitante')]
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
