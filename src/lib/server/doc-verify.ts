import { env } from '$env/dynamic/private';

export type ExpectedDocKind =
	| 'id_front'
	| 'id_back'
	| 'permiso_circulacion'
	| 'ficha_tecnica'
	| 'permiso_conducir'
	| 'carta_cancelacion'
	| 'foto_vehiculo'
	| 'ficha_vmp'
	| 'denuncia'
	| 'other';

const SLOT_TO_KIND: Record<string, ExpectedDocKind> = {
	solicitante_nif_frontal: 'id_front',
	solicitante_nif_trasero: 'id_back',
	otra_parte_nif_frontal: 'id_front',
	otra_parte_nif_trasero: 'id_back',
	propietario_nif_frontal: 'id_front',
	propietario_nif_trasero: 'id_back',
	comprador_nif_frontal: 'id_front',
	comprador_nif_trasero: 'id_back',
	vendedor_nif_frontal: 'id_front',
	vendedor_nif_trasero: 'id_back',
	titular_nif_frontal: 'id_front',
	titular_nif_trasero: 'id_back',
	permiso_circulacion: 'permiso_circulacion',
	ficha_tecnica: 'ficha_tecnica',
	ficha_tecnica_frontal: 'ficha_tecnica',
	ficha_tecnica_trasera: 'ficha_tecnica',
	foto_permiso: 'permiso_circulacion',
	carta_cancelacion: 'carta_cancelacion',
	contrato_compraventa: 'other',
	ficha_vmp: 'ficha_vmp',
	foto_vehiculo: 'foto_vehiculo',
	foto_bastidor: 'ficha_vmp',
	denuncia_justificante: 'denuncia'
};

const KIND_LABELS: Record<ExpectedDocKind, string> = {
	id_front: 'DNI/NIE/CIF (anverso)',
	id_back: 'DNI/NIE/CIF (reverso)',
	permiso_circulacion: 'permiso de circulación',
	ficha_tecnica: 'ficha técnica del vehículo',
	permiso_conducir: 'permiso de conducir',
	carta_cancelacion: 'carta de cancelación / fin de pago',
	foto_vehiculo: 'foto del vehículo',
	ficha_vmp: 'ficha o placa identificativa del VMP',
	denuncia: 'denuncia o justificante de extravío',
	other: 'documento del trámite'
};

export function resolveExpectedDocKind(docType: string): ExpectedDocKind {
	if (SLOT_TO_KIND[docType]) return SLOT_TO_KIND[docType];
	if (docType.includes('nif_frontal') || docType.includes('dni_front')) return 'id_front';
	if (docType.includes('nif_trasero') || docType.includes('dni_back')) return 'id_back';
	if (docType.includes('permiso_circulacion')) return 'permiso_circulacion';
	if (docType.includes('ficha')) return 'ficha_tecnica';
	if (docType.includes('permiso') || docType.includes('carnet')) return 'permiso_conducir';
	return 'other';
}

export type DocVerifyResult = {
	ok: boolean;
	expected: ExpectedDocKind;
	detected: string | null;
	confidence: number;
	message: string | null;
	skipped?: boolean;
};

function isVerifyEnabled(): boolean {
	const flag = env.DOC_VERIFY_ENABLED?.trim().toLowerCase();
	if (flag === '0' || flag === 'false' || flag === 'off') return false;
	return Boolean(env.OPENAI_API_KEY?.trim() || env.DOC_VERIFY_API_KEY?.trim());
}

function apiKey(): string | null {
	return env.OPENAI_API_KEY?.trim() || env.DOC_VERIFY_API_KEY?.trim() || null;
}

