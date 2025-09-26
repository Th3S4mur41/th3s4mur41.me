import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Define shared schema for contact cards and employee profiles
const blogSchema = z.object({
	title: z.string(),
	date: z.date(),
	updated: z.date().optional(),
	image: z.string().optional(),
	published: z.boolean().optional().default(false),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	keywords: z.array(z.string()).optional(),
	canonical: z.string().optional(),
});

// Define your collection(s)
const blog = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
	schema: blogSchema,
});

// Export a single `collections` object to register your collection(s)
export const collections = { blog };
