import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export function getResendClient(): Resend | null {
	const key = env.RESEND_API_KEY;
	if (!key) return null;
	return new Resend(key);
}

export function resendFromEmail(): string {
	return env.RESEND_FROM_EMAIL || 'noreply@tramitesdgtonline.com';
}

export function siteOrigin(): string {
	return (publicEnv.PUBLIC_SITE_ORIGIN || 'https://tramitesdgtonline.com').replace(/\/$/, '');
}

export async function sendVerificationReminder(to: string, confirmUrl: string): Promise<boolean> {
	const resend = getResendClient();
	if (!resend) return false;
	const { error } = await resend.emails.send({
		from: resendFromEmail(),
		to,
		subject: 'Verifica tu cuenta — Trámites DGT Online',
		html: `
			<p>Hola,</p>
			<p>Para activar tu cuenta en Trámites DGT Online, confirma tu email:</p>
			<p><a href="${confirmUrl}">Verificar email</a></p>
			<p>Si no creaste esta cuenta, ignora este mensaje.</p>
		`
	});
	return !error;
}
