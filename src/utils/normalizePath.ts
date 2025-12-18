export function normalizePath(path: string): string {
	const parts = path.split("/");
	const normalized: string[] = [];
	for (const part of parts) {
		if (part === ".." && normalized.length > 0 && normalized[normalized.length - 1] !== "..") {
			normalized.pop();
		} else if (part !== "." && part !== "") {
			normalized.push(part);
		}
	}
	return `/${normalized.join("/")}`;
}
