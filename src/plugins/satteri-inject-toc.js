import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import getReadingTime from "reading-time";
import { SITE_CONFIG } from "../utils/config.js";

/**
 * Sätteri HAST plugin that injects a Table of Contents (TOC) after the first h1 element.
 * Also injects reading time metadata for blog posts, excluding series introductions.
 *
 * Series intro detection: An index.mdx file in a blog section with subdirectories is
 * considered a series intro. Those pages skip reading-time injection.
 * TOC injection remains content-driven and only happens when h2-h6 headings exist.
 *
 * Reading time data comes from ctx.data.readingTime, which is set by the reading-time MDAST plugin.
 */
export function createSatteriInjectTocPlugin() {
	return {
		name: "satteri-inject-toc",
		element: {
			filter: ["h1"],
			visit(node, ctx) {
				// Prevent duplicate injection if a document somehow contains multiple h1s.
				if (ctx.data?._tocInjected) {
					return;
				}

				let filePath;
				try {
					filePath = ctx.fileURL ? fileURLToPath(ctx.fileURL) : undefined;
				} catch {
					// If fileURLToPath fails, skip plugin
					return;
				}

				if (!filePath) {
					return;
				}

				const normalizedPath = filePath.replace(/\\/g, "/");
				const isBlog = normalizedPath.includes("/content/blog/");
				if (!isBlog) {
					return;
				}

				const isSeriesIntro = detectSeriesIntro(filePath, isBlog);
				const rootNode = getRootNode(node, ctx);
				const headings = [];
				collectHeadings(rootNode, headings);
				const readingTime =
					ctx.data?.readingTime ||
					buildReadingTimeFromTree(rootNode, {
						wordsPerMinute: SITE_CONFIG.readingTime.wordsPerMinute,
					});

				// Filter out h1 and keep only h2-h6
				const tocHeadings = headings.filter((h) => h.depth > 1);

				// Build nested TOC structure
				const nestedHeadings = tocHeadings.length > 0 ? buildNestedToc(tocHeadings) : [];

				// Create TOC nav node
				const tocNode = nestedHeadings.length > 0 ? buildTocNavElement(nestedHeadings) : null;

				// Create reading meta node for blog posts, excluding series intros.
				const readingMetaNode = readingTime && !isSeriesIntro ? buildReadingMetaElement(readingTime) : null;

				// Gather nodes to insert after h1
				const nodesToInsert = [readingMetaNode, tocNode].filter((candidate) => candidate !== null);
				if (nodesToInsert.length === 0) {
					return;
				}

				ctx.insertAfter(node, nodesToInsert);
				ctx.data._tocInjected = true;
			},
		},
	};

	function detectSeriesIntro(filePath, isBlog) {
		if (!isBlog || !/[/\\]index\.mdx?$/.test(filePath)) {
			return false;
		}

		try {
			return readdirSync(path.dirname(filePath), {
				withFileTypes: true,
			}).some((entry) => entry.isDirectory());
		} catch {
			return false;
		}
	}

	function getRootNode(node, ctx) {
		let current = node;
		let parent = ctx.parent(current);

		while (parent) {
			current = parent;
			parent = ctx.parent(current);
		}

		return current;
	}

	function collectHeadings(node, headings) {
		if (!node || typeof node !== "object") {
			return;
		}

		if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
			const depth = Number.parseInt(node.tagName.charAt(1), 10);
			const text = extractText(node).trim();
			if (text) {
				const slug = typeof node.properties?.id === "string" ? node.properties.id : createSlug(text);
				headings.push({ depth, text, slug });
			}
		}

		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				collectHeadings(child, headings);
			}
		}
	}

	function extractText(node) {
		if (!node || typeof node !== "object") {
			return "";
		}

		if (node.type === "text") {
			return typeof node.value === "string" ? node.value : "";
		}

		if (Array.isArray(node.children)) {
			return node.children.map(extractText).join("");
		}

		return "";
	}

	function createSlug(text) {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_]/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	function buildReadingTimeFromTree(rootNode, options) {
		const text = extractText(rootNode).trim();
		if (!text) {
			return null;
		}

		const stats = getReadingTime(text, options);
		return stats.words > 0 ? stats : null;
	}

	function buildNestedToc(headings) {
		const root = [];
		const stack = [];

		for (const heading of headings) {
			const item = {
				text: heading.text,
				slug: heading.slug,
				depth: heading.depth,
				children: [],
			};

			// Pop stack until we find correct parent depth
			while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
				stack.pop();
			}

			// Add to parent or root
			if (stack.length === 0) {
				root.push(item);
			} else {
				stack[stack.length - 1].children.push(item);
			}

			stack.push(item);
		}

		return root;
	}

	function buildTocNavElement(nestedHeadings) {
		const ulNode = buildTocList(nestedHeadings);

		return {
			type: "element",
			tagName: "nav",
			properties: {
				class: "table-of-contents",
				"aria-labelledby": "toc-heading",
			},
			children: [
				{
					type: "element",
					tagName: "header",
					properties: { id: "toc-heading" },
					children: [{ type: "text", value: "On this page" }],
				},
				ulNode,
			],
		};
	}

	function buildTocList(items) {
		const ulNode = {
			type: "element",
			tagName: "ul",
			properties: {},
			children: [],
		};

		for (const item of items) {
			const liNode = {
				type: "element",
				tagName: "li",
				properties: {},
				children: [
					{
						type: "element",
						tagName: "a",
						properties: { href: `#${item.slug}` },
						children: [{ type: "text", value: item.text }],
					},
				],
			};

			if (item.children && item.children.length > 0) {
				liNode.children.push(buildTocList(item.children));
			}

			ulNode.children.push(liNode);
		}

		return ulNode;
	}

	function buildReadingMetaElement(readingTime) {
		const readText = readingTime?.text || "";
		const wordCount = readingTime?.words || 0;

		if (!readText || !Number.isFinite(wordCount) || wordCount <= 0) {
			return null;
		}

		const formattedWords = new Intl.NumberFormat("en-GB").format(wordCount);
		const metaText = `${readText} • ${formattedWords} words`;

		return {
			type: "element",
			tagName: "p",
			properties: { class: "reading-meta" },
			children: [{ type: "text", value: metaText }],
		};
	}
}
