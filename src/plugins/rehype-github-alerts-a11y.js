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

export const rehypeGithubAlertsA11yOptions = {
	build: (alertOptions, originalChildren) => {
		const alert = defaultBuild(alertOptions, originalChildren);
		if (alert?.type === "element") {
			const customTitle = getCustomAlertTitle(originalChildren);

			if (customTitle) {
				alert.tagName = "aside";
				alert.properties = {
					...alert.properties,
					// Rehype/HAST properties should use attribute-style ARIA keys.
					"aria-label": customTitle,
				};
			} else {
				alert.tagName = "div";
			}
		}

		return alert;
	},
};

export { rehypeGithubAlerts };
