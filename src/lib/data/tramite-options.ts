export const shippingOptions = [
	{
		value: 'postal',
		label: 'Envío postal',
		desc: '7-10 días hábiles',
		price: 8.95
	},
	{
		value: 'express',
		label: 'Envío express',
		desc: '48-72 horas hábiles',
		price: 14.95
	}
] as const;

export const duplicadoMotivos = [
	{ value: 'perdida', label: 'Pérdida permiso conducir' },
	{ value: 'deterioro', label: 'Deterioro permiso conducir' },
	{ value: 'sustraccion', label: 'Sustracción permiso conducir' },
	{ value: 'cambio-domicilio', label: 'Cambio domicilio conductor' },
	{ value: 'internacional', label: 'Permiso internacional' },
	{ value: 'circulacion-extravio', label: 'Extravío permiso circulación' },
	{ value: 'circulacion-deterioro', label: 'Deterioro permiso circulación' },
	{ value: 'circulacion-sustraccion', label: 'Sustracción permiso circulación' }
] as const;

export const permisoClases = [
	'AM',
	'A1',
	'A2',
	'A',
	'B',
	'EB',
	'BTP',
	'C1',
	'C',
	'D1',
	'D',
	'BE',
	'C1E',
	'CE',
	'D1E',
	'DE'
] as const;

export const sexoOptions = [
	{ value: 'HOMBRE', label: 'Hombre' },
	{ value: 'MUJER', label: 'Mujer' }
] as const;

export const tramitePricing = {
	etiqueta: { service: 9.95, label: 'Distintivo ambiental' },
	informe: { service: 9.95, dgt: 9.09, label: 'Informe de tráfico' },
	duplicado: { total: 59.95, label: 'Duplicado carnet' },
	cancelacion: { total: 69.95, label: 'Cancelación reserva de dominio' }
} as const;
