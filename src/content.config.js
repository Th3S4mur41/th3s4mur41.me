// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

// 3. Define shared schema for contact cards and employee profiles
const blogSchema = z.object({
	title: z.string(),
	eyebrow: z.string().optional(),
	type: z.enum(["blog"]).optional().default("blog"),
	date: z.date(),
	updated: z.date().optional(),
	image: z.string().optional(),
	imageAlt: z.string().optional(),
	published: z.boolean().optional().default(true),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	keywords: z.array(z.string()).optional(),
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
	reactions: z
		.array(z.union([z.object({ bluesky: z.string().url() }), z.object({ mastodon: z.string().url() })]))
		.optional(),
});

const talksSchema = z.object({
	title: z.string(),
	type: z.enum(["podcast", "conference"]),
	date: z.date(),
	updated: z.date().optional(),
	image: z.string().optional(),
	imageAlt: z.string().optional(),
	published: z.boolean().optional().default(true),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	keywords: z.array(z.string()).optional(),
	canonical: z.string().optional(),
	// Optional override for content published/hosted elsewhere.
	publisherName: z.string().optional(),
	publisherUrl: z.string().url().optional(),
	reactions: z
		.array(z.union([z.object({ bluesky: z.string().url() }), z.object({ mastodon: z.string().url() })]))
		.optional(),
});

// 4. Define your collection(s)
const blog = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
	schema: blogSchema,
});

const talks = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/talks" }),
	schema: talksSchema,
});

// 5. Export a single `collections` object to register your collection(s)
export const collections = { blog, talks };
