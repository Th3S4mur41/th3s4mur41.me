import { getImage } from "astro:assets";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

// Eagerly import all content images so they can be resolved to processed asset URLs.
export const blogImages = import.meta.glob("/src/content/blog/**/*.{jpg,jpeg,png,webp,gif}", { eager: true });
export const talksImages = import.meta.glob("/src/content/talks/**/*.{jpg,jpeg,png,webp,gif}", { eager: true });

const IMAGE_POOLS = { blog: blogImages, talks: talksImages };

/** Return the imported image module (default export) for a given section/entry/filename, or null. */
export function getImageModule(section, entryId, filename) {
	if (!filename) return null;
	const pool = IMAGE_POOLS[section];
	const cleaned = filename.replace(/^\.\//, "");
	const candidates = cleaned.startsWith("/")
		? [cleaned]
		: [`/src/content/${section}/${entryId}/${cleaned}`, `/src/content/${section}/${cleaned}`];
	for (const candidate of candidates) {
		const mod = pool[candidate];
		if (mod?.default) return mod.default;
	}
	return null;
}

/** Resolve hero image to an absolute URL via Astro's asset pipeline. */
export async function getHeroImageUrl(section, entryId, filename, site) {
	const imgModule = getImageModule(section, entryId, filename);
	if (!imgModule) return null;
	const img = await getImage({ src: imgModule, width: 1200, height: 630, format: "jpeg" });
	return new URL(img.src, site).href;
}

/** Rehype plugin that rewrites relative <img src> values to absolute URLs. */
export function makeImagesAbsolute(articleUrl) {
	return () => (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName === "img" && node.properties?.src) {
				const src = String(node.properties.src);
				if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("//")) {
					try {
						node.properties.src = new URL(src, articleUrl).href;
					} catch {
						// Ignore unparseable src values.
					}
				}
			}
		});
	};
}

/** Convert a markdown/MDX body to an HTML string for use in feed content. */
export async function renderBodyToHtml(body, articleUrl) {
	if (!body) return undefined;
	const result = await unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(makeImagesAbsolute(articleUrl))
		.use(rehypeStringify)
		.process(body);
	return String(result);
}
