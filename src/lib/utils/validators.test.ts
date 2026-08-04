import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	validateMatricula,
	validateNifNie,
	validatePhone,
	validateCodigoPostal,
	validateDate,
	validateDateOrder,
	parseDateInput,
	normalizeMatricula,
	applyNifNieLetter
} from './validators.ts';

describe('validateMatricula', () => {
	it('acepta formato nuevo', () => {
		assert.equal(validateMatricula('1234BCD'), null);
		assert.equal(validateMatricula('3990 WDS'), null);
	});
	it('acepta formato antiguo con vocales', () => {
		assert.equal(validateMatricula('M1234AB'), null);
		assert.equal(validateMatricula('SE1234CD'), null);
		assert.equal(validateMatricula('A1234BC'), null);
		assert.equal(validateMatricula('MA1234A'), null);
	});
	it('acepta antiguo con prefijo P/T/H provincial', () => {
		assert.equal(validateMatricula('P1234AB'), null);
		assert.equal(validateMatricula('T1234BC'), null);
	});
	it('rechaza inválidas', () => {
		assert.ok(validateMatricula('1234AAA'));
		assert.ok(validateMatricula(''));
		assert.ok(validateMatricula('XX12345'));
	});
	it('normaliza', () => {
		assert.equal(normalizeMatricula('1234-bcd'), '1234BCD');
	});
});

describe('validateNifNie / CIF', () => {
	it('NIF válido', () => {
		assert.equal(validateNifNie('12345678Z'), null);
	});
	it('NIF inválido indica la letra correcta', () => {
		const err = validateNifNie('12345678A');
		assert.ok(err);
		assert.match(err || '', /debería ser Z/i);
	});
	it('CIF con control', () => {
		assert.equal(validateNifNie('A58818501'), null);
		assert.equal(validateNifNie('B12345674'), null);
		assert.ok(validateNifNie('B00000001'));
	});
});

describe('applyNifNieLetter', () => {
	it('completa letra NIF y no pisa una letra ya escrita', () => {
		assert.equal(applyNifNieLetter('12345678'), '12345678Z');
		assert.equal(applyNifNieLetter('12345678a'), '12345678A');
		assert.equal(applyNifNieLetter('12345678Z'), '12345678Z');
	});
});

describe('validatePhone', () => {
	it('acepta móvil y +34', () => {
		assert.equal(validatePhone('612345678'), null);
		assert.equal(validatePhone('+34 612 345 678'), null);
		assert.equal(validatePhone('912345678'), null);
		assert.equal(validatePhone('34612345678'), null);
	});
	it('rechaza cortos', () => {
		assert.ok(validatePhone('61234'));
	});
});

describe('validateCodigoPostal', () => {
	it('acepta 5 dígitos', () => {
		assert.equal(validateCodigoPostal('28001'), null);
		assert.equal(validateCodigoPostal('08001'), null);
	});
	it('rechaza inválidos', () => {
		assert.ok(validateCodigoPostal('2800'));
		assert.ok(validateCodigoPostal('00000'));
	});
});

describe('validateDate', () => {
	it('parsea ISO y dmy', () => {
		assert.ok(parseDateInput('2020-01-15'));
		assert.ok(parseDateInput('15/01/2020'));
		assert.equal(parseDateInput('31/02/2020'), null);
	});
	it('rechaza futuras', () => {
		const future = new Date();
		future.setFullYear(future.getFullYear() + 1);
		const iso = future.toISOString().slice(0, 10);
		assert.match(validateDate(iso, { label: 'Fecha venta' }) || '', /futura/i);
	});
	it('acepta pasado', () => {
		assert.equal(validateDate('2020-06-01', { label: 'Fecha' }), null);
	});
	it('edad mínima', () => {
		const recent = new Date();
		recent.setFullYear(recent.getFullYear() - 10);
		const iso = recent.toISOString().slice(0, 10);
		assert.match(validateDate(iso, { minAgeYears: 18, label: 'Nacimiento' }) || '', /18/);
	});
});

describe('validateDateOrder', () => {
	it('matrícula antes de venta', () => {
		assert.equal(validateDateOrder('2015-01-01', '2020-01-01'), null);
		assert.ok(validateDateOrder('2020-01-01', '2015-01-01'));
	});
});
