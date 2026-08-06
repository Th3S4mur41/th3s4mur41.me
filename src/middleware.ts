import { getCollection } from "astro:content";
import { defineMiddleware } from "astro:middleware";
import { normalizeEntryId } from "./utils/contentSeries";

type CollectionsCache = {
	blog: Awaited<ReturnType<typeof getCollection<"blog">>>;
	speaking: Awaited<ReturnType<typeof getCollection<"speaking">>>;
	notes: Awaited<ReturnType<typeof getCollection<"notes">>>;
};

// Populated once per build; avoids redundant collection fetches across static pages.
let collectionsCache: CollectionsCache | null = null;

async function getCollections(): Promise<CollectionsCache> {
	// In dev, avoid long-lived caching so HMR/content edits are reflected without restarting.
	if (import.meta.env.DEV) {
		const [blog, speaking, notes] = await Promise.all([
			getCollection("blog"),
			getCollection("speaking"),
			getCollection("notes"),
		]);
		return { blog, speaking, notes };
	}

	if (collectionsCache) return collectionsCache;
	const [blog, speaking, notes] = await Promise.all([
		getCollection("blog"),
		getCollection("speaking"),
		getCollection("notes"),
	]);
	collectionsCache = { blog, speaking, notes };
	return collectionsCache;
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	// Only run for content section URLs; everything else gets no ogData and falls back to layout defaults.
	const match = pathname.match(/^\/(blog|speaking|notes)\//);

	if (match) {
		const section = match[1] as keyof CollectionsCache;
		// Strip leading section prefix and trailing slash to get the normalised entry slug.
		const slug = pathname.replace(`/${section}/`, "").replace(/\/$/, "");

		try {
			const collections = await getCollections();
			const entries = collections[section];
			const entry = entries.find((e) => normalizeEntryId(e.id) === slug);

			if (entry?.data) {
				const d = entry.data as Record<string, unknown>;
				context.locals.ogData = {
					type: "article",
					// Full untruncated title; OpenGraph prefers this over the `<title>`-optimised prop.
					title: typeof d.title === "string" ? d.title.trim() : undefined,
					publishedTime: d.date instanceof Date ? d.date : undefined,
					modifiedTime: d.updated instanceof Date ? d.updated : undefined,
					author: `${context.url.origin}/about/`,
					section: `${section.charAt(0).toUpperCase()}${section.slice(1)}`,
					tags: Array.isArray(d.tags) ? (d.tags as string[]) : undefined,
				};
			}
		} catch {
			// Non-fatal: OG data falls back to layout defaults.
		}
	}

	return next();
});
