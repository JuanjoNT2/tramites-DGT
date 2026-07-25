import { createHmac, createCipheriv } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { siteOrigin } from '$lib/auth/urls';

export type RedsysConfig = {
	merchantCode: string;
	terminal: string;
	secretKey: string;
	env: 'test' | 'live';
};

export type RedsysRedirectPayload = {
	endpoint: string;
	Ds_SignatureVersion: 'HMAC_SHA256_V1';
	Ds_MerchantParameters: string;
	Ds_Signature: string;
	order: string;
};

const TEST_URL = 'https://sis-t.redsys.es:25443/sis/realizarPago';
const LIVE_URL = 'https://sis.redsys.es/sis/realizarPago';

export function getRedsysConfig(): RedsysConfig | null {
	const merchantCode = env.REDSYS_MERCHANT_CODE?.trim();
	const terminal = env.REDSYS_TERMINAL?.trim() || '001';
	const secretKey = env.REDSYS_SECRET_KEY?.trim();
	const redsysEnv = env.REDSYS_ENV?.trim() === 'live' ? 'live' : 'test';
	if (!merchantCode || !secretKey) return null;
	return { merchantCode, terminal, secretKey, env: redsysEnv };
}

export function isRedsysConfigured(): boolean {
	return getRedsysConfig() != null;
}

/** Order Redsys: 4–12 dígitos. */
export function buildRedsysOrder(solicitudId: string): string {
	const digits = solicitudId.replace(/\D/g, '');
	const tail = digits.slice(-8).padStart(8, '0');
	const prefix = String(Date.now()).slice(-4);
	return (prefix + tail).slice(0, 12);
}

function zeroPad(buf: Buffer, block = 8): Buffer {
	const pad = block - (buf.length % block || block);
	if (pad === block) return buf;
	return Buffer.concat([buf, Buffer.alloc(pad, 0)]);
}

/** Clave diversificada por order (3DES CBC, zero-padding, sin PKCS). */
function diversifyKey(order: string, secretKeyB64: string): Buffer {
	let key = Buffer.from(secretKeyB64, 'base64');
	// des-ede3 necesita 24 bytes; claves Redsys suelen ser 16 → expandir
	if (key.length === 16) key = Buffer.concat([key, key.subarray(0, 8)]);
	const iv = Buffer.alloc(8, 0);
	const cipher = createCipheriv('des-ede3-cbc', key, iv);
	cipher.setAutoPadding(false);
	const data = zeroPad(Buffer.from(order, 'utf8'), 8);
	const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
	const len = Math.ceil(order.length / 8) * 8;
	return encrypted.subarray(0, len);
}

function signMerchantParameters(merchantParametersB64: string, order: string, secretKeyB64: string): string {
	const diversified = diversifyKey(order, secretKeyB64);
	return createHmac('sha256', diversified).update(merchantParametersB64).digest('base64');
}

export function createRedsysPayment(opts: {
	solicitudId: string;
	amountEur: number;
	productDescription?: string;
	origin?: string;
}): RedsysRedirectPayload {
	const cfg = getRedsysConfig();
	if (!cfg) throw new Error('Redsys no configurado (faltan REDSYS_*)');

	const amountCents = Math.round(opts.amountEur * 100);
	if (!Number.isFinite(amountCents) || amountCents < 1) {
		throw new Error('Importe inválido');
	}

	const order = buildRedsysOrder(opts.solicitudId);
	const base = (opts.origin || siteOrigin()).replace(/\/$/, '');

	const merchantParams = {
		DS_MERCHANT_AMOUNT: String(amountCents),
		DS_MERCHANT_ORDER: order,
		DS_MERCHANT_MERCHANTCODE: cfg.merchantCode,
		DS_MERCHANT_CURRENCY: '978',
		DS_MERCHANT_TRANSACTIONTYPE: '0',
		DS_MERCHANT_TERMINAL: cfg.terminal,
		DS_MERCHANT_MERCHANTURL: `${base}/api/pago/notificacion`,
		DS_MERCHANT_URLOK: `${base}/pago/ok?solicitud=${encodeURIComponent(opts.solicitudId)}`,
		DS_MERCHANT_URLKO: `${base}/pago/ko?solicitud=${encodeURIComponent(opts.solicitudId)}`,
		DS_MERCHANT_PRODUCTDESCRIPTION: (opts.productDescription || 'Trámite DGT').slice(0, 125),
		DS_MERCHANT_MERCHANTDATA: opts.solicitudId.slice(0, 1024)
	};

	const Ds_MerchantParameters = Buffer.from(JSON.stringify(merchantParams), 'utf8').toString('base64');
	const Ds_Signature = signMerchantParameters(Ds_MerchantParameters, order, cfg.secretKey);

	return {
		endpoint: cfg.env === 'live' ? LIVE_URL : TEST_URL,
		Ds_SignatureVersion: 'HMAC_SHA256_V1',
		Ds_MerchantParameters,
		Ds_Signature,
		order
	};
}

export type RedsysNotification = {
	order: string;
	responseCode: string;
	amount: string;
	solicitudId: string | null;
	authorized: boolean;
	raw: Record<string, unknown>;
};

export function parseRedsysNotification(
	Ds_MerchantParameters: string,
	Ds_Signature: string
): RedsysNotification {
	const cfg = getRedsysConfig();
	if (!cfg) throw new Error('Redsys no configurado');

	const json = Buffer.from(Ds_MerchantParameters, 'base64').toString('utf8');
	const params = JSON.parse(json) as Record<string, unknown>;
	const order = String(params.Ds_Order ?? params.DS_ORDER ?? '');
	const expected = signMerchantParameters(Ds_MerchantParameters, order, cfg.secretKey);

	// Redsys a veces usa URL-safe base64
	const normalize = (s: string) => s.replace(/-/g, '+').replace(/_/g, '/');
	if (normalize(expected) !== normalize(Ds_Signature)) {
		throw new Error('Firma Redsys inválida');
	}

	const responseCode = String(params.Ds_Response ?? params.DS_RESPONSE ?? '9999');
	const codeNum = Number(responseCode);
	const authorized = Number.isFinite(codeNum) && codeNum >= 0 && codeNum <= 99;
	const merchantData = String(params.Ds_MerchantData ?? params.DS_MERCHANTDATA ?? '');

	return {
		order,
		responseCode,
		amount: String(params.Ds_Amount ?? params.DS_AMOUNT ?? ''),
		solicitudId: merchantData || null,
		authorized,
		raw: params
	};
}
