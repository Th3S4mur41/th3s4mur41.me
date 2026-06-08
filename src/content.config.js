// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

import { SITE_CONFIG } from "./utils/config.js";
// 3. Import reading-time computation
import { computeReadingTime } from "./utils/readingTime.js";
import { toSiteStandardDocumentUri } from "./utils/siteStandard.js";
import { ALLOWED_TAGS } from "./utils/tags.js";

const CONTENT_BASE = "./content";

// 4. Define schema for blog content collection entries
const blogSchema = ({ image }) =>
	z.object({
		title: z.string(),
		eyebrow: z.string().optional(),
		type: z.enum(["blog"]).optional().default("blog"),
		date: z.date(),
		updated: z.date().optional(),
		image: image().optional(),
		imageAlt: z.string().optional(),
		published: z.boolean().optional().default(true),
		description: z.string().optional(),
		tags: z.array(z.enum(ALLOWED_TAGS)).optional(),
		keywords: z.array(z.string()).optional(),
		readingTime: z
			.object({
				text: z.string(),
				minutes: z.number(),
				time: z.number(),
				words: z.number(),
			})
			.optional(),
		canonical: z.string().optional(),
		translations: z
			.array(
				z.object({
					language: z.string(),
					headline: z.string().optional(),
					url: z.string().url(),
					publisherName: z.string().optional(),
					publisherUrl: z.string().url().optional(),
				}),
			)
			.optional(),
		syndication: z.array(z.string().url()).optional(),
		coauthors: z
			.array(
				z.object({
					name: z.string(),
					url: z.string().url().optional(),
				}),
			)
			.optional(),
		siteStandardDocumentUri: z.string().optional(),
		reactions: z.boolean().optional().default(true),
	});

const speakingSchema = ({ image }) =>
	z.object({
		title: z.string(),
		type: z.enum(["podcast", "conference", "workshop"]),
		date: z.date(),
		updated: z.date().optional(),
		image: image().optional(),
		imageAlt: z.string().optional(),
		published: z.boolean().optional().default(true),
		description: z.string().optional(),
		tags: z.array(z.enum(ALLOWED_TAGS)).optional(),
		keywords: z.array(z.string()).optional(),
		canonical: z.string().optional(),
		// Optional override for content published/hosted elsewhere.
		publisherName: z.string().optional(),
		publisherUrl: z.string().url().optional(),
		syndication: z.array(z.string().url()).optional(),
		reactions: z.boolean().optional().default(true),
	});

// 5. Create a custom loader wrapper that computes reading-time for collection entries
function createLoaderWithReadingTime(baseLoader) {
	return {
		name: `${baseLoader.name}-with-reading-time`,
		load: async (context) => {
			await baseLoader.load(context);
			const atprotoDid = SITE_CONFIG.atproto?.did;

			for (const [id, entry] of context.store.entries()) {
				const computedReadingTime = entry?.data?.readingTime ?? computeReadingTime(entry?.body);
				const computedDocumentUri = atprotoDid ? toSiteStandardDocumentUri(atprotoDid, id) : undefined;

				const shouldSetReadingTime = !entry?.data?.readingTime && Boolean(computedReadingTime);
				const shouldSetDocumentUri = Boolean(
					computedDocumentUri && entry?.data?.siteStandardDocumentUri !== computedDocumentUri,
				);

				if (!shouldSetReadingTime && !shouldSetDocumentUri) continue;

				// Drop digest so DataStore.set does not short-circuit unchanged entries;
				// we are intentionally mutating derived entry fields.
				const { digest: _digest, ...entryWithoutDigest } = entry;

				context.store.set({
					...entryWithoutDigest,
					id,
					data: {
						...entry.data,
						...(shouldSetReadingTime ? { readingTime: computedReadingTime } : {}),
						...(shouldSetDocumentUri ? { siteStandardDocumentUri: computedDocumentUri } : {}),
					},
				});
			}
		},
	};
}

// 6. Define your collection(s)
const blog = defineCollection({
	loader: createLoaderWithReadingTime(glob({ pattern: "**/*.{md,mdx}", base: `${CONTENT_BASE}/blog` })),
	schema: blogSchema,
});

const speaking = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: `${CONTENT_BASE}/speaking` }),
	schema: speakingSchema,
});

// 7. Export a single `collections` object to register your collection(s)
export const collections = { blog, speaking };
