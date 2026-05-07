import { defaultBuild, rehypeGithubAlerts } from "rehype-github-alerts";

function getNodeText(node) {
	if (!node || typeof node !== "object") return "";
	if (node.type === "text" && typeof node.value === "string") return node.value;
	if (!Array.isArray(node.children)) return "";
	return node.children.map((child) => getNodeText(child)).join("");
}

function getCustomAlertTitle(originalChildren) {
	if (!Array.isArray(originalChildren) || originalChildren.length === 0) return "";

	const firstChild = originalChildren[0];
	if (!firstChild || firstChild.type !== "element" || firstChild.tagName !== "p") return "";
	if (!Array.isArray(firstChild.children) || firstChild.children.length !== 1) return "";

	const strong = firstChild.children[0];
	if (!strong || strong.type !== "element" || strong.tagName !== "strong") return "";

	return getNodeText(strong).trim();
}

function getAlertBodyChildren(originalChildren, customTitle) {
	if (!customTitle) return originalChildren;
	// When a dedicated title paragraph exists (`**Title**`), remove it from body content
	// and surface it as the alert heading instead.
	return originalChildren.slice(1);
}

export const rehypeGithubAlertsA11yOptions = {
	build: (alertOptions, originalChildren) => {
		const customTitle = getCustomAlertTitle(originalChildren);
		const normalizedChildren = getAlertBodyChildren(originalChildren, customTitle);
		const normalizedAlertOptions = customTitle ? { ...alertOptions, title: customTitle } : alertOptions;
		const alert = defaultBuild(normalizedAlertOptions, normalizedChildren);

		if (alert?.type === "element") {
			if (customTitle) {
				alert.tagName = "aside";
				alert.properties = {
					...alert.properties,
					// Rehype/HAST properties should use attribute-style ARIA keys.
					"aria-label": `${alertOptions.title}: ${customTitle}`,
				};
			} else {
				alert.tagName = "div";
			}
		}

		return alert;
	},
};

export { rehypeGithubAlerts };
