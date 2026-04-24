import { getImage } from "astro:assets";
import path from "node:path";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const CONTENT_ROOT = "/content";
const BLOG_CONTENT_SEGMENT = `${CONTENT_ROOT}/blog/`;
const SPEAKING_CONTENT_SEGMENT = `${CONTENT_ROOT}/speaking/`;

// Eagerly import all content images so they can be resolved to processed asset URLs.
export const blogImages = import.meta.glob("/content/blog/**/*.{jpg,jpeg,png,webp,gif,avif,svg}", { eager: true });
export const speakingImages = import.meta.glob("/content/speaking/**/*.{jpg,jpeg,png,webp,gif,avif,svg}", {
	eager: true,
});

const IMAGE_POOLS = { blog: blogImages, speaking: speakingImages };

/**
 * Image format to request when processing feed images via `getImage`.
 *
 * - `null`   — keep the source file's original format (jpeg/png/etc.). This
 *              maximises feed reader compatibility since many aggregators do
 *              not support modern formats like AVIF or WebP.
 * - `"avif"` — force AVIF conversion for better compression. Use this if you
 *              are confident your audience's feed readers support AVIF.
 *
 * Change this value to switch between modes without touching any other code.
 *
 * @type {string|null}
 */
export const FEED_IMAGE_FORMAT = null;

/**
 * Standard HTML element names from MDX JSX blocks that should be preserved in
 * feed content.  PascalCase names and custom elements not in this list are
 * treated as Astro/React components and stripped.
 */
const PASSTHROUGH_HTML_ELEMENTS = new Set([
	"figure",
	"figcaption",
	"details",
	"summary",
	"mark",
	"small",
	"del",
	"ins",
	"sup",
	"sub",
	"section",
	"aside",
	"time",
	"abbr",
	"cite",
	"q",
	"address",
	"bdi",
	"bdo",
	"wbr",
	"data",
	"meter",
	"progress",
	"output",
]);

/**
 * Return the resolved ImageMetadata for the given image reference.
 *
 * @param {string} section  - Collection name ("blog" | "speaking").
 * @param {string} entryId  - Entry ID (e.g. "my-article").
 * @param {import('astro').ImageMetadata|string|undefined} image
 *   Either an ImageMetadata object (produced by Astro's `image()` schema
 *   helper) or a plain filename/path string (legacy).
 * @returns {import('astro').ImageMetadata|null}
 */
