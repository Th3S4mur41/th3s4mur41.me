// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

// 3. Define shared schema for contact cards and employee profiles
const blogSchema = z.object({
	title: z.string(),
	type: z.enum(["blog"]).optional().default("blog"),
	date: z.date(),
	updated: z.date().optional(),
	image: z.string().optional(),
	published: z.boolean().optional().default(false),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	keywords: z.array(z.string()).optional(),
	canonical: z.string().optional(),
});

const talksSchema = z.object({
	title: z.string(),
	type: z.enum(["podcast", "conference"]),
	date: z.date(),
	updated: z.date().optional(),
	image: z.string().optional(),
	published: z.boolean().optional().default(false),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	keywords: z.array(z.string()).optional(),
	canonical: z.string().optional(),
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
