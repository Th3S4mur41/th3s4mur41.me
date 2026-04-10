import { visit } from "unist-util-visit";
import { formatIsoDateAsSiteDate } from "../utils/config.js";

/**
 * Rehype plugin that transforms ISO date strings (YYYY-MM-DD) found in heading
 * text nodes into semantic <time> elements with a localized, human-readable label.
 *
 * Authoring:  ## Update - 2025-09-17
 * Output:     <h2>Update - <time datetime="2025-09-17">17 Sept 2025</time></h2>
 *
 * Because Astro's built-in rehype-slug runs before custom rehype plugins, it
 * assigns ids from the plain-text heading *before* this plugin wraps the date.
 * That means each "Update - YYYY-MM-DD" heading gets a stable, date-derived id
 * (e.g. "update---2025-09-17"), keeping multiple update headings unique without
 * any special id management.
 */
export function rehypeHeadingDates() {
	const ISO_DATE_RE = /(\d{4}-\d{2}-\d{2})/;

	return function transformer(tree) {
		visit(tree, "element", (node) => {
			if (!/^h[1-6]$/.test(node.tagName)) return;

			node.children = transformChildren(node.children);
		});
	};

	function transformChildren(children) {
		const result = [];

		for (const child of children) {
			if (child.type !== "text") {
				// Recurse into non-text nodes (e.g. <strong>, <em>) in case a date
				// appears inside inline formatting.
				result.push(child.children ? { ...child, children: transformChildren(child.children) } : child);
				continue;
			}

			const parts = child.value.split(ISO_DATE_RE);
			if (parts.length === 1) {
				// No ISO date in this text node — keep as-is.
				result.push(child);
				continue;
			}

			for (const part of parts) {
				if (!part) continue;

				if (ISO_DATE_RE.test(part)) {
					const formatted = formatIsoDateAsSiteDate(part) || part;

					result.push({
						type: "element",
						tagName: "time",
						properties: { datetime: part },
						children: [{ type: "text", value: formatted }],
					});
				} else {
					result.push({ type: "text", value: part });
				}
			}
		}

		return result;
	}
}
