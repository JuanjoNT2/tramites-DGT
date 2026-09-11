import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROVEEDOR_TIPOS, isProveedorTipo } from './scope.ts';

describe('isProveedorTipo', () => {
	it('reclama el distintivo ambiental de coche para el proveedor', () => {
		assert.equal(isProveedorTipo('etiqueta'), true);
	});

	it('deja el adhesivo de patinete en el panel del gestor', () => {
		assert.equal(isProveedorTipo('etiqueta-vmp'), false);
	});

	it('deja el resto de trámites en el panel del gestor', () => {
		for (const tipo of ['transferencia', 'informe-dgt', 'baja-temporal', 'contacto']) {
			assert.equal(isProveedorTipo(tipo), false);
		}
	});

	it('tolera valores vacíos o nulos', () => {
		assert.equal(isProveedorTipo(''), false);
		assert.equal(isProveedorTipo(null), false);
		assert.equal(isProveedorTipo(undefined), false);
		assert.equal(isProveedorTipo('  etiqueta  '), true);
	});

	it('cubre todos los tipos declarados como del proveedor', () => {
		for (const tipo of PROVEEDOR_TIPOS) {
			assert.equal(isProveedorTipo(tipo), true);
		}
	});
});
