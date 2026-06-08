export const SITE_STANDARD_DOCUMENT_COLLECTION = "site.standard.document";

export function normalizeContentEntryId(id) {
	if (typeof id !== "string") return undefined;
	if (!id) return undefined;
	return id.endsWith("/index") ? id.slice(0, -"/index".length) : id;
}

export function toSiteStandardDocumentRkey(entryId) {
	const normalizedId = normalizeContentEntryId(entryId);
	if (!normalizedId) return undefined;
	return normalizedId.replaceAll("/", "~");
}

export function toSiteStandardDocumentUri(did, entryId) {
	if (!did) return undefined;
	const rkey = toSiteStandardDocumentRkey(entryId);
	if (!rkey) return undefined;
	return `at://${did}/${SITE_STANDARD_DOCUMENT_COLLECTION}/${rkey}`;
}