/** Clasifica la imagen y comprueba que coincida con el slot esperado. */
export async function verifyDocumentUpload(opts: {
	docType: string;
	mime: string;
	bytes: ArrayBuffer;
	filename: string;
}): Promise<DocVerifyResult> {
	const expected = resolveExpectedDocKind(opts.docType);

	if (!isVerifyEnabled()) {
		return {
			ok: true,
			expected,
			detected: null,
			confidence: 0,
			message: null,
			skipped: true
		};
	}

	if (opts.mime === 'application/pdf' || opts.filename.toLowerCase().endsWith('.pdf')) {
		// PDF: no clasificamos páginas aquí; se acepta y el gestor revisa.
		return {
			ok: true,
			expected,
			detected: 'pdf',
			confidence: 0.5,
			message: null,
			skipped: true
		};
	}

	if (!opts.mime.startsWith('image/')) {
		return {
			ok: false,
			expected,
			detected: null,
			confidence: 0,
			message: 'El archivo debe ser una imagen (JPG/PNG/WebP) o PDF.'
		};
	}

	const key = apiKey();
	if (!key) {
		return { ok: true, expected, detected: null, confidence: 0, message: null, skipped: true };
	}

	const b64 = Buffer.from(opts.bytes).toString('base64');
	const dataUrl = `data:${opts.mime};base64,${b64}`;
	const expectedLabel = KIND_LABELS[expected];

	const prompt = `Eres un verificador de documentos españoles para trámites DGT.
El usuario debía subir: "${expectedLabel}" (código interno: ${expected}).
Analiza la imagen y responde SOLO JSON válido:
{"detected":"<una de: id_front|id_back|permiso_circulacion|ficha_tecnica|permiso_conducir|carta_cancelacion|foto_vehiculo|ficha_vmp|denuncia|other|random>","confidence":0.0,"match":true|false,"reason":"breve"}
- id_front / id_back: DNI, NIE o CIF español (anverso/reverso).
- permiso_circulacion: permiso de circulación de vehículo.
- ficha_tecnica: tarjeta ITV / ficha técnica.
- permiso_conducir: carnet de conducir.
- carta_cancelacion: carta bancaria de fin de pago / cancelación reserva.
- foto_vehiculo: foto de coche/moto/patinete.
- ficha_vmp: placa o ficha de patinete.
- denuncia: denuncia policial o justificante.
- random: selfie, paisaje, captura de pantalla irrelevante, etc.
match=true solo si la imagen corresponde claramente a lo esperado.`;

	try {
		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: env.DOC_VERIFY_MODEL?.trim() || 'gpt-4o-mini',
				temperature: 0,
				response_format: { type: 'json_object' },
				messages: [
					{
						role: 'user',
						content: [
							{ type: 'text', text: prompt },
							{ type: 'image_url', image_url: { url: dataUrl, detail: 'low' } }
						]
					}
				]
			})
		});

		if (!res.ok) {
			const errText = await res.text().catch(() => '');
			console.error('[doc-verify] openai', res.status, errText.slice(0, 300));
			// No bloqueamos el trámite si el proveedor falla
			return { ok: true, expected, detected: null, confidence: 0, message: null, skipped: true };
		}

		const data = (await res.json()) as {
			choices?: { message?: { content?: string } }[];
		};
		const raw = data.choices?.[0]?.message?.content || '{}';
		let parsed: { detected?: string; confidence?: number; match?: boolean; reason?: string };
		try {
			parsed = JSON.parse(raw);
		} catch {
			return { ok: true, expected, detected: null, confidence: 0, message: null, skipped: true };
		}

		const detected = String(parsed.detected || 'other');
		const confidence = Number(parsed.confidence) || 0;
		const match =
			parsed.match === true ||
			detected === expected ||
			(expected === 'id_front' && detected === 'id_front') ||
			(expected === 'id_back' && detected === 'id_back');

		if (!match || detected === 'random' || confidence < 0.45) {
			return {
				ok: false,
				expected,
				detected,
				confidence,
				message:
					parsed.reason?.trim() ||
					`La imagen no parece un ${expectedLabel}. Vuelve a fotografiar el documento completo, bien enfocado y sobre fondo claro.`
			};
		}

		return {
			ok: true,
			expected,
			detected,
			confidence,
			message: null
		};
	} catch (e) {
		console.error('[doc-verify]', e);
		return { ok: true, expected, detected: null, confidence: 0, message: null, skipped: true };
	}
}
