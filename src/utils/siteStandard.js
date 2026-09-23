export const SITE_STANDARD_DOCUMENT_COLLECTION = "site.standard.document";

const S32_ALPHABET = "234567abcdefghijklmnopqrstuvwxyz";
const FNV_64_OFFSET = 0xcbf29ce484222325n;
const FNV_64_PRIME = 0x100000001b3n;
const FNV_64_MASK = 0xffffffffffffffffn;

const LEGACY_DOCUMENT_IDS = new Set([
	"a11y-tips/contrast",
	"a11y-tips/labels-validation",
	"ai-enhanced-a11y-tests",
	"ai-in-a11y-test-automation",
	"beyond-compliance-building-accessibility-into-quality-with-test-automation",
	"css-complete-pseudo-class",
	"decoding-async-breaks-view-transitions",
	"design-for-accessibility--make-your-product-usable-for-all",
	"enhancing-dependabot-auto-merging-a-smarter-more-secure-approach",
	"focusgroup-the-future-of-keyboard-navigation",
	"frameworks-are-tools-not-gatekeepers",
	"headingoffset-is-coming-how-to-prepare-today",
	"how-to-display-code-coverage-of-a-vue-project-in-gitlab",
	"how-to-leverage-github-and-semantic-release-to-reduce-vulnerabilities",
	"href-hash-focus-desync-accessibility",
	"mixins-from-preprocessors-to-native-css",
	"mixins-the-good-the-bad-the-ugly",
	"notes/decoding-async-breaks-view-transitions",
	"notes/standard-site",
	"php-in-2026-modern-language-fragmented-tooling",
	"scroll-focus-polyfill",
	"sda-in-test-automation",
	"speaking/beyond-barrieres-podcast-season-6",
	"speaking/world-usability-day-training-inclusive-ai-accessibility",
	"speaking/you-dont-need-js-for-that",
	"the-lean-web/grid-lanes-layout-with-subgrid",
	"things-you-need-to-test-your-web-app",
	"tools-that-improve-team-collaboration-and-code-quality",
]);

export function normalizeContentEntryId(id) {
	if (typeof id !== "string") return undefined;
	if (!id) return undefined;
	return id.endsWith("/index") ? id.slice(0, -"/index".length) : id;
}

function toDeterministicTid(value) {
	let hash = FNV_64_OFFSET;
	for (const char of value) {
		hash ^= BigInt(char.codePointAt(0));
		hash = (hash * FNV_64_PRIME) & FNV_64_MASK;
	}

	let encoded = "";
	let remaining = hash;
	for (let index = 0; index < 13; index += 1) {
		encoded = S32_ALPHABET[Number(remaining % 32n)] + encoded;
		remaining /= 32n;
	}

	return encoded;
}

export function toSiteStandardDocumentRkey(entryId) {
	const normalizedId = normalizeContentEntryId(entryId);
	if (!normalizedId) return undefined;
	if (!LEGACY_DOCUMENT_IDS.has(normalizedId)) return toDeterministicTid(normalizedId);
	return normalizedId.replaceAll("/", "~");
}

export function toSiteStandardDocumentUri(did, entryId) {
	if (!did) return undefined;
	const rkey = toSiteStandardDocumentRkey(entryId);
	if (!rkey) return undefined;
	return `at://${did}/${SITE_STANDARD_DOCUMENT_COLLECTION}/${rkey}`;
}
