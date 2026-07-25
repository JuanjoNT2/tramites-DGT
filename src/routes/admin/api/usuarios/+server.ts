import { json, type RequestHandler } from '@sveltejs/kit';

/** Elevación de roles deshabilitada en web: se hace vía seed/script (service role). */
export const PATCH: RequestHandler = async () => {
	return json(
		{
			error:
				'El cambio de roles no está disponible en la web. Crea gestores/admins con el script de seed o desde Supabase.'
		},
		{ status: 403 }
	);
};
