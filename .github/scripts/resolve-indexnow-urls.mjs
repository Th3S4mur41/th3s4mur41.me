import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

function getValidatedBaseSiteUrl(rawSiteUrl) {
	let parsed;
	try {
		parsed = new URL(rawSiteUrl);
	} catch {
		throw new Error(`Invalid SITE_URL: ${rawSiteUrl}`);
	}

	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		throw new Error(`Unsupported SITE_URL protocol: ${parsed.protocol}`);
	}

	return new URL(`${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`);
}

const siteUrl = getValidatedBaseSiteUrl(process.env.SITE_URL || "https://th3s4mur41.me");
const mode = process.env.MODE || "changed";
const previousSha = process.env.PREVIOUS_SHA || "";
const currentSha = process.env.CURRENT_SHA || "";
const outputPath = process.env.OUTPUT_PATH || "indexnow-urls.txt";

function resolveOutputPath(candidatePath) {
	const rootDir = path.resolve(process.cwd());
	const resolvedPath = path.resolve(rootDir, candidatePath);
	const relativePath = path.relative(rootDir, resolvedPath);

	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error(`Invalid OUTPUT_PATH: path must stay within workspace root (${rootDir})`);
	}

	return resolvedPath;
}

const FULL_SITE_TRIGGER_PREFIXES = ["src/components/", "src/layouts/", "src/styles/", "src/utils/"];

const FULL_SITE_TRIGGER_FILES = new Set([
	"astro.config.mjs",
	"public/_redirects",
	"src/content.config.js",
	"src/index.css",
	"src/pages/[section]/[...slug].astro",
]);

const STATIC_PAGE_ROUTES = new Map([
	["src/pages/index.astro", "/"],
	["src/pages/about.astro", "/about/"],
	["src/pages/blog.astro", "/blog/"],
	["src/pages/specs.astro", "/specs/"],
]);

const NOOP_PREFIXES = [".github/", ".vscode/", "node_modules/", "resources/"];

const NOOP_FILES = new Set([
	"package.json",
	"package-lock.json",
	"biome.json",
	"commitlint.config.js",
	"postcss.config.mjs",
	"vitest.config.js",
	"README.md",
	"CHANGELOG.md",
	"SECURITY.md",
	"LICENSE",
]);

function normalizeUrl(routePath) {
	return new URL(routePath, `${siteUrl}/`).toString();
}

function addUrl(urlSet, routePath) {
	urlSet.add(normalizeUrl(routePath));
}

function parseDiffNames(diffOutput) {
	const changedPaths = new Set();

	for (const rawLine of diffOutput.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;

		const parts = rawLine.split("\t");
		const status = parts[0] || "";

		if (status.startsWith("R") || status.startsWith("C")) {
			if (parts[1]) changedPaths.add(parts[1]);
			if (parts[2]) changedPaths.add(parts[2]);
			continue;
		}

		if (parts[1]) changedPaths.add(parts[1]);
	}

	return [...changedPaths];
}

