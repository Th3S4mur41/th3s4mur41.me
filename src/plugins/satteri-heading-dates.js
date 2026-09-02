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
			visit(node) {
				const children = transformHeadingChildren(node.children, ISO_DATE_RE);
				if (!children) {
					return;
				}

				return {
					...node,
					children,
				};
			},
		},
	};

	function transformHeadingChildren(children, pattern) {
		if (!Array.isArray(children)) {
			return null;
		}

		let transformed = false;
		const newChildren = [];

		for (const child of children) {
			if (child.type === "text") {
				const parts = child.value.split(pattern);
				if (parts.length === 1) {
					// Preserve compiler-owned MDX children without mutating their internals.
					newChildren.push(child);
					continue;
				}
				transformed = true;

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
			} else {
				newChildren.push(child);
			}
		}

		return transformed ? newChildren : null;
	}
}
