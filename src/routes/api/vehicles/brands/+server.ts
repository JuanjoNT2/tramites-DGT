import { json } from '@sveltejs/kit';
import { listBrands } from '$lib/server/vehicles-catalog';

export function GET() {
	return json({ brands: listBrands() });
}
