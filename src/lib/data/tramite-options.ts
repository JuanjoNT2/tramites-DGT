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

/** Motivos de duplicado / renovación del permiso de circulación del vehículo (no del carnet de conducir). */
export const duplicadoMotivos = [
	{ value: 'extravio', label: 'Pérdida / extravío del permiso de circulación' },
	{ value: 'deterioro', label: 'Deterioro del permiso de circulación' },
	{ value: 'sustraccion', label: 'Sustracción / robo del permiso de circulación' },
	{ value: 'cambio-servicio', label: 'Cambio de servicio del vehículo' },
	{ value: 'cambio-ficha', label: 'Cambios en ficha técnica ITV' },
	{ value: 'cambio-datos-titular', label: 'Cambio de datos del titular (mismo NIF/CIF)' }
] as const;

export const sexoOptions = [
	{ value: 'HOMBRE', label: 'Hombre' },
	{ value: 'MUJER', label: 'Mujer' }
] as const;

export const tramitePricing = {
	etiqueta: { service: 9.95, label: 'Distintivo ambiental' },
	etiquetaVmp: { service: 9.95, label: 'Etiqueta VMP' },
	informe: { service: 9.95, dgt: 9.09, label: 'Informe de tráfico' },
	duplicado: { total: 59.95, label: 'Duplicado permiso de circulación' },
	cancelacion: { total: 69.95, label: 'Cancelación reserva de dominio' },
	notificacionVenta: { total: 56, label: 'Notificación de venta' },
	notaSimple: { total: 20, label: 'Nota simple de vehículo' },
	bajaTemporal: { total: 58, label: 'Baja temporal de vehículo' }
} as const;
