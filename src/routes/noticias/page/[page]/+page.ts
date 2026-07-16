import { error } from '@sveltejs/kit';
import { getPostsPage } from '$lib/data/posts';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	const { totalPages } = getPostsPage(1);
	return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
		page: String(i + 2)
	}));
};

export const load: PageLoad = ({ params }) => {
	const n = Number(params.page);
	if (!Number.isInteger(n) || n < 2) {
		error(404, 'Página no encontrada');
	}
	const data = getPostsPage(n);
	if (n > data.totalPages) {
		error(404, 'Página no encontrada');
	}
	return data;
};
