import {
	validateBastidor,
	validateCodigoPostal,
	validateDate,
	validateDateOrder,
	validateEmail,
	validateMatricula,
	validateNifNie,
	validatePhone,
	validateRequired
} from '$lib/utils/validators';

export type SolicitudValidationResult =
	| { ok: true; email: string | null; amount: number | null }
	| { ok: false; error: string };

function str(v: unknown): string {
	return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function num(v: unknown): number {
	const n = Number(v);
	return Number.isFinite(n) ? n : NaN;
}

function firstError(...errs: (string | null | undefined)[]): string | null {
	for (const e of errs) {
		if (e) return e;
	}
	return null;
}

/** Validación mínima por tipo antes de persistir la solicitud. */
export function validateSolicitudPayload(
	tipo: string,
	body: Record<string, unknown>
): SolicitudValidationResult {
	const email = str(body.email).trim().toLowerCase() || null;
	if (email) {
		const e = validateEmail(email);
		if (e) return { ok: false, error: e };
	}

	const amountRaw = num(body.amount ?? body.total);
	const amount = Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw : null;

	if (tipo === 'contacto') {
		const err = firstError(
			validateRequired(str(body.nombre), 'El nombre'),
			email ? null : 'El email es obligatorio',
			validateRequired(str(body.mensaje || body.message), 'El mensaje')
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email, amount };
	}

	if (tipo === 'transferencia') {
		const fechaMatricula = str(body.fechaMatricula);
		const fechaVenta = str(body.fechaVenta);
		const err = firstError(
			validateMatricula(str(body.matricula)),
			validateBastidor(str(body.bastidor)),
			validateDate(fechaMatricula, { label: 'La fecha de primera matrícula', notFuture: true }),
			validateDate(fechaVenta, { label: 'La fecha de venta', notFuture: true }),
			validateDateOrder(
				fechaMatricula,
				fechaVenta,
				'La fecha de matrícula no puede ser posterior a la de venta'
			),
			validateRequired(str(body.ccaaId), 'La comunidad autónoma'),
			!(num(body.precioVenta) > 0) ? 'Indica un precio de venta mayor que 0' : null,
			validateEmail(str(body.email)),
			validateNifNie(str(body.nif)),
			validateRequired(str(body.nombre), 'El nombre'),
			validatePhone(str(body.telefono)),
			validateCodigoPostal(str(body.cp)),
			amount == null ? 'Importe no válido' : null
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email, amount };
	}

	if (tipo === 'etiqueta-vmp' || tipo === 'vmp') {
		const certificado = str(body.vmpCertificado) !== 'no';
		const err = firstError(
			validateRequired(str(body.vmpNumSerie), 'El número de serie'),
			validateRequired(str(body.vmpMarca), 'La marca'),
			certificado ? validateRequired(str(body.vmpModelo), 'El modelo') : null,
			certificado ? validateRequired(str(body.vmpNumCertificado), 'El número de certificado') : null,
			validateEmail(str(body.email)),
			validateNifNie(str(body.nif)),
			validatePhone(str(body.telefono)),
			validateCodigoPostal(str(body.cp)),
			amount == null ? 'Importe no válido' : null
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email, amount };
	}

	if (tipo === 'duplicado-carnet' || tipo === 'duplicado') {
		const err = firstError(
			validateRequired(str(body.motivoDuplicado), 'El motivo'),
			validateEmail(str(body.email)),
			validateNifNie(str(body.nif)),
			validatePhone(str(body.telefono)),
			validateDate(str(body.fechaNacimiento), {
				label: 'La fecha de nacimiento',
				notFuture: true,
				minAgeYears: 16
			}),
			validateCodigoPostal(str(body.cp)),
			amount == null ? 'Importe no válido' : null
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email, amount };
	}

	// etiqueta, informe-dgt, cancelacion-reserva y genéricos con matrícula
	if (
		tipo === 'etiqueta' ||
		tipo === 'informe-dgt' ||
		tipo === 'informe' ||
		tipo === 'cancelacion-reserva' ||
		tipo === 'cancelacion'
	) {
		const err = firstError(
			validateMatricula(str(body.matricula)),
			validateEmail(str(body.email)),
			validateNifNie(str(body.nif)),
			validatePhone(str(body.telefono)),
			body.cp ? validateCodigoPostal(str(body.cp)) : null,
			amount == null ? 'Importe no válido' : null
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email, amount };
	}

	// Tipos desconocidos: exigir email si hay importe, o al menos tipo
	if (!tipo || tipo === 'desconocido') {
		return { ok: false, error: 'Tipo de trámite no válido' };
	}

	return { ok: true, email, amount };
}
