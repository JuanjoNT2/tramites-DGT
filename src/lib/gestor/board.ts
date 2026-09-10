/** Columnas del tablero: por hacer, en curso, finalizados. */
export type TramiteBucket = 'por_hacer' | 'en_curso' | 'hecho';

export function classifyTramiteBucket(status: string): TramiteBucket {
	if (status === 'en_curso') return 'en_curso';
	if (status === 'realizada' || status === 'cancelada') return 'hecho';
	return 'por_hacer';
}

/** Estado que se aplica al soltar una tarjeta en cada columna. */
export const BUCKET_DEFAULT_STATUS: Record<TramiteBucket, string> = {
	por_hacer: 'nueva',
	en_curso: 'en_curso',
	hecho: 'realizada'
};

export const BUCKET_LABELS: Record<TramiteBucket, string> = {
	por_hacer: 'Por hacer',
	en_curso: 'En curso',
	hecho: 'Finalizados'
};

/** Máximo de tarjetas por columna; el resto se consulta en modo lista. */
export const KANBAN_COLUMN_LIMIT = 60;
