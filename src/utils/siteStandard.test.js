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
	it("keeps legacy rkeys for existing synced documents", () => {
		expect(toSiteStandardDocumentRkey("a11y-tips/contrast")).toBe("a11y-tips~contrast");
		expect(toSiteStandardDocumentRkey("notes/standard-site")).toBe("notes~standard-site");
	});

	it("builds deterministic TID rkeys for new documents", () => {
		const rkey = toSiteStandardDocumentRkey("a11y-tips/language-attribute");

		expect(rkey).toMatch(/^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/);
		expect(toSiteStandardDocumentRkey("a11y-tips/language-attribute")).toBe(rkey);
	});

	it("returns undefined when entry ID is missing", () => {
		expect(toSiteStandardDocumentRkey("")).toBeUndefined();
		expect(toSiteStandardDocumentRkey(undefined)).toBeUndefined();
	});
});

describe("toSiteStandardDocumentUri", () => {
	const did = "did:plc:xetli7nktzsvhl74bhl4r4yx";

	it("builds full at:// URI from DID and rkey", () => {
		expect(toSiteStandardDocumentUri(did, "a11y-tips/contrast")).toBe(
			`at://${did}/${SITE_STANDARD_DOCUMENT_COLLECTION}/a11y-tips~contrast`,
		);
		expect(toSiteStandardDocumentUri(did, "a11y-tips/language-attribute")).toMatch(
			new RegExp(
				`^at://${did}/${SITE_STANDARD_DOCUMENT_COLLECTION}/[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$`,
			),
		);
	});

	it("returns undefined when did or entry ID is missing", () => {
		expect(toSiteStandardDocumentUri(undefined, "a11y-tips/contrast")).toBeUndefined();
		expect(toSiteStandardDocumentUri(did, "")).toBeUndefined();
		expect(toSiteStandardDocumentUri(did, undefined)).toBeUndefined();
	});
});
