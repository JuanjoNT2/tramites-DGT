import { error } from '@sveltejs/kit';
import { getAllSlugs, getPostBySlug, getRelatedPosts } from '$lib/data/posts';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => getAllSlugs().map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
	const post = getPostBySlug(params.slug);
	if (!post) {
		error(404, 'Artículo no encontrado');
	}
	return {
		post,
		related: getRelatedPosts(post.slug, 3)
	};
};
