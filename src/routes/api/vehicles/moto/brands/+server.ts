import { json } from '@sveltejs/kit';
import { listMotoBrands } from '$lib/server/vehicles-catalog';

export function GET() {
	return json({ brands: listMotoBrands() });
}
