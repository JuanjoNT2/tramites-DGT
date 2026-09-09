import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	cuerpoAvisoPeticion,
	displayDocNombre,
	docTypeOf,
	formatRejectionMotivo,
	sanitizeDocType,
	slugOtroDocType,
	tituloAvisoPeticion
} from './doc-peticiones.ts';

describe('doc-peticiones helpers', () => {
	it('infiere doc_type del nombre y de la columna', () => {
		assert.equal(docTypeOf({ nombre: 'ficha_tecnica_frontal__scan.jpg' }), 'ficha_tecnica_frontal');
		assert.equal(
			docTypeOf({ nombre: 'scan.jpg', doc_type: 'permiso_circulacion' }),
			'permiso_circulacion'
		);
		assert.equal(displayDocNombre('ficha_tecnica_frontal__scan.jpg'), 'scan.jpg');
	});

	it('slug de documento libre', () => {
		assert.equal(slugOtroDocType('Autorización firmada'), 'otro_autorizacion_firmada');
		assert.equal(sanitizeDocType('ficha-tecnica_frontal'), 'ficha-tecnica_frontal');
	});

	it('arma avisos de pendiente y rechazo DGT', () => {
		assert.match(tituloAvisoPeticion('pendiente', 'NIF frontal'), /Falta un documento/);
		assert.match(tituloAvisoPeticion('rechazado', 'Ficha técnica'), /DGT/);
		assert.match(cuerpoAvisoPeticion({ kind: 'rechazado', label: 'NIF', motivo: 'Foto borrosa' }), /borrosa/);
		assert.equal(formatRejectionMotivo('borrosa', 'se ve el flash'), 'Foto borrosa o desenfocada. se ve el flash');
	});
});
