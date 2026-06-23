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
		root(tree, ctx) {
			// Extract articleId from file path
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

			// Walk the tree to find and mark the first h1 and first img
			let foundH1 = false;
			let foundHeroImage = false;

			walkTree(tree, (node, parent) => {
				if (!foundH1 && node.type === "element" && node.tagName === "h1") {
					foundH1 = true;
					const transitionName = `article-title-${articleId}`;
					addOrUpdateStyle(ctx, node, `view-transition-name: ${transitionName};`);
					return;
				}

				// Look for first img in a paragraph (hero image)
				if (foundH1 && !foundHeroImage && node.type === "element" && node.tagName === "p") {
					// Check if this paragraph contains an img
					const imgChild = node.children?.find((child) => child.type === "element" && child.tagName === "img");

					if (imgChild) {
						foundHeroImage = true;
						const transitionName = `article-hero-image-${articleId}`;
						addOrUpdateStyle(ctx, imgChild, `view-transition-name: ${transitionName};`);
					}
				}
			});
		},
	};

	function addOrUpdateStyle(ctx, node, newStyle) {
		const currentStyle = node.properties?.style || "";
		const updatedStyle = currentStyle ? `${currentStyle} ${newStyle}`.trim() : newStyle;
		ctx.setProperty(node, "style", updatedStyle);
	}

	function walkTree(node, callback) {
		if (node.type === "element" || node.type === "root") {
			if (node.children && Array.isArray(node.children)) {
				for (const child of node.children) {
					callback(child, node);
					walkTree(child, callback);
				}
			}
		}
	}
}
