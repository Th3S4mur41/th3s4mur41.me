import { defaultBuild } from "rehype-github-alerts";

/**
 * Sätteri HAST plugin that implements GitHub markdown alerts with accessibility enhancements.
 *
 * It mirrors rehype-github-alerts' default markup, but renders the container as <aside>
 * and adds an aria-label for screen readers.
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
					const ariaLabel = alertTypeTitle ? `${alertTypeTitle}: ${customTitle}` : customTitle;
					const originalChildren = removeCustomTitleParagraph(node.children || []);
					const builtAlert = defaultBuild(
						{
							keyword: alertType,
							title: customTitle,
							icon: getIconMarkup(alertType),
						},
						originalChildren,
					);

					if (!builtAlert) {
						return;
					}

					builtAlert.tagName = "aside";
					builtAlert.properties = {
						...builtAlert.properties,
						"aria-label": ariaLabel,
					};

					// Return new aside element to replace the blockquote
					return {
						...builtAlert,
					};
				}
			},
		},
	};

	function getIconMarkup(alertType) {
		const iconByType = {
			NOTE: '<svg height="16" viewBox="0 0 16 16" width="16" aria-hidden="true" class="mr-2 octicon octicon-info" version="1.1"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
			INFO: '<svg height="16" viewBox="0 0 16 16" width="16" aria-hidden="true" class="mr-2 octicon octicon-info" version="1.1"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
			TIP: '<svg height="16" viewBox="0 0 16 16" width="16" aria-hidden="true" class="mr-2 octicon octicon-light-bulb" version="1.1"><path d="M8 15.5A1.5 1.5 0 0 0 9.5 14h-3A1.5 1.5 0 0 0 8 15.5ZM8 0a5.5 5.5 0 0 0-3 10.1V12a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1.9A5.5 5.5 0 0 0 8 0Zm0 1.5a4 4 0 0 1 2.4 7.2.75.75 0 0 0-.3.6V12h-4v-2.7a.75.75 0 0 0-.3-.6A4 4 0 0 1 8 1.5Z"></path></svg>',
			IMPORTANT:
				'<svg height="16" viewBox="0 0 16 16" width="16" aria-hidden="true" class="mr-2 octicon octicon-alert" version="1.1"><path d="M6.457 1.047c.331-.8 1.423-.8 1.754 0l5.48 13.196A.75.75 0 0 1 13.5 15.5h-11a.75.75 0 0 1-.691-1.047L6.457 1.047ZM8 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>',
			WARNING:
				'<svg height="16" viewBox="0 0 16 16" width="16" aria-hidden="true" class="mr-2 octicon octicon-alert" version="1.1"><path d="M6.457 1.047c.331-.8 1.423-.8 1.754 0l5.48 13.196A.75.75 0 0 1 13.5 15.5h-11a.75.75 0 0 1-.691-1.047L6.457 1.047ZM8 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>',
			CAUTION:
				'<svg height="16" viewBox="0 0 16 16" width="16" aria-hidden="true" class="mr-2 octicon octicon-alert" version="1.1"><path d="M6.457 1.047c.331-.8 1.423-.8 1.754 0l5.48 13.196A.75.75 0 0 1 13.5 15.5h-11a.75.75 0 0 1-.691-1.047L6.457 1.047ZM8 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>',
		};

		return iconByType[alertType] ?? iconByType.INFO;
	}

	function detectAlertType(blockquoteNode) {
		// GitHub alerts have their type in the first paragraph as a [!TYPE] marker
		if (!blockquoteNode.children || !Array.isArray(blockquoteNode.children)) {
			return null;
		}

		// Skip leading whitespace text nodes to find the first element child
		const firstChild = blockquoteNode.children.find((c) => c.type !== "text" || c.value?.trim() !== "");
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

		// Skip leading whitespace text nodes to find the first element child
		const firstChild = blockquoteNode.children.find((c) => c.type !== "text" || c.value?.trim() !== "");
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

		// Find the index of the first non-whitespace child (the [!TYPE] paragraph)
		const firstElemIdx = children.findIndex((c) => c.type !== "text" || c.value?.trim() !== "");
		if (firstElemIdx === -1) return children;
		const firstChild = children[firstElemIdx];
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
				return children.filter((_, i) => i !== firstElemIdx);
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
