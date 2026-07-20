import { POSTS_PER_PAGE, posts } from '$lib/data/posts';
import { STATIC_SEO_PAGES, canonical } from '$lib/seo/site';

export type SitemapEntry = {
	loc: string;
	changefreq: string;
	priority: string;
};

export function buildSitemapEntries(): SitemapEntry[] {
	const entries: SitemapEntry[] = STATIC_SEO_PAGES.map((p) => ({
		loc: canonical(p.path),
		changefreq: p.changefreq ?? 'monthly',
		priority: String(p.priority ?? 0.5)
	}));

	const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
	for (let page = 2; page <= totalPages; page++) {
		entries.push({
			loc: canonical(`/noticias/page/${page}`),
			changefreq: 'daily',
			priority: '0.5'
		});
	}

	for (const post of posts) {
		entries.push({
			loc: canonical(`/${post.slug}`),
			changefreq: 'monthly',
			priority: '0.6'
		});
	}

	return entries;
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
	const body = entries
		.map(
			(e) => `  <url>
    <loc>${e.loc}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
		)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}
