import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

/** Copia de la lógica de `generateAccountPassword` (sin $env) para test unitario. */
function generateAccountPassword(length = 18): string {
	const alphabet =
		'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*?';
	const bytes = randomBytes(length);
	let out = '';
	for (let i = 0; i < length; i++) {
		out += alphabet[bytes[i]! % alphabet.length];
	}
	return out;
}

describe('generateAccountPassword', () => {
	it('genera longitud pedida y charset permitido', () => {
		const pwd = generateAccountPassword(18);
		assert.equal(pwd.length, 18);
		assert.match(pwd, /^[A-Za-z0-9!@$%*?]+$/);
	});

	it('no es trivialmente constante', () => {
		const a = generateAccountPassword(20);
		const b = generateAccountPassword(20);
		assert.notEqual(a, b);
	});
});