function getImageModule(section, entryId, image) {
	if (!image) return null;
	// ImageMetadata objects carry `src`, `width`, and `format` — short-circuit
	// without any pool lookup when we already have the resolved metadata.
	if (typeof image === "object" && "src" in image && "width" in image && "format" in image) return image;
	const filename = /** @type {string} */ (image);
	const pool = IMAGE_POOLS[section];
	const cleaned = filename.replace(/^\.\//, "");
	const candidates = cleaned.startsWith("/")
		? [path.posix.normalize(cleaned)]
		: [
				path.posix.normalize(`${CONTENT_ROOT}/${section}/${entryId}/${cleaned}`),
				path.posix.normalize(`${CONTENT_ROOT}/${section}/${cleaned}`),
			];
	for (const candidate of candidates) {
		const mod = pool[candidate];
		if (mod?.default) return mod.default;
	}
	return null;
}

/** Derive the collection section from a content file path. */
function getSectionFromFilePath(filePath) {
	if (!filePath) return null;
	if (filePath.includes(BLOG_CONTENT_SEGMENT) || filePath.startsWith("content/blog/")) return "blog";
	if (filePath.includes(SPEAKING_CONTENT_SEGMENT) || filePath.startsWith("content/speaking/")) return "speaking";
	return null;
}

// ---------------------------------------------------------------------------
// Remark plugins
// ---------------------------------------------------------------------------

/**
 * Remark plugin: remove MDX-specific ESM import/export and expression nodes
 * that have no meaningful representation in a feed (e.g. `import X from '…'`
 * or `{someExpression}`).
 *
 * Nodes to remove are collected first and then spliced in reverse-index order
 * to avoid index-shifting issues when multiple target nodes are adjacent.
 */
function stripMdxMeta() {
	return (tree) => {
		for (const nodeType of ["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"]) {
			const toRemove = [];
			visit(tree, nodeType, (_, index, parent) => {
				if (parent && typeof index === "number") toRemove.push({ parent, index });
			});
			// Remove in reverse so earlier indices remain valid.
			for (const { parent, index } of toRemove.reverse()) {
				parent.children.splice(index, 1);
			}
		}
	};
}

/**
 * remark-rehype handler for `mdxJsxFlowElement` and `mdxJsxTextElement` nodes.
 *
 * - Known HTML elements (in PASSTHROUGH_HTML_ELEMENTS) are passed through as
 *   their HAST equivalent with their children recursively converted.
 * - All other JSX elements (Astro/React components, web components, etc.) are
 *   silently dropped by returning `undefined`.
 */
function mdxJsxHandler(state, node) {
	const tagName = node.name ?? "";
	if (!tagName) return undefined;
	if (!PASSTHROUGH_HTML_ELEMENTS.has(tagName.toLowerCase())) return undefined;
	return {
		type: "element",
		tagName: tagName.toLowerCase(),
		properties: {},
		children: state.all(node),
	};
}

// ---------------------------------------------------------------------------
// Rehype plugins
// ---------------------------------------------------------------------------

/**
 * Rehype plugin: resolve relative `<img src>` values to absolute processed
 * URLs (original format, max 1024 px wide) using the same content image pool
 * that the site uses.
 * Images not found in the pool fall back to a root-relative absolute URL.
 *
 * @param {string|null} section - Collection name ("blog" | "speaking").
 * @param {string} entryId      - Content entry ID (e.g. "my-article").
 * @param {URL|string} site     - Site origin.
 */
function resolveContentImages(section, entryId, site) {
	return () => async (tree) => {
		const pool = section ? IMAGE_POOLS[section] : null;
		const imgNodes = [];

		visit(tree, "element", (node) => {
			if (node.tagName === "img" && node.properties?.src) imgNodes.push(node);
		});

		await Promise.all(
			imgNodes.map(async (node) => {
				const src = String(node.properties.src);
				// Already absolute — nothing to do.
				if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) return;

				const cleaned = src.replace(/^\.\//, "");
				// Normalize to resolve any ".." segments (e.g. "../shared-hero.jpg").
				const candidate = path.posix.normalize(`${CONTENT_ROOT}/${section}/${entryId}/${cleaned}`);
				const mod = pool?.[candidate];

				if (mod?.default) {
					try {
						// Use the configured format, or fall back to the source image's own
						// format so Astro doesn't silently convert to webp by default.
						const imgOptions = { src: mod.default, width: 1024 };
						imgOptions.format = FEED_IMAGE_FORMAT ?? mod.default.format;
						const img = await getImage(imgOptions);
						node.properties.src = new URL(img.src, site).href;
						return;
					} catch {
						// Fall through to the root-relative fallback.
					}
				}

				// Fallback: make the path absolute from the site root so it at
				// least points to a real URL even if it is not resized.
				try {
					node.properties.src = new URL(`/${section}/${entryId}/${cleaned}`, site).href;
				} catch {
					// Leave unresolvable src values as-is.
				}
			}),
		);
	};
}

/**
 * Rehype plugin: make root-relative `href` and `src` values absolute.
 * Skips values that are already absolute or protocol-relative.
 *
 * @param {URL|string} site - Site origin.
 */
function makeLinksAbsolute(site) {
	return () => (tree) => {
		visit(tree, "element", (node) => {
			for (const attr of ["href", "src"]) {
				const val = node.properties?.[attr];
				if (typeof val !== "string") continue;
				if (!val.startsWith("/") || val.startsWith("//")) continue;
				try {
					node.properties[attr] = new URL(val, site).href;
				} catch {
					// Ignore unparseable values.
				}
			}
		});
	};
}

/**
 * Rehype plugin: strip `<script>` tags from feed content.
 * Article bodies may contain inline `<script>` elements (e.g. polyfill snippets)
 * that have no meaning in a feed reader.
 *
 * Nodes are collected first and removed in reverse-index order to avoid
 * index-shifting issues when multiple `<script>` elements are adjacent.
 */
function stripScripts() {
	return (tree) => {
		const toRemove = [];
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName === "script" && parent && typeof index === "number") {
				toRemove.push({ parent, index });
			}
		});
		for (const { parent, index } of toRemove.reverse()) {
			parent.children.splice(index, 1);
		}
	};
}

