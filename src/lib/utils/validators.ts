const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

/** Normaliza matrícula: mayúsculas, sin espacios ni guiones. */
export function normalizeMatricula(value: string): string {
	return value.trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Matrícula española:
 * - Nueva (2000–): 4 dígitos + 3 consonantes (sin vocales/Q/Ñ)
 * - Antigua provincial: 1–2 letras + 4 dígitos + 1–2 letras
 * No admite especiales (temporales P/T, históricas H, diplomáticas).
 */
export function validateMatricula(value: string): string | null {
	const v = normalizeMatricula(value);
	if (!v) return 'Introduce la matrícula';

	// Sistema actual (2000–)
	if (/^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/.test(v)) return null;

	// Sistema antiguo provincial (prefijo con vocales históricas: A, O, LE, MA, SE…)
	if (/^[A-Z]{1,2}\d{4}[A-Z]{1,2}$/.test(v)) return null;

	return 'Matrícula no válida. Usa formato actual (1234BCD) o antiguo (M1234AB, SE1234CD). Matrículas especiales (diplomáticas, temporales) no se tramitan online.';
}

export function validateNifNie(value: string): string | null {
	const v = value.trim().toUpperCase().replace(/[\s-]/g, '');
	if (!v) return 'Introduce un NIF/NIE/CIF';

	if (/^\d{8}[A-Z]$/.test(v)) {
		const num = parseInt(v.slice(0, 8), 10);
		if (NIF_LETTERS[num % 23] !== v[8]) return 'NIF no válido';
		return null;
	}

	if (/^[XYZ]\d{7}[A-Z]$/.test(v)) {
		const map: Record<string, string> = { X: '0', Y: '1', Z: '2' };
		const num = parseInt(map[v[0]] + v.slice(1, 8), 10);
		if (NIF_LETTERS[num % 23] !== v[8]) return 'NIE no válido';
		return null;
	}

	if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(v)) {
		return validateCif(v);
	}

	return 'Formato de documento no válido';
}

/** Algoritmo de dígito de control CIF (AEAT). */
function validateCif(v: string): string | null {
	const letters = 'JABCDEFGHI';
	const digits = v.slice(1, 8);
	let sumEven = 0;
	let sumOdd = 0;
	for (let i = 0; i < digits.length; i++) {
		const n = parseInt(digits[i], 10);
		if (i % 2 === 0) {
			const d = n * 2;
			sumOdd += Math.floor(d / 10) + (d % 10);
		} else {
			sumEven += n;
		}
	}
	const control = (10 - ((sumEven + sumOdd) % 10)) % 10;
	const last = v[8];
	const org = v[0];
	// Tipos que usan letra de control
	if ('PQRSTW'.includes(org) || ('NP'.includes(org) && /[A-J]/.test(last))) {
		if (letters[control] !== last) return 'CIF no válido';
		return null;
	}
	// Tipos que usan dígito (o aceptan ambos)
	if (/[0-9]/.test(last)) {
		if (String(control) !== last) return 'CIF no válido';
		return null;
	}
	if (letters[control] !== last) return 'CIF no válido';
	return null;
}

export function validateBastidor(value: string): string | null {
	const v = value.trim().toUpperCase();
	if (!v) return 'Introduce el bastidor (VIN)';
	if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) {
		return 'El bastidor debe tener 17 caracteres (sin I, O ni Q)';
	}
	return null;
}

export function validateEmail(value: string): string | null {
	const v = value.trim();
	if (!v) return 'Introduce tu email';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Email no válido';
	return null;
}

/** Acepta móvil 6–9… o fijo 9…; normaliza +34 y espacios. */
export function validatePhone(value: string): string | null {
	const digits = value.replace(/[\s().-]/g, '').replace(/^\+34/, '').replace(/^0034/, '');
	if (!digits) return 'Introduce un teléfono';
	if (!/^[6-9]\d{8}$/.test(digits)) {
		return 'Teléfono no válido (9 dígitos, móvil o fijo español)';
	}
	return null;
}

