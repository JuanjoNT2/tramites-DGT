export const ccaaList = [
	{ id: 'andalucia', name: 'Andalucía', itpRate: 0.04 },
	{ id: 'aragon', name: 'Aragón', itpRate: 0.04 },
	{ id: 'asturias', name: 'Asturias', itpRate: 0.04 },
	{ id: 'cantabria', name: 'Cantabria', itpRate: 0.08 },
	{ id: 'clm', name: 'Castilla-La Mancha', itpRate: 0.06 },
	{ id: 'cyl', name: 'Castilla y León', itpRate: 0.05 },
	{ id: 'cataluna', name: 'Cataluña', itpRate: 0.05 },
	{ id: 'madrid', name: 'Comunidad de Madrid', itpRate: 0.04 },
	{ id: 'valencia', name: 'Comunidad Valenciana', itpRate: 0.06 },
	{ id: 'extremadura', name: 'Extremadura', itpRate: 0.04 },
	{ id: 'galicia', name: 'Galicia', itpRate: 0.05 },
	{ id: 'baleares', name: 'Islas Baleares', itpRate: 0.04 },
	{ id: 'rioja', name: 'La Rioja', itpRate: 0.04 },
	{ id: 'navarra', name: 'Navarra', itpRate: 0.04 },
	{ id: 'pais-vasco', name: 'País Vasco', itpRate: 0.04 },
	{ id: 'murcia', name: 'Región de Murcia', itpRate: 0.04 }
] as const;

export const combustibles = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'GLP', 'GNC'] as const;

export type VehicleBrand = { id: string; name: string; models: string[] };

export const vehicleBrands: VehicleBrand[] = [
	{ id: 'seat', name: 'Seat', models: ['Ibiza', 'León', 'Arona', 'Ateca', 'Cupra Formentor'] },
	{ id: 'volkswagen', name: 'Volkswagen', models: ['Golf', 'Polo', 'Tiguan', 'Passat', 'ID.3'] },
	{ id: 'renault', name: 'Renault', models: ['Clio', 'Megane', 'Captur', 'Arkana', 'Zoe'] },
	{ id: 'peugeot', name: 'Peugeot', models: ['208', '308', '2008', '3008', '508'] },
	{ id: 'citroen', name: 'Citroën', models: ['C3', 'C4', 'C5 Aircross', 'Berlingo'] },
	{ id: 'ford', name: 'Ford', models: ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Mustang'] },
	{ id: 'toyota', name: 'Toyota', models: ['Aygo', 'Yaris', 'Corolla', 'C-HR', 'RAV4'] },
	{ id: 'bmw', name: 'BMW', models: ['Serie 1', 'Serie 3', 'X1', 'X3', 'i4'] },
	{ id: 'mercedes', name: 'Mercedes', models: ['Clase A', 'Clase C', 'GLA', 'GLC', 'EQA'] },
	{ id: 'audi', name: 'Audi', models: ['A1', 'A3', 'A4', 'Q3', 'Q5'] },
	{ id: 'hyundai', name: 'Hyundai', models: ['i10', 'i20', 'Tucson', 'Kona', 'Ioniq 5'] },
	{ id: 'kia', name: 'Kia', models: ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Niro'] },
	{ id: 'tesla', name: 'Tesla', models: ['Model 3', 'Model Y', 'Model S', 'Model X'] },
	{ id: 'nissan', name: 'Nissan', models: ['Micra', 'Juke', 'Qashqai', 'Leaf', 'Ariya'] },
	{ id: 'opel', name: 'Opel', models: ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland'] }
];

export const tramitacionFee = 89;
export const informeDgtFee = 15;
export const tasaDgtCoche = 55.7;
export const tasaDgtMoto = 27.85;
