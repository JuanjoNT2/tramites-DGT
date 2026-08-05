/** Tipos de vehículo alineados con Transferencia24. */
export const vehicleTypeOptions = [
	{ value: 'coche', label: 'Coche / Autocaravana' },
	{ value: 'moto', label: 'Moto / Quad / Coche sin carnet' },
	{ value: 'caravana', label: 'Caravana / Remolque' }
] as const;

export type VehicleType = (typeof vehicleTypeOptions)[number]['value'];

export function vehicleTypeLabel(value: string): string {
	return vehicleTypeOptions.find((o) => o.value === value)?.label || value || '—';
}

/** Servicio habitual en DGT (particular). */
export const DEFAULT_VEHICLE_SERVICE = 'B00';

export const vehicleServiceOptions = [
	{ value: 'B00', label: 'B00 — Particular' },
	{ value: 'A00', label: 'A00 — Alquiler sin conductor' },
	{ value: 'B01', label: 'B01 — Autotaxi' },
	{ value: 'B02', label: 'B02 — Autobús' },
	{ value: 'otros', label: 'Otro servicio' }
] as const;
