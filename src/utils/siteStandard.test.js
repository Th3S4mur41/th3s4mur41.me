import { describe, expect, it } from "vitest";
import {
	normalizeContentEntryId,
	SITE_STANDARD_DOCUMENT_COLLECTION,
	toSiteStandardDocumentRkey,
	toSiteStandardDocumentUri,
} from "./siteStandard.js";

describe("normalizeContentEntryId", () => {
	it("strips trailing /index from content entry IDs", () => {
		expect(normalizeContentEntryId("a11y-tips/index")).toBe("a11y-tips");
		expect(normalizeContentEntryId("the-lean-web/grid/index")).toBe("the-lean-web/grid");
	});

	it("keeps non-index IDs unchanged", () => {
		expect(normalizeContentEntryId("a11y-tips/contrast")).toBe("a11y-tips/contrast");
	});

	it("returns undefined for empty or non-string IDs", () => {
		expect(normalizeContentEntryId("")).toBeUndefined();
		expect(normalizeContentEntryId(undefined)).toBeUndefined();
		expect(normalizeContentEntryId(null)).toBeUndefined();
	});
});

describe("toSiteStandardDocumentRkey", () => {
	it("builds deterministic rkeys from normalized entry IDs", () => {
		expect(toSiteStandardDocumentRkey("a11y-tips/index")).toBe("a11y-tips");
		expect(toSiteStandardDocumentRkey("a11y-tips/contrast")).toBe("a11y-tips~contrast");
		expect(toSiteStandardDocumentRkey("the-lean-web/grid/guide")).toBe("the-lean-web~grid~guide");
	});

	it("returns undefined when entry ID is missing", () => {
		expect(toSiteStandardDocumentRkey("")).toBeUndefined();
		expect(toSiteStandardDocumentRkey(undefined)).toBeUndefined();
	});
});

describe("toSiteStandardDocumentUri", () => {
	const did = "did:plc:xetli7nktzsvhl74bhl4r4yx";

	it("builds full at:// URI from DID and deterministic rkey", () => {
		expect(toSiteStandardDocumentUri(did, "a11y-tips/index")).toBe(
			`at://${did}/${SITE_STANDARD_DOCUMENT_COLLECTION}/a11y-tips`,
		);
		expect(toSiteStandardDocumentUri(did, "a11y-tips/contrast")).toBe(
			`at://${did}/${SITE_STANDARD_DOCUMENT_COLLECTION}/a11y-tips~contrast`,
		);
	});

	it("returns undefined when did or entry ID is missing", () => {
		expect(toSiteStandardDocumentUri(undefined, "a11y-tips/contrast")).toBeUndefined();
		expect(toSiteStandardDocumentUri(did, "")).toBeUndefined();
		expect(toSiteStandardDocumentUri(did, undefined)).toBeUndefined();
	});
});
