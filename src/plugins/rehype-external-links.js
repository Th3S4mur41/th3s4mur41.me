import { visit } from "unist-util-visit";

/**
 * Rehype plugin to process external links and downloadable files
 */
export function rehypeExternalLinks() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName === "a" && node.properties && node.properties.href) {
				const href = node.properties.href;
				if (typeof href !== "string") {
					return;
				}

				// Check if it's a downloadable file
				if (/\.(zip|tar\.gz|rar|7z)$/i.test(href)) {
					node.properties.download = "";
				}
				// Check if it's an external HTTP/HTTPS link
				else if (/^https?:\/\//.test(href)) {
					node.properties.target = "_blank";
					node.properties.rel = "external noopener";
				}
			}
		});
		return tree;
	};
}
