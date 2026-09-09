import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { displayFuelLabel, fuelCatalogHint } from './vehicles.ts';

describe('displayFuelLabel', () => {
	it('agrupa el cubo híbrido de Hacienda sin limitar a gasolina', () => {
		assert.equal(displayFuelLabel('Híbrido Gasolina Eléctrico'), 'Híbrido / enchufable');
		assert.equal(displayFuelLabel('Diesel'), 'Diésel');
		assert.equal(displayFuelLabel('Gasolina GLP'), 'Gasolina / GLP');
		assert.equal(displayFuelLabel('Eléctrico'), 'Eléctrico');
	});
});

describe('fuelCatalogHint', () => {
	it('indica que el PHEV diésel va en híbrido / enchufable', () => {
		const hint = fuelCatalogHint([
			{ name: 'Diesel' },
			{ name: 'Eléctrico' },
			{ name: 'Gasolina' },
			{ name: 'Híbrido Gasolina Eléctrico' }
		]);
		assert.match(hint ?? '', /di[eé]sel/i);
		assert.match(hint ?? '', /enchufable/i);
	});
});
