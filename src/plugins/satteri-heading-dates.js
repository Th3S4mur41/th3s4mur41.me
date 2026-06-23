import { formatIsoDateAsSiteDate } from "../utils/config.js";

/**
 * Sätteri HAST plugin that transforms ISO date strings (YYYY-MM-DD) found in heading
 * text nodes into semantic <time> elements with a localized, human-readable label.
 *
 * Authoring:  <h2>Update - 2025-09-17</h2>
 * Output:     <h2>Update - <time datetime="2025-09-17">17 Sept 2025</time></h2>
 */
export function createSatteriHeadingDatesPlugin() {
	const ISO_DATE_RE = /(\d{4}-\d{2}-\d{2})/;

	return {
		name: "satteri-heading-dates",
		element: {
			filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
			visit(node, ctx) {
				processHeadingChildren(node, ctx, ISO_DATE_RE);
			},
		},
	};

	function processHeadingChildren(node, ctx, pattern) {
		if (!Array.isArray(node.children)) {
			return;
		}

		const newChildren = [];

		for (const child of node.children) {
			if (child.type === "text") {
				const parts = child.value.split(pattern);
				if (parts.length === 1) {
					// No ISO date in this text node — keep as-is.
					newChildren.push(child);
					continue;
				}

				for (const part of parts) {
					if (!part) continue;

					if (pattern.test(part)) {
						const formatted = formatIsoDateAsSiteDate(part) || part;
						newChildren.push({
							type: "element",
							tagName: "time",
							properties: { dateTime: part },
							children: [{ type: "text", value: formatted }],
						});
					} else {
						newChildren.push({ type: "text", value: part });
					}
				}
			} else if (child.type === "element" && child.children) {
				// Recurse into non-text elements (e.g. <strong>, <em>)
				processHeadingChildren(child, ctx, pattern);
				newChildren.push(child);
			} else {
				newChildren.push(child);
			}
		}

		ctx.setProperty(node, "children", newChildren);
	}
}