function isNoopPath(filePath) {
	if (NOOP_FILES.has(filePath)) return true;
	return NOOP_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function isFullSiteTrigger(filePath) {
	if (FULL_SITE_TRIGGER_FILES.has(filePath)) return true;
	return FULL_SITE_TRIGGER_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function collectAncestorBlogUrls(urlSet, slug) {
	const segments = slug.split("/").filter(Boolean);
	while (segments.length > 1) {
		segments.pop();
		addUrl(urlSet, `/blog/${segments.join("/")}/`);
	}
}

function routeSlugFromContentPath(filePath, collection) {
	const prefix = `content/${collection}/`;
	const relativePath = filePath.slice(prefix.length);
	const directory = path.posix.dirname(relativePath);
	const basename = path.posix.basename(relativePath);
	const extension = path.posix.extname(basename);
	const extlessName = extension ? basename.slice(0, -extension.length) : basename;

	let slug;

	if (directory === "." && !basename.startsWith("index.")) {
		slug = extlessName;
	} else if (basename.startsWith("index.")) {
		slug = directory === "." ? "" : directory;
	} else if (/(md|mdx)$/i.test(extension.slice(1))) {
		slug = directory === "." ? extlessName : `${directory}/${extlessName}`;
	} else {
		slug = directory === "." ? "" : directory;
	}

	// Skip draft entries — the site's sitemap excludes them too.
	if (slug.split("/").some((segment) => segment.startsWith("_draft-"))) {
		return null;
	}

	return slug;
}

function mapFileToUrls(filePath, urlSet) {
	if (STATIC_PAGE_ROUTES.has(filePath)) {
		addUrl(urlSet, STATIC_PAGE_ROUTES.get(filePath));
		return;
	}

	if (filePath.startsWith("content/blog/")) {
		const slug = routeSlugFromContentPath(filePath, "blog");
		if (slug === null) return;

		addUrl(urlSet, "/");
		addUrl(urlSet, "/blog/");

		if (slug) {
			addUrl(urlSet, `/blog/${slug}/`);
			collectAncestorBlogUrls(urlSet, slug);
		}

		return;
	}

	if (filePath.startsWith("content/speaking/")) {
		const slug = routeSlugFromContentPath(filePath, "speaking");
		if (slug === null) return;

		addUrl(urlSet, "/");
		addUrl(urlSet, "/blog/");

		if (slug) {
			addUrl(urlSet, `/speaking/${slug}/`);
		}
	}
}

function toAllowedFetchUrl(candidateUrl) {
	let parsed;
	try {
		parsed = new URL(candidateUrl);
	} catch {
		throw new Error(`Invalid sitemap URL: ${candidateUrl}`);
	}

	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		throw new Error(`Unsupported URL protocol in sitemap URL: ${parsed.protocol}`);
	}

	if (parsed.origin !== siteUrl.origin) {
		throw new Error(`Blocked cross-origin sitemap URL: ${parsed.href}`);
	}

	return parsed.href;
}

async function fetchXml(url) {
	const safeUrl = toAllowedFetchUrl(url);
	const response = await fetch(safeUrl, {
		headers: {
			"user-agent": "th3s4mur41-indexnow-workflow",
			accept: "application/xml, text/xml;q=0.9, */*;q=0.8",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch ${safeUrl}: ${response.status} ${response.statusText}`);
	}

	return response.text();
}

function extractLocs(xml) {
	return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim()).filter(Boolean);
}

async function fetchAllSitemapUrls() {
	const sitemapIndexUrl = toAllowedFetchUrl(new URL("/sitemap-index.xml", siteUrl).href);
	const queue = [sitemapIndexUrl];
	const visited = new Set();
	const urls = new Set();

	while (queue.length > 0) {
		const currentUrl = queue.shift();
		if (!currentUrl || visited.has(currentUrl)) continue;
		visited.add(currentUrl);

		const xml = await fetchXml(currentUrl);
		for (const loc of extractLocs(xml)) {
			const safeLoc = toAllowedFetchUrl(loc);
			if (safeLoc.endsWith(".xml")) {
				queue.push(safeLoc);
				continue;
			}

			urls.add(safeLoc);
		}
	}

	return [...urls].sort();
}

async function main() {
	const urls = new Set();
	let reason = "no-relevant-changes";

	if (mode === "all") {
		reason = "all-mode";
		for (const url of await fetchAllSitemapUrls()) {
			urls.add(url);
		}
	} else if (!previousSha) {
		reason = "bootstrap-full-submit";
		for (const url of await fetchAllSitemapUrls()) {
			urls.add(url);
		}
	} else if (previousSha !== currentSha) {
		const diffOutput = execFileSync("git", ["diff", "--name-status", "--find-renames", previousSha, currentSha], {
			encoding: "utf8",
		}).trim();

		const changedPaths = parseDiffNames(diffOutput);
		const meaningfulPaths = changedPaths.filter((filePath) => !isNoopPath(filePath));

		if (meaningfulPaths.some((filePath) => isFullSiteTrigger(filePath))) {
			reason = "shared-site-change";
			for (const url of await fetchAllSitemapUrls()) {
				urls.add(url);
			}
		} else {
			reason = "changed-urls";
			for (const filePath of meaningfulPaths) {
				mapFileToUrls(filePath, urls);
			}
		}
	}

	const resolvedUrls = [...urls].sort();
	const safeOutputPath = resolveOutputPath(outputPath);
	writeFileSync(safeOutputPath, `${resolvedUrls.join("\n")}${resolvedUrls.length ? "\n" : ""}`);

	console.log(`Resolved ${resolvedUrls.length} IndexNow URLs (${reason}).`);
	for (const url of resolvedUrls) {
		console.log(url);
	}

	console.log(`reason=${reason}`);
}

await main();
