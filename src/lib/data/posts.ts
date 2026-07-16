import postsJson from './posts.json';

export type PostBlock = {
	type: 'h2' | 'h3' | 'p';
	text: string;
};

export type Post = {
	slug: string;
	title: string;
	excerpt: string;
	description: string;
	date: string;
	datetime: string;
	image: string;
	blocks: PostBlock[];
};

export const posts = postsJson as Post[];

const POSTS_PER_PAGE = 9;

export function getPostBySlug(slug: string): Post | undefined {
	return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
	return posts.map((p) => p.slug);
}

export function getRelatedPosts(slug: string, limit = 3): Post[] {
	return posts.filter((p) => p.slug !== slug).slice(0, limit);
}

export function getPostsPage(page: number): {
	items: Post[];
	page: number;
	totalPages: number;
	total: number;
} {
	const total = posts.length;
	const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const start = (safePage - 1) * POSTS_PER_PAGE;
	return {
		items: posts.slice(start, start + POSTS_PER_PAGE),
		page: safePage,
		totalPages,
		total
	};
}

export { POSTS_PER_PAGE };
