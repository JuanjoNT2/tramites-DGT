export type UserRole = 'user' | 'gestor' | 'admin';

export type Profile = {
	id: string;
	email: string | null;
	full_name: string | null;
	role: UserRole;
	created_at: string;
	updated_at: string;
};

export type Solicitud = {
	id: string;
	tipo: string;
	payload: Record<string, unknown>;
	user_id: string | null;
	email: string | null;
	status: string;
	created_at: string;
};

export const SOLICITUD_TIPOS = [
	'transferencia',
	'etiqueta',
	'etiqueta-vmp',
	'informe-dgt',
	'duplicado-carnet',
	'cancelacion-reserva',
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
	'duplicado-carnet': 'Duplicado de carnet',
	duplicado: 'Duplicado de carnet',
	'cancelacion-reserva': 'Cancelación reserva dominio',
	cancelacion: 'Cancelación reserva dominio',
	contacto: 'Contacto'
};
