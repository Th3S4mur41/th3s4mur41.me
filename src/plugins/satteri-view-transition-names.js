import { fileURLToPath } from "node:url";

/**
 * Sätteri HAST plugin that adds unique view-transition-name CSS properties
 * to the article title (first h1) and hero image (first img in a paragraph).
 *
 * This enables smooth view transitions between listing pages and individual articles.
 *
 * Output:
 *   <h1 style="view-transition-name: article-title-{articleId}">Title</h1>
 *   <img style="view-transition-name: article-hero-image-{articleId}" ... />
 */
export function createSatteriViewTransitionNamesPlugin() {
	return {
		name: "satteri-view-transition-names",
		element: {
			filter: ["h1"],
			visit(h1Node, ctx) {
				// Extract articleId from file path on first h1 visit
				// ctx.fileURL will be a URL object pointing to the source markdown file
				const fileURL = ctx.fileURL;
				if (!fileURL) {
					return;
				}

				let filePath;
				try {
					filePath = fileURLToPath(fileURL);
				} catch (e) {
					return;
				}

				const pathParts = filePath.split(/[\\/]/);
				const contentIndex = pathParts.indexOf("content");

				if (contentIndex === -1 || contentIndex + 2 >= pathParts.length) {
					// Not a content file or can't determine articleId
					return;
				}

				// Extract articleId from path structure
				// e.g., /content/blog/my-article/index.mdx → "my-article"
				// e.g., /content/blog/parent/child/index.mdx → "parent-child"
				const sectionIndex = contentIndex + 1; // index of "blog" or "speaking"
				const fileIndex = pathParts.length - 1; // index of "index.mdx" or filename
				const articleIdParts = pathParts.slice(sectionIndex + 1, fileIndex);
				const articleId = articleIdParts.join("-").replace(/\\/g, "-");

				if (!articleId) {
					return;
				}

				// Set view-transition-name on the h1
				const transitionName = `article-title-${articleId}`;
				addOrUpdateStyle(ctx, h1Node, `view-transition-name: ${transitionName};`);

				// Find the root and walk to find the first img after h1
				const root = getRootNode(h1Node, ctx);
				let foundHeroImage = false;

				walkTree(root, (node) => {
					if (!foundHeroImage && node.type === "element" && node.tagName === "p") {
						// Check if this paragraph contains an img
						const imgChild = node.children?.find((child) => child.type === "element" && child.tagName === "img");

						if (imgChild) {
							foundHeroImage = true;
							const heroTransitionName = `article-hero-image-${articleId}`;
							addOrUpdateStyle(ctx, imgChild, `view-transition-name: ${heroTransitionName};`);
						}
					}
				});
			},
		},
	};

	function getRootNode(node, ctx) {
		let current = node;
		let parent = ctx.parent(current);

		while (parent) {
			current = parent;
			parent = ctx.parent(current);
		}

		return current;
	}

	function addOrUpdateStyle(ctx, node, newStyle) {
		const currentStyle = node.properties?.style || "";
		const updatedStyle = currentStyle ? `${currentStyle} ${newStyle}`.trim() : newStyle;
		ctx.setProperty(node, "style", updatedStyle);
	}

	function walkTree(node, callback) {
		if (node.type === "element" || node.type === "root") {
			if (node.children && Array.isArray(node.children)) {
				for (const child of node.children) {
					callback(child);
					walkTree(child, callback);
				}
			}
		}
	}
}
