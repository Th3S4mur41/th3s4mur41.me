/**
 * Sätteri HAST plugin to optimize the first image in content
 *
 * Adds fetchpriority="high" and loading="eager" to the first img element
 * to improve LCP (Largest Contentful Paint).
 */
export function createSatteriOptimizeFirstImagePlugin() {
	let firstImageFound = false;

	return {
		name: "satteri-optimize-first-image",
		element: {
			filter: ["img"],
			visit(node, ctx) {
				// Only process the first img element
				if (firstImageFound) {
					return;
				}

				firstImageFound = true;
				ctx.setProperty(node, "fetchpriority", "high");
				ctx.setProperty(node, "loading", "eager");
			},
		},
	};
}