/**
 * Rehype plugin: strip `<h1>` elements from feed content.
 * The article title is already set as the feed item title, so the H1 in the
 * body would be a duplicate for feed readers.
 */
function stripH1() {
	return (tree) => {
		const toRemove = [];
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName === "h1" && parent && typeof index === "number") {
				toRemove.push({ parent, index });
			}
		});
		for (const { parent, index } of toRemove.reverse()) {
			parent.children.splice(index, 1);
		}
	};
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a content entry's raw Markdown/MDX body to feed-safe HTML.
 *
 * The pipeline:
 *   remark-parse → remark-mdx → remark-gfm → stripMdxMeta →
 *   remark-rehype (with JSX handlers) → rehype-raw → stripScripts →
 *   stripH1 → resolveContentImages → makeLinksAbsolute → rehype-stringify
 *
 * @param {object} entry  - Astro content collection entry (needs .body, .id, .filePath).
 * @param {URL|string} site - Site origin.
 * @returns {Promise<string|undefined>}
 */
export async function renderBodyToHtml(entry, site) {
	const body = entry.body;
	if (!body) return undefined;

	const section = getSectionFromFilePath(entry.filePath);
	const entryId = entry.id;

	const result = await unified()
		.use(remarkParse)
		.use(remarkMdx)
		.use(remarkGfm)
		.use(stripMdxMeta)
		.use(remarkRehype, {
			allowDangerousHtml: true,
			handlers: {
				mdxJsxFlowElement: mdxJsxHandler,
				mdxJsxTextElement: mdxJsxHandler,
			},
		})
		.use(rehypeRaw)
		.use(stripScripts)
		.use(stripH1)
		.use(resolveContentImages(section, entryId, site))
		.use(makeLinksAbsolute(site))
		.use(rehypeStringify)
		.process(body);

	return String(result);
}

/**
 * Resolve the hero image for a content entry to an absolute URL in the
 * image's original format (jpeg/png/etc.), resized to at most 1024 px wide.
 * Avif is intentionally avoided here because some backend services/feed
 * aggregators do not support it.
 *
 * @param {string} section   - Collection name ("blog" | "speaking").
 * @param {string} entryId   - Entry ID (e.g. "my-article").
 * @param {import('astro').ImageMetadata|string|undefined} image
 *   Resolved ImageMetadata (from Astro's `image()` schema helper) or a plain
 *   filename string (legacy path-based lookup).
 * @param {URL|string} site  - Site origin for building absolute URLs.
 * @returns {Promise<string|null>}
 */
export async function getHeroImageUrl(section, entryId, image, site) {
	const imgModule = getImageModule(section, entryId, image);
	if (!imgModule) return null;
	// Use the configured format, or fall back to the source image's own
	// format so Astro doesn't silently convert to webp by default.
	const imgOptions = { src: imgModule, width: 1024 };
	imgOptions.format = FEED_IMAGE_FORMAT ?? imgModule.format;
	const img = await getImage(imgOptions);
	return new URL(img.src, site).href;
}
