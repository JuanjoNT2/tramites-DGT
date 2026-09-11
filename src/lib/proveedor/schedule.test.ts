import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dueReportRange } from './schedule.ts';

/** 2026-09-07 es lunes; 2026-09-08, martes. */
const LUNES = new Date('2026-09-07T06:00:00Z');
const MARTES = new Date('2026-09-08T06:00:00Z');
const DIA_1 = new Date('2026-10-01T06:00:00Z');

describe('dueReportRange', () => {
	it('no envía nada con el interruptor apagado', () => {
		assert.equal(dueReportRange({ enabled: false, frecuencia: 'diario' }, MARTES), null);
		assert.equal(dueReportRange({ enabled: false, frecuencia: 'semanal' }, LUNES), null);
		assert.equal(dueReportRange({ enabled: false, frecuencia: 'mensual' }, DIA_1), null);
	});

	it('diario: manda el día anterior, cualquier día', () => {
		assert.deepEqual(dueReportRange({ enabled: true, frecuencia: 'diario' }, MARTES), {
			startDate: '2026-09-07',
			endDate: '2026-09-07'
		});
	});

	it('semanal: solo los lunes, con la semana anterior completa', () => {
		assert.equal(dueReportRange({ enabled: true, frecuencia: 'semanal' }, MARTES), null);
		assert.deepEqual(dueReportRange({ enabled: true, frecuencia: 'semanal' }, LUNES), {
			startDate: '2026-08-31',
			endDate: '2026-09-06'
		});
	});

	it('mensual: solo el día 1, con el mes anterior completo', () => {
		assert.equal(dueReportRange({ enabled: true, frecuencia: 'mensual' }, MARTES), null);
		assert.deepEqual(dueReportRange({ enabled: true, frecuencia: 'mensual' }, DIA_1), {
			startDate: '2026-09-01',
			endDate: '2026-09-30'
		});
	});

	it('los periodos son cerrados y no se solapan entre envíos', () => {
		const semana1 = dueReportRange({ enabled: true, frecuencia: 'semanal' }, LUNES);
		const semana2 = dueReportRange(
			{ enabled: true, frecuencia: 'semanal' },
			new Date('2026-09-14T06:00:00Z')
		);
		assert.ok(semana1 && semana2);
		assert.ok(semana1.endDate < semana2.startDate);
	});
});
