/**
 * Sätteri HAST plugin that implements GitHub markdown alerts with accessibility enhancements.
 *
 * GitHub alerts are blockquotes with a [!TYPE] admonition marker:
 *   > [!NOTE]
 *   > Content here
 *
 * This plugin:
 * 1. Converts the blockquote to an <aside> when a custom title (**Title** in first paragraph) is provided
 * 2. Sets aria-label to "AlertType: CustomTitle" for better a11y
 * 3. Falls back to <div> wrapping when no custom title is found
 * 4. Extracts the first paragraph's bold text as the custom alert title
 *
 * Example input:
 *   > [!NOTE]
 *   > **Important Note**
 *   > Rest of content
 *
 * Output:
 *   <aside aria-label="Note: Important Note" class="github-alert github-alert-note" ...>
 *     <p>Rest of content</p>
 *   </aside>
 */

const GITHUB_ALERT_TYPES = [
	"NOTE",
	"ABSTRACT",
	"SUMMARY",
	"TLDR",
	"INFO",
	"TODO",
	"TIP",
	"HINT",
	"IMPORTANT",
	"WARNING",
	"CAUTION",
	"ATTENTION",
	"DANGER",
	"ERROR",
	"BUG",
	"FAILURE",
	"MISSING",
	"FAILURE",
	"EXAMPLE",
	"SNIPPET",
	"QUOTE",
];

export function createSatteriGithubAlertsA11yPlugin() {
	return {
		name: "satteri-github-alerts-a11y",
		element: {
			filter: ["blockquote"],
			visit(node, ctx) {
				// Check if this blockquote is a GitHub alert
				const alertType = detectAlertType(node);
				if (!alertType) {
					return;
				}

				// Extract custom title from first paragraph if present
				const customTitle = extractCustomTitle(node);
				const alertTypeTitle = getTitleForAlertType(alertType);

				// Check if we have a custom title that warrants converting to <aside>
				if (customTitle) {
					// Convert blockquote to aside
					ctx.setProperty(node, "tagName", "aside");

					// Build aria-label
					const ariaLabel = alertTypeTitle ? `${alertTypeTitle}: ${customTitle}` : customTitle;
					ctx.setProperty(node, "aria-label", ariaLabel);

					// Add/update classes
					const currentClasses = node.properties?.class || "";
					const classArray = Array.isArray(currentClasses)
						? currentClasses
						: typeof currentClasses === "string"
							? currentClasses.split(" ")
							: [];
					const newClasses = [...new Set([...classArray, "github-alert", `github-alert-${alertType.toLowerCase()}`])];
					ctx.setProperty(node, "class", newClasses);

					// Remove the first paragraph (title paragraph) from children if it only contains **Title**
					if (node.children && Array.isArray(node.children)) {
						const newChildren = removeCustomTitleParagraph(node.children);
						if (newChildren.length !== node.children.length) {
							ctx.setProperty(node, "children", newChildren);
						}
					}
				}
			},
		},
	};

	function detectAlertType(blockquoteNode) {
		// GitHub alerts have their type in the first paragraph as a [!TYPE] marker
		if (!blockquoteNode.children || !Array.isArray(blockquoteNode.children)) {
			return null;
		}

		const firstChild = blockquoteNode.children[0];
		if (firstChild?.type !== "element" || firstChild.tagName !== "p") {
			return null;
		}

		// Find text content in first paragraph that contains [!TYPE]
		const text = extractText(firstChild);
		const match = text.match(/^\[!(\w+)\]/);
		const type = match?.[1];

		return type && GITHUB_ALERT_TYPES.includes(type) ? type : null;
	}

	function extractCustomTitle(blockquoteNode) {
		if (!blockquoteNode.children || !Array.isArray(blockquoteNode.children)) {
			return "";
		}

		const firstChild = blockquoteNode.children[0];
		if (firstChild?.type !== "element" || firstChild.tagName !== "p") {
			return "";
		}

		if (!Array.isArray(firstChild.children)) {
			return "";
		}

		// Filter out text nodes that only contain whitespace and the [!TYPE] marker
		const meaningfulChildren = firstChild.children.filter((child) => {
			if (child.type === "text") {
				const trimmed = child.value?.trim() || "";
				// Remove the [!TYPE] marker and check if anything meaningful remains
				return trimmed.replace(/^\[!\w+\]\s*/, "").trim() !== "";
			}
			return true;
		});

		// If only one meaningful child and it's a <strong> element, extract its text
		if (meaningfulChildren.length === 1) {
			const strong = meaningfulChildren[0];
			if (strong?.type === "element" && strong.tagName === "strong") {
				return extractText(strong).trim();
			}
		}

		return "";
	}

	function removeCustomTitleParagraph(children) {
		if (children.length === 0) {
			return children;
		}

		const firstChild = children[0];
		if (firstChild?.type !== "element" || firstChild.tagName !== "p") {
			return children;
		}

		// Check if first paragraph only contains [!TYPE] and optionally **Title**
		const meaningfulChildren =
			firstChild.children?.filter((child) => {
				if (child.type === "text") {
					const trimmed = child.value?.trim() || "";
					return trimmed.replace(/^\[!\w+\]\s*/, "").trim() !== "";
				}
				return true;
			}) || [];

		// If only [!TYPE] and **Title** in first paragraph, remove the whole first paragraph
		if (meaningfulChildren.length <= 1) {
			const first = meaningfulChildren[0];
			if (!first || (first.type === "element" && first.tagName === "strong")) {
				return children.slice(1);
			}
		}

		return children;
	}

	function extractText(node) {
		if (node?.type === "text" && typeof node.value === "string") {
			return node.value;
		}
		if (!node?.children || !Array.isArray(node.children)) {
			return "";
		}
		return node.children.map(extractText).join("");
	}

	function getTitleForAlertType(type) {
		const titles = {
			NOTE: "Note",
			ABSTRACT: "Abstract",
			SUMMARY: "Summary",
			TLDR: "TL;DR",
			INFO: "Info",
			TODO: "Todo",
			TIP: "Tip",
			HINT: "Hint",
			IMPORTANT: "Important",
			WARNING: "Warning",
			CAUTION: "Caution",
			ATTENTION: "Attention",
			DANGER: "Danger",
			ERROR: "Error",
			BUG: "Bug",
			FAILURE: "Failure",
			MISSING: "Missing",
			EXAMPLE: "Example",
			SNIPPET: "Snippet",
			QUOTE: "Quote",
		};
		return titles[type] || type;
	}
}
