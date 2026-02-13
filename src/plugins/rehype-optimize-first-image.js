import { visit } from "unist-util-visit";

/**
 * Rehype plugin that optimizes the first image in content by adding:
 * - fetchpriority="high" for priority loading
 * - loading="eager" to prevent lazy loading
 *
 * This improves LCP (Largest Contentful Paint) when the first image
 * is likely to be above the fold.
 */
export function rehypeOptimizeFirstImage() {
	return (tree) => {
		let firstImageFound = false;

		visit(tree, "element", (node) => {
			// Only process the first img element
			if (firstImageFound) return;

			if (node.tagName === "img") {
				firstImageFound = true;

				// Initialize properties if not present
				if (!node.properties) {
					node.properties = {};
				}

				// Add fetchpriority and loading attributes
				node.properties.fetchpriority = "high";
				node.properties.loading = "eager";
			}
		});
		return tree;
	};
}
