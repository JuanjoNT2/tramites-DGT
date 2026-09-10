import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BUCKET_DEFAULT_STATUS, classifyTramiteBucket } from './board.ts';

describe('classifyTramiteBucket', () => {
	it('agrupa los estados previos al trabajo en «por hacer»', () => {
		assert.equal(classifyTramiteBucket('nueva'), 'por_hacer');
		assert.equal(classifyTramiteBucket('pendiente_pago'), 'por_hacer');
		assert.equal(classifyTramiteBucket('pagada'), 'por_hacer');
	});

	it('separa el trabajo en marcha y el cerrado', () => {
		assert.equal(classifyTramiteBucket('en_curso'), 'en_curso');
		assert.equal(classifyTramiteBucket('realizada'), 'hecho');
		assert.equal(classifyTramiteBucket('cancelada'), 'hecho');
	});

	it('trata un estado desconocido como pendiente de hacer', () => {
		assert.equal(classifyTramiteBucket('otro'), 'por_hacer');
	});
});

describe('BUCKET_DEFAULT_STATUS', () => {
	it('mantiene la columna al soltar una tarjeta', () => {
		for (const [bucket, status] of Object.entries(BUCKET_DEFAULT_STATUS)) {
			assert.equal(classifyTramiteBucket(status), bucket);
		}
	});
});
