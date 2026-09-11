import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { FRECUENCIAS, FRECUENCIA_LABELS, type Frecuencia } from '$lib/proveedor/schedule';
import { getProveedorReportConfig, setProveedorReportConfig } from '$lib/server/proveedor-report';
import { validateEmail } from '$lib/utils/validators';

const FRECUENCIA_OPTIONS = FRECUENCIAS.map((value) => ({
	value,
	label: FRECUENCIA_LABELS[value]
}));

export const load: PageServerLoad = async ({ locals }) => {
	let config = await getProveedorReportConfig();
	return {
		config,
		frecuencias: FRECUENCIA_OPTIONS,
		cuentaEmail: locals.user?.email ?? null
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		const enabled = fd.get('enabled') === 'on';
		const frecuenciaRaw = String(fd.get('frecuencia') || '');
		const email = String(fd.get('email') || '').trim().toLowerCase();

		if (!FRECUENCIAS.includes(frecuenciaRaw as Frecuencia)) {
			return fail(400, { error: 'Frecuencia no válida.' });
		}
		if (email) {
			const err = validateEmail(email);
			if (err) return fail(400, { error: err });
		}

		try {
			await setProveedorReportConfig({
				enabled,
				frecuencia: frecuenciaRaw as Frecuencia,
				email: email || null
			});
			return {
				ok: true as const,
				message: enabled
					? 'Ajustes guardados. El envío automático está activo.'
					: 'Ajustes guardados. El envío automático está desactivado.'
			};
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error al guardar';
			const schema = /does not exist|schema cache|PGRST/i.test(msg)
				? ' Aplica la migración 20260805_site_settings.sql en Supabase.'
				: '';
			return fail(500, { error: msg + schema });
		}
	}
};
