/**
 * Normalize content entry IDs so both "foo" and "foo/index" resolve to "foo".
 */
export function normalizeEntryId(id: string): string {
	if (!id) return id;
	return id.endsWith("/index") ? id.slice(0, -"/index".length) : id;
}

/**
 * Return true when an entry ID is a series container for other entries.
 * Example: "a11y-tips" is a container for "a11y-tips/contrast".
 */
export function isSeriesContainerId(entryId: string, allEntryIds: string[]): boolean {
	const normalizedId = normalizeEntryId(entryId);
	return allEntryIds.some((id) => {
		const normalizedCandidate = normalizeEntryId(id);
		return normalizedCandidate !== normalizedId && normalizedCandidate.startsWith(`${normalizedId}/`);
	});
}

export function isSeriesContainerEntry<T extends { id: string }>(entry: T, allEntries: T[]): boolean {
	return isSeriesContainerId(
		entry.id,
		allEntries.map((item) => item.id),
	);
}

export function getSeriesSlug(entryId: string): string | null {
	const normalizedId = normalizeEntryId(entryId);
	if (!normalizedId.includes("/")) return null;
	return normalizedId.split("/")[0] ?? null;
}
