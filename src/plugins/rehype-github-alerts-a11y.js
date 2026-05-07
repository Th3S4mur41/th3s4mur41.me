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
	if (!Array.isArray(firstChild.children)) return "";

	const normalizedChildren = firstChild.children.filter((child) => {
		if (child.type !== "text") return true;
		return typeof child.value !== "string" || child.value.trim() !== "";
	});

	if (normalizedChildren.length !== 1) return "";

	const strong = normalizedChildren[0];
	if (!strong || strong.type !== "element" || strong.tagName !== "strong") return "";

	return getNodeText(strong).trim();
}

function getAlertBodyChildren(originalChildren, customTitle) {
	if (!customTitle) return originalChildren;
	// When a dedicated title paragraph exists (`**Title**`), remove it from body content
	// and surface it as the alert heading instead.
	return originalChildren.slice(1);
}

function getAlertTypeTitle(alertOptions) {
	if (!alertOptions || typeof alertOptions !== "object") return "";
	if (typeof alertOptions.title !== "string") return "";
	return alertOptions.title.trim();
}

export const rehypeGithubAlertsA11yOptions = {
	build: (alertOptions, originalChildren) => {
		const customTitle = getCustomAlertTitle(originalChildren);
		const alertTypeTitle = getAlertTypeTitle(alertOptions);
		const normalizedChildren = getAlertBodyChildren(originalChildren, customTitle);
		const normalizedAlertOptions = customTitle ? { ...alertOptions, title: customTitle } : alertOptions;
		const alert = defaultBuild(normalizedAlertOptions, normalizedChildren);

		if (alert?.type === "element") {
			if (customTitle) {
				alert.tagName = "aside";
				const accessibleLabel = alertTypeTitle ? `${alertTypeTitle}: ${customTitle}` : customTitle;
				alert.properties = {
					...alert.properties,
					// Rehype/HAST properties should use attribute-style ARIA keys.
					"aria-label": accessibleLabel,
				};
			} else {
				alert.tagName = "div";
			}
		}

		return alert;
	},
};

export { rehypeGithubAlerts };
