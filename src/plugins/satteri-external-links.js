/**
 * Sätteri HAST plugin to process external links and downloadable files
 *
 * - Sets target="_blank" and rel="external noopener" on external HTTP(S) links
 * - Sets download="" attribute on downloadable file links
 */
export function createSatteriExternalLinksPlugin() {
	return {
		name: "satteri-external-links",
		element: {
			filter: ["a"],
			visit(node, ctx) {
				const href = node.properties?.href;
				if (typeof href !== "string") {
					return;
				}

				// Check if it's a downloadable file
				if (/\.(zip|tar\.gz|rar|7z)$/i.test(href)) {
					ctx.setProperty(node, "download", "");
				}
				// Check if it's an external HTTP/HTTPS link
				else if (/^https?:\/\//.test(href)) {
					ctx.setProperty(node, "target", "_blank");
					ctx.setProperty(node, "rel", "external noopener");
				}
			},
		},
	};
}
