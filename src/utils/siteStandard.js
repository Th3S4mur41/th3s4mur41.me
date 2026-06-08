export const SITE_STANDARD_DOCUMENT_COLLECTION = "site.standard.document";

export function normalizeContentEntryId(id) {
	if (!id) return id;
	return id.endsWith("/index") ? id.slice(0, -"/index".length) : id;
}

export function toSiteStandardDocumentRkey(entryId) {
	const normalizedId = normalizeContentEntryId(entryId);
	return normalizedId.replaceAll("/", "~");
}

export function toSiteStandardDocumentUri(did, entryId) {
	if (!did) return undefined;
	const rkey = toSiteStandardDocumentRkey(entryId);
	return `at://${did}/${SITE_STANDARD_DOCUMENT_COLLECTION}/${rkey}`;
}
