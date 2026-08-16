export type UserRole = 'user' | 'gestor' | 'admin';

export type SolicitudStatus =
	| 'nueva'
	| 'en_curso'
	| 'realizada'
	| 'cancelada'
	| 'pendiente_pago'
	| 'pagada';

/** Dirección estructurada (misma granularidad que los wizards de trámite). */
export type ProfileDireccion = {
	tipoVia?: string;
	/** Nombre de la vía (sin tipo ni número) */
	calle?: string;
	numero?: string;
	piso?: string;
	puerta?: string;
	bloque?: string;
	escalera?: string;
	cp?: string;
	/** Alias legacy / display; preferir municipio */
	ciudad?: string;
	municipio?: string;
	pueblo?: string;
	localidad?: string;
	provincia?: string;
};

export type ProfileDocumentoRef = {
	path: string;
	mime?: string | null;
	nombre?: string;
	updated_at?: string;
};

/** Documentos del titular reutilizables entre trámites. */
export type ProfileDocumentos = {
	nif_frontal?: ProfileDocumentoRef;
	nif_trasero?: ProfileDocumentoRef;
};

export type Profile = {
	id: string;
	email: string | null;
	full_name: string | null;
	nombre?: string | null;
	apellido1?: string | null;
	apellido2?: string | null;
	role: UserRole;
	telefono?: string | null;
	nif?: string | null;
	direccion?: ProfileDireccion | Record<string, unknown> | null;
	documentos?: ProfileDocumentos | Record<string, unknown> | null;
	/** ISO date YYYY-MM-DD */
	fecha_nacimiento?: string | null;
	/** HOMBRE | MUJER */
	sexo?: string | null;
	created_at: string;
	updated_at: string;
};

export type Solicitud = {
	id: string;
	tipo: string;
	payload: Record<string, unknown>;
	user_id: string | null;
	email: string | null;
	status: SolicitudStatus | string;
	created_at: string;
	updated_at?: string;
};

export type Vehiculo = {
	id: string;
	user_id: string;
	matricula: string;
	tipo: string;
	marca: string | null;
	modelo: string | null;
	bastidor: string | null;
	meta: Record<string, unknown>;
	created_at: string;
	updated_at: string;
};

export type SolicitudDocumento = {
	id: string;
	solicitud_id: string;
	user_id: string | null;
	nombre: string;
	path: string;
	mime: string | null;
	uploaded_by: 'user' | 'gestor' | 'admin';
	created_at: string;
};

export type Notificacion = {
	id: string;
	user_id: string;
	tipo: string;
	titulo: string;
	cuerpo: string | null;
	link: string | null;
	read_at: string | null;
	created_at: string;
};

export const SOLICITUD_STATUSES: SolicitudStatus[] = [
	'nueva',
	'pendiente_pago',
	'pagada',
	'en_curso',
	'realizada',
	'cancelada'
];

export const SOLICITUD_STATUS_LABELS: Record<SolicitudStatus, string> = {
	nueva: 'Nueva',
	pendiente_pago: 'Pendiente de pago',
	pagada: 'Pagada',
	en_curso: 'En curso',
	realizada: 'Realizada',
	cancelada: 'Cancelada'
};

export const SOLICITUD_TIPOS = [
	'transferencia',
	'etiqueta',
	'etiqueta-vmp',
	'informe-dgt',
	'duplicado-carnet',
	'cancelacion-reserva',
	'notificacion-venta',
	'nota-simple',
	'baja-temporal',
	'contacto'
] as const;

export type SolicitudTipo = (typeof SOLICITUD_TIPOS)[number] | string;

export const SOLICITUD_TIPO_LABELS: Record<string, string> = {
	transferencia: 'Transferencia',
	etiqueta: 'Etiqueta medioambiental',
	'etiqueta-vmp': 'Etiqueta VMP',
	vmp: 'Etiqueta VMP',
	'informe-dgt': 'Informe de tráfico',
	informe: 'Informe de tráfico',
	'duplicado-carnet': 'Duplicado permiso de circulación',
	duplicado: 'Duplicado permiso de circulación',
	'cancelacion-reserva': 'Cancelación reserva dominio',
	cancelacion: 'Cancelación reserva dominio',
	'notificacion-venta': 'Notificación de venta',
	'nota-simple': 'Nota simple de vehículo',
	'baja-temporal': 'Baja temporal de vehículo',
	contacto: 'Contacto'
};

export function isEnCursoStatus(status: string): boolean {
	return (
		status === 'nueva' ||
		status === 'en_curso' ||
		status === 'pendiente_pago' ||
		status === 'pagada'
	);
}

export function isRealizadoStatus(status: string): boolean {
	return status === 'realizada';
}
