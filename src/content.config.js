// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

const CONTENT_BASE = "./content";

// 3. Import reading-time computation
import { computeReadingTime } from "./utils/readingTime.js";

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
		tags: z.array(z.string()).optional(),
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
		tags: z.array(z.string()).optional(),
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

			for (const [id, entry] of context.store.entries()) {
				if (entry?.data?.readingTime) continue;
				const computed = computeReadingTime(entry?.body);
				if (!computed) continue;
				// Drop digest so DataStore.set does not short-circuit unchanged entries;
				// we are intentionally mutating entry.data by adding readingTime.
				const { digest: _digest, ...entryWithoutDigest } = entry;

				context.store.set({
					...entryWithoutDigest,
					id,
					data: {
						...entry.data,
						readingTime: computed,
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
