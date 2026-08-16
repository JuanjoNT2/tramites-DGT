import {
	isCifDocumento,
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
import { resolveCanonicalAmount } from '$lib/server/solicitud-price';
import { SOLICITUD_TIPOS } from '$lib/supabase/types';

export type SolicitudValidationResult =
	| { ok: true; email: string | null; amount: number | null }
	| { ok: false; error: string };

const ALLOWED_TIPOS = new Set<string>([
	...SOLICITUD_TIPOS,
	'vmp',
	'informe',
	'duplicado',
	'cancelacion'
]);

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

function personNameErrors(nif: string, nombre: string, apellido1: string): string | null {
	const nameErr = validateRequired(nombre, isCifDocumento(nif) ? 'La razón social' : 'El nombre');
	if (nameErr) return nameErr;
	if (isCifDocumento(nif)) return null;
	return firstError(validateRequired(apellido1, 'El primer apellido'));
}

/** Validación de campos (síncrona). El importe se resuelve aparte. */
export function validateSolicitudFields(
	tipo: string,
	body: Record<string, unknown>
): { ok: true; email: string | null } | { ok: false; error: string } {
	if (!tipo || !ALLOWED_TIPOS.has(tipo)) {
		return { ok: false, error: 'Tipo de trámite no válido' };
	}

	const email = str(body.email).trim().toLowerCase() || null;
	if (email) {
		const e = validateEmail(email);
		if (e) return { ok: false, error: e };
	}

	if (tipo === 'contacto') {
		const err = firstError(
			validateRequired(str(body.nombre), 'El nombre'),
			email ? null : 'El email es obligatorio',
			validateRequired(str(body.mensaje || body.message), 'El mensaje'),
			body.acceptPrivacy === true || body.acceptPrivacy === 'si'
				? null
				: 'Debes aceptar la política de privacidad'
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email };
	}

	if (tipo === 'transferencia') {
		const fechaMatricula = str(body.fechaMatricula);
		const fechaVenta = str(body.fechaVenta);
		const nif = str(body.nif || body.compradorNif || body.vendedorNif);
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
			validateEmail(str(body.email || body.compradorEmail || body.vendedorEmail)),
			validateNifNie(nif),
			personNameErrors(
				nif,
				str(body.nombre || body.compradorNombre || body.vendedorNombre),
				str(body.apellido1 || body.compradorApellido1 || body.vendedorApellido1)
			),
			validatePhone(str(body.telefono || body.compradorTelefono || body.vendedorTelefono)),
			validateNifNie(str(body.compradorNif)),
			validateNifNie(str(body.vendedorNif)),
			validateCodigoPostal(str(body.cp || body.compradorCp || body.vendedorCp))
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email };
	}

	if (tipo === 'etiqueta-vmp' || tipo === 'vmp') {
		const certificado = str(body.vmpCertificado) !== 'no';
		const nif = str(body.nif);
		const err = firstError(
			validateRequired(str(body.vmpNumSerie), 'El número de serie'),
			validateRequired(str(body.vmpMarca), 'La marca'),
			certificado ? validateRequired(str(body.vmpModelo), 'El modelo') : null,
			certificado ? validateRequired(str(body.vmpNumCertificado), 'El número de certificado') : null,
			validateEmail(str(body.email)),
			validateNifNie(nif),
			personNameErrors(nif, str(body.nombre), str(body.apellido1)),
			validatePhone(str(body.telefono)),
			validateCodigoPostal(str(body.cp))
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email };
	}

	if (tipo === 'duplicado-carnet' || tipo === 'duplicado') {
		const nif = str(body.nif);
		const empresa = isCifDocumento(nif);
		const err = firstError(
			validateRequired(str(body.motivoDuplicado), 'El motivo'),
			validateMatricula(str(body.matricula)),
			validateEmail(str(body.email)),
			validateNifNie(nif),
			personNameErrors(nif, str(body.nombre), str(body.apellido1)),
			validatePhone(str(body.telefono)),
			empresa
				? null
				: validateDate(str(body.fechaNacimiento), {
						label: 'La fecha de nacimiento',
						notFuture: true,
						minAgeYears: 16
					}),
			validateCodigoPostal(str(body.cp))
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email };
	}

	if (tipo === 'notificacion-venta') {
		const nif = str(body.nif || body.vendedorNif || body.compradorNif);
		const err = firstError(
			validateMatricula(str(body.matricula)),
			validateEmail(str(body.email || body.vendedorEmail || body.compradorEmail)),
			validateNifNie(nif),
			personNameErrors(
				nif,
				str(body.nombre || body.vendedorNombre || body.compradorNombre),
				str(body.apellido1 || body.vendedorApellido1 || body.compradorApellido1)
			),
			validatePhone(str(body.telefono || body.vendedorTelefono || body.compradorTelefono)),
			validateNifNie(str(body.compradorNif)),
			validateNifNie(str(body.vendedorNif)),
			validateCodigoPostal(str(body.cp || body.vendedorCp || body.compradorCp))
		);
		if (err) return { ok: false, error: err };
		return {
			ok: true,
			email: email || str(body.vendedorEmail || body.compradorEmail).trim().toLowerCase() || null
		};
	}

	if (
		tipo === 'etiqueta' ||
		tipo === 'informe-dgt' ||
		tipo === 'informe' ||
		tipo === 'nota-simple' ||
		tipo === 'baja-temporal' ||
		tipo === 'cancelacion-reserva' ||
		tipo === 'cancelacion'
	) {
		const nif = str(body.nif);
		const empresa = isCifDocumento(nif);
		const err = firstError(
			validateMatricula(str(body.matricula)),
			body.bastidor ? validateBastidor(str(body.bastidor)) : null,
			validateEmail(str(body.email)),
			validateNifNie(nif),
			personNameErrors(nif, str(body.nombre), str(body.apellido1)),
			validatePhone(str(body.telefono)),
			validateCodigoPostal(str(body.cp)),
			empresa
				? null
				: tipo === 'cancelacion' || tipo === 'cancelacion-reserva'
					? null
					: validateDate(str(body.fechaNacimiento), {
							label: 'La fecha de nacimiento',
							notFuture: true,
							minAgeYears: 16,
							required: false
						})
		);
		if (err) return { ok: false, error: err };
		return { ok: true, email };
	}

	return { ok: false, error: 'Tipo de trámite no válido' };
}

/** Validación + importe canónico (el amount del cliente se ignora). */
export async function validateSolicitudPayload(
	tipo: string,
	body: Record<string, unknown>
): Promise<SolicitudValidationResult> {
	const fields = validateSolicitudFields(tipo, body);
	if (!fields.ok) return fields;
	const priced = await resolveCanonicalAmount(tipo, body);
	if (!priced.ok) return priced;
	return { ok: true, email: fields.email, amount: priced.amount };
}