export function normalizePhone(value: string): string {
	return value.replace(/[\s().-]/g, '').replace(/^\+34/, '').replace(/^0034/, '');
}

export function validateRequired(
	value: string | number | null | undefined,
	label = 'Este campo'
): string | null {
	const v = value == null ? '' : String(value).trim();
	if (!v) return `${label} es obligatorio`;
	return null;
}

export function validateCodigoPostal(value: string): string | null {
	const v = value.trim();
	if (!v) return 'Introduce el código postal';
	if (!/^\d{5}$/.test(v)) return 'Código postal no válido (5 dígitos)';
	const n = parseInt(v, 10);
	if (n < 1000 || n > 52999) return 'Código postal no válido';
	return null;
}

/** Parsea ISO (yyyy-mm-dd) o dd/mm/yyyy → Date local a medianoche, o null. */
export function parseDateInput(value: string): Date | null {
	const v = value.trim();
	if (!v) return null;

	let y: number;
	let m: number;
	let d: number;

	const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
	if (iso) {
		y = Number(iso[1]);
		m = Number(iso[2]);
		d = Number(iso[3]);
	} else {
		const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);
		if (!dmy) return null;
		d = Number(dmy[1]);
		m = Number(dmy[2]);
		y = Number(dmy[3]);
	}

	if (m < 1 || m > 12 || d < 1 || d > 31) return null;
	const date = new Date(y, m - 1, d);
	if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
		return null;
	}
	return date;
}

function startOfToday(): Date {
	const t = new Date();
	return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function toIsoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function todayIso(): string {
	return toIsoDate(startOfToday());
}

export type DateValidationOpts = {
	label?: string;
	required?: boolean;
	/** No permitir fechas posteriores a hoy */
	notFuture?: boolean;
	/** Fecha mínima (inclusive) */
	min?: Date | string | null;
	/** Fecha máxima (inclusive); por defecto hoy si notFuture */
	max?: Date | string | null;
	/** Edad mínima en años (para nacimiento) */
	minAgeYears?: number;
};

export function validateDate(value: string, opts: DateValidationOpts = {}): string | null {
	const label = opts.label || 'La fecha';
	const required = opts.required !== false;
	const v = value.trim();
	if (!v) return required ? `${label} es obligatoria` : null;

	const date = parseDateInput(v);
	if (!date) return `${label} no es válida`;

	const today = startOfToday();
	let max: Date | null = null;
	if (opts.max != null) {
		max = typeof opts.max === 'string' ? parseDateInput(opts.max) : opts.max;
	} else if (opts.notFuture !== false) {
		max = today;
	}
	if (max && date.getTime() > max.getTime()) {
		return opts.notFuture !== false && max.getTime() === today.getTime()
			? `${label} no puede ser futura`
			: `${label} supera el máximo permitido`;
	}

	if (opts.min != null) {
		const min = typeof opts.min === 'string' ? parseDateInput(opts.min) : opts.min;
		if (min && date.getTime() < min.getTime()) {
			return `${label} no puede ser anterior a ${toIsoDate(min)}`;
		}
	}

	if (opts.minAgeYears != null) {
		const limit = new Date(
			today.getFullYear() - opts.minAgeYears,
			today.getMonth(),
			today.getDate()
		);
		if (date.getTime() > limit.getTime()) {
			return `Debes tener al menos ${opts.minAgeYears} años`;
		}
	}

	return null;
}

/** Comprueba orden: fechaA ≤ fechaB (ambas parseables). */
export function validateDateOrder(
	earlier: string,
	later: string,
	msg = 'La fecha de matrícula no puede ser posterior a la de venta'
): string | null {
	const a = parseDateInput(earlier);
	const b = parseDateInput(later);
	if (!a || !b) return null;
	if (a.getTime() > b.getTime()) return msg;
	return null;
}
