const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function validateNifNie(value: string): string | null {
	const v = value.trim().toUpperCase().replace(/\s/g, '');
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

	if (/^[A-HJ-NP-SUW]\d{7}[0-9A-J]$/.test(v) || /^[A-HJ-NP-SUW]\d{8}$/.test(v)) {
		return null;
	}

	return 'Formato de documento no válido';
}

export function validateMatricula(value: string): string | null {
	const v = value.trim().toUpperCase().replace(/[\s-]/g, '');
	if (!v) return 'Introduce la matrícula';
	if (/^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/.test(v)) return null;
	if (/^[BCDFGHJKLMNPRSTVWXYZ]{1,2}\d{4}[BCDFGHJKLMNPRSTVWXYZ]{2}$/.test(v)) return null;
	return 'Matrícula no válida';
}

export function validateBastidor(value: string): string | null {
	const v = value.trim().toUpperCase();
	if (!v) return 'Introduce el bastidor (VIN)';
	if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) return 'El bastidor debe tener 17 caracteres';
	return null;
}

export function validateEmail(value: string): string | null {
	const v = value.trim();
	if (!v) return 'Introduce tu email';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email no válido';
	return null;
}

export function validatePhone(value: string): string | null {
	const v = value.replace(/\s/g, '');
	if (!v) return 'Introduce un teléfono';
	if (!/^[6-9]\d{8}$/.test(v)) return 'Teléfono móvil no válido (9 dígitos)';
	return null;
}

export function validateRequired(value: string | number | null | undefined, label = 'Este campo'): string | null {
	const v = value == null ? '' : String(value).trim();
	if (!v) return `${label} es obligatorio`;
	return null;
}
