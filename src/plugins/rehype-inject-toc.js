/**
 * Rehype plugin to inject Table of Contents after the first h1 element
 * Collects headings from the AST and builds a nested TOC structure
 */
export function rehypeInjectToc() {
	return function transformer(tree) {
		// Helper function to extract text from heading nodes
		const getText = (node) => {
			if (node.type === "text") {
				return node.value;
			}
			if (node.children) {
				return node.children.map(getText).join("");
			}
			return "";
		};

		// Helper function to create slug from text
		const createSlug = (text) => {
			return text
				.toLowerCase()
				.trim()
				.replace(/[^\w\s-]/g, "")
				.replace(/[\s_]/g, "-")
				.replace(/^-+|-+$/g, "");
		};

		// Collect all headings from the tree
		const headings = [];
		const collectHeadings = (node) => {
			if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
				const depth = Number.parseInt(node.tagName.charAt(1));
				const text = getText(node);
				const slug = node.properties?.id || createSlug(text);

				headings.push({ depth, text, slug });
			}

			if (node.children) {
				for (const child of node.children) {
					collectHeadings(child);
				}
			}
		};

		collectHeadings(tree);

		// Filter out h1 (depth 1) and only keep h2-h6
		const tocHeadings = headings.filter((h) => h.depth > 1);

		// Skip if there are no headings beyond h1
		if (tocHeadings.length === 0) {
			return tree;
		}

		// Build nested TOC structure
		const buildNestedToc = (headings) => {
			const root = [];
			const stack = [];

			for (const heading of headings) {
				const item = {
					text: heading.text,
					slug: heading.slug,
					depth: heading.depth,
					children: [],
				};

				// Find the correct parent level
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
		};

		// Render TOC list recursively
		const renderTocList = (items) => {
			if (items.length === 0) return [];

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

				if (item.children.length > 0) {
					liNode.children.push(...renderTocList(item.children));
				}

				ulNode.children.push(liNode);
			}

			return [ulNode];
		};

		const nestedHeadings = buildNestedToc(tocHeadings);

		// Create TOC nav element
		const tocNode = {
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
				...renderTocList(nestedHeadings),
			],
		};

		// Find the first h1 and insert TOC after it
		const insertToc = (node, parent, index) => {
			if (node.type === "element" && node.tagName === "h1") {
				// Insert TOC after the h1
				if (parent && typeof index === "number") {
					parent.children.splice(index + 1, 0, tocNode);
					return true;
				}
			}

			if (node.children) {
				for (let i = 0; i < node.children.length; i++) {
					if (insertToc(node.children[i], node, i)) {
						return true;
					}
				}
			}

			return false;
		};

		insertToc(tree);

		return tree;
	};
}
