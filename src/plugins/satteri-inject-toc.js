import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Sätteri HAST plugin that injects a Table of Contents (TOC) after the first h1 element.
 * Also injects reading time metadata for blog posts (but not series introductions).
 *
 * Series intro detection: An index.mdx file in a blog section with subdirectories is
 * considered a series intro (no TOC or reading time injected).
 *
 * Reading time data comes from ctx.data.readingTime, which is set by the reading-time MDAST plugin.
 */
export function createSatteriInjectTocPlugin() {
	return {
		name: "satteri-inject-toc",
		root(tree, ctx) {
			const filePath = ctx.fileURL ? fileURLToPath(ctx.fileURL) : undefined;
			if (!filePath) {
				return;
			}

			const isBlog = filePath.includes("/content/blog/");
			const isSeriesIntro = detectSeriesIntro(filePath, isBlog);
			const readingTime = isBlog ? ctx.data?.readingTime : undefined;

			// Collect headings from the tree
			const headings = [];
			collectHeadings(tree, headings);

			// Filter out h1 and keep only h2-h6
			const tocHeadings = headings.filter((h) => h.depth > 1);

			// Build nested TOC structure
			const nestedHeadings = tocHeadings.length > 0 ? buildNestedToc(tocHeadings) : [];

			// Create TOC nav node
			const tocNode = nestedHeadings.length > 0 ? buildTocNavElement(nestedHeadings) : null;

			// Create reading meta node (for blog posts, excluding series intros)
			const readingMetaNode = readingTime && isBlog && !isSeriesIntro ? buildReadingMetaElement(readingTime) : null;

			// Gather nodes to insert after h1
			const nodesToInsert = [readingMetaNode, tocNode].filter((node) => node !== null);
			if (nodesToInsert.length === 0) {
				return;
			}

			// Find first h1 and insert nodes after it
			insertNodesAfterFirstH1(ctx, tree, nodesToInsert);
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

	function collectHeadings(node, headings) {
		if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
			const depth = Number.parseInt(node.tagName.charAt(1), 10);
			const text = extractText(node);
			const slug = node.properties?.id || createSlug(text);
			headings.push({ depth, text, slug });
		}

		if (node.children && Array.isArray(node.children)) {
			for (const child of node.children) {
				collectHeadings(child, headings);
			}
		}
	}

	function extractText(node) {
		if (node.type === "text") {
			return node.value;
		}
		if (node.children && Array.isArray(node.children)) {
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

	function insertNodesAfterFirstH1(ctx, tree, nodesToInsert) {
		if (tree.type !== "root" || !Array.isArray(tree.children)) {
			return;
		}

		for (let i = 0; i < tree.children.length; i++) {
			const child = tree.children[i];
			if (child.type === "element" && child.tagName === "h1") {
				// Insert after this h1
				ctx.insertAfter(child, ...nodesToInsert);
				return;
			}
		}
	}
}
