/**
 * Rehype plugin to add unique view-transition-name attributes to article elements
 * This allows for smooth view transitions between listing pages and individual articles
 *
 * The articleId is extracted from the file path during processing
 */
export function rehypeViewTransitionNames() {
	return function transformer(tree, file) {
		// Extract articleId from file path
		// file.path will be something like "/src/content/blog/my-article/index.mdx"
		const pathParts = file.path?.split("/") || [];
		const contentIndex = pathParts.indexOf("content");

		if (contentIndex === -1 || contentIndex + 2 >= pathParts.length) {
			// Not a content file or can't determine articleId
			return tree;
		}

		// The articleId is the folder name (e.g., "my-article" from "content/blog/my-article/index.mdx")
		const articleId = pathParts[contentIndex + 2];

		if (!articleId) {
			return tree;
		}

		// Find the first h1 (article title) and first hero image
		let foundH1 = false;
		let foundHeroImage = false;

		function visit(node) {
			// Add view-transition-name to the first h1
			if (!foundH1 && node.type === "element" && node.tagName === "h1") {
				foundH1 = true;
				node.properties = node.properties || {};
				node.properties.style = node.properties.style
					? `${node.properties.style}; view-transition-name: article-title-${articleId};`
					: `view-transition-name: article-title-${articleId};`;
			}

			// Find hero image (first img in p following h1)
			if (foundH1 && !foundHeroImage && node.type === "element" && node.tagName === "p") {
				// Check if this paragraph contains an img
				const hasImg = node.children?.some((child) => child.type === "element" && child.tagName === "img");

				if (hasImg) {
					foundHeroImage = true;
					// Find the img element and add view-transition-name
					node.children.forEach((child) => {
						if (child.type === "element" && child.tagName === "img") {
							child.properties = child.properties || {};
							child.properties.style = child.properties.style
								? `${child.properties.style}; view-transition-name: article-hero-image-${articleId};`
								: `view-transition-name: article-hero-image-${articleId};`;
						}
					});
				}
			}

			// Recursively visit children
			if (node.children) {
				node.children.forEach(visit);
			}
		}

		visit(tree);
		return tree;
	};
}
