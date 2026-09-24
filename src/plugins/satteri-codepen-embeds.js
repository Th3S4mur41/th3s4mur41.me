import { fromHtml } from "hast-util-from-html";
import { CODEPEN_EMBED_METADATA } from "../data/codepen-embeds.js";

const CODEPEN_ORIGIN = "https://codepen.io";
export const CODEPEN_EMBED_HEIGHT = 400;
const CODEPEN_REQUEST_INTERVAL_MS = 3000;
const CODEPEN_RETRY_DELAYS_MS = [15000, 30000];

const metadataCache = new Map(
	Object.entries(CODEPEN_EMBED_METADATA).map(([penUrl, metadata]) => [penUrl, Promise.resolve(metadata)]),
);
let requestQueue = Promise.resolve();
let lastRequestStartedAt = 0;

function getTextContent(node) {
	if (node?.type === "text") return node.value ?? "";
	if (!Array.isArray(node?.children)) return "";
	return node.children.map(getTextContent).join("");
}

function getStandaloneCodePenUrl(node) {
	if (node.tagName !== "p" || !Array.isArray(node.children)) return null;

	const meaningfulChildren = node.children.filter((child) => child.type !== "text" || child.value?.trim());
	if (meaningfulChildren.length !== 1) return null;

	const link = meaningfulChildren[0];
	if (link.type !== "element" || link.tagName !== "a") return null;

	const href = link.properties?.href;
	if (typeof href !== "string" || getTextContent(link).trim() !== href) return null;

	try {
		const url = new URL(href);
		if (url.origin !== CODEPEN_ORIGIN || url.search || url.hash) return null;

		const parts = url.pathname.split("/").filter(Boolean);
		const isClassicUrl = parts.length === 3 && parts[1] === "pen" && /^[a-z0-9]+$/i.test(parts[2]);
		const isEditorUrl =
			parts.length === 4 &&
			parts[0] === "editor" &&
			parts[2] === "pen" &&
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parts[3]);

		return isClassicUrl || isEditorUrl ? url.href : null;
	} catch {
		return null;
	}
}

function getCodePenIframe(html, penUrl) {
	const tree = fromHtml(html, { fragment: true });
	const meaningfulChildren = tree.children.filter((child) => child.type !== "text" || child.value?.trim());
	const iframe = meaningfulChildren.length === 1 ? meaningfulChildren[0] : null;

	if (iframe?.type !== "element" || iframe.tagName !== "iframe") {
		throw new Error(`CodePen oEmbed returned invalid iframe markup for ${penUrl}`);
	}

	const src = iframe.properties?.src;
	if (typeof src !== "string") {
		throw new Error(`CodePen oEmbed returned an iframe without a source for ${penUrl}`);
	}

	try {
		const iframeUrl = new URL(src);
		if (iframeUrl.origin !== CODEPEN_ORIGIN || !iframeUrl.pathname.includes("/embed/")) throw new Error();
		return iframeUrl.href;
	} catch {
		throw new Error(`CodePen oEmbed returned an invalid iframe source for ${penUrl}`);
	}
}

async function requestCodePenMetadata(endpoint, penUrl, fetchImpl, retryDelaysMs) {
	let lastError;

	for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
		if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt - 1]));

		let response;
		try {
			response = await fetchImpl(endpoint);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			continue;
		}

		if (response.ok) return response;

		lastError = new Error(`CodePen oEmbed returned HTTP ${response.status} for ${penUrl}`);
		const isTransient = response.status === 403 || response.status === 429 || response.status >= 500;
		if (!isTransient) throw lastError;
	}

	throw new Error(`Failed to resolve CodePen metadata for ${penUrl}`, { cause: lastError });
}

async function fetchCodePenMetadata(penUrl, fetchImpl, retryDelaysMs) {
	const endpoint = new URL("/api/oembed", CODEPEN_ORIGIN);
	endpoint.searchParams.set("format", "json");
	endpoint.searchParams.set("url", penUrl);
	endpoint.searchParams.set("height", String(CODEPEN_EMBED_HEIGHT));

	const response = await requestCodePenMetadata(endpoint, penUrl, fetchImpl, retryDelaysMs);

	let metadata;
	try {
		metadata = await response.json();
	} catch (error) {
		throw new Error(`CodePen oEmbed returned invalid JSON for ${penUrl}`, { cause: error });
	}

	if (
		metadata?.success !== true ||
		typeof metadata.title !== "string" ||
		!metadata.title.trim() ||
		typeof metadata.author_name !== "string" ||
		!metadata.author_name.trim() ||
		typeof metadata.author_url !== "string" ||
		typeof metadata.html !== "string"
	) {
		throw new Error(`CodePen oEmbed returned incomplete metadata for ${penUrl}`);
	}

	const authorUrl = new URL(metadata.author_url);
	if (authorUrl.origin !== CODEPEN_ORIGIN) {
		throw new Error(`CodePen oEmbed returned an invalid author URL for ${penUrl}`);
	}

	return {
		title: metadata.title.trim(),
		authorName: metadata.author_name.trim(),
		authorUrl: authorUrl.href,
		iframeUrl: getCodePenIframe(metadata.html, penUrl),
	};
}

function scheduleCodePenRequest(request, requestIntervalMs) {
	const pending = requestQueue.then(async () => {
		const waitMs = Math.max(0, lastRequestStartedAt + requestIntervalMs - Date.now());
		if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
		lastRequestStartedAt = Date.now();
		return request();
	});

	requestQueue = pending.catch(() => undefined);
	return pending;
}

function resolveCodePenMetadata(penUrl, fetchImpl, cache, requestIntervalMs, retryDelaysMs) {
	if (!cache.has(penUrl)) {
		cache.set(
			penUrl,
			scheduleCodePenRequest(() => fetchCodePenMetadata(penUrl, fetchImpl, retryDelaysMs), requestIntervalMs),
		);
	}
	return cache.get(penUrl);
}

function buildCodePenFigure(penUrl, metadata) {
	return {
		type: "element",
		tagName: "figure",
		properties: { className: ["codepen-embed"] },
		children: [
			{
				type: "element",
				tagName: "iframe",
				properties: {
					src: metadata.iframeUrl,
					title: metadata.title,
					height: CODEPEN_EMBED_HEIGHT,
					loading: "lazy",
					allowFullScreen: true,
					style: "width: 100%; overflow: hidden; border: 0;",
				},
				children: [],
			},
			{
				type: "element",
				tagName: "figcaption",
				properties: {},
				children: [
					{ type: "text", value: "View “" },
					{
						type: "element",
						tagName: "a",
						properties: { href: penUrl },
						children: [{ type: "text", value: metadata.title }],
					},
					{ type: "text", value: "” by " },
					{
						type: "element",
						tagName: "a",
						properties: { href: metadata.authorUrl },
						children: [{ type: "text", value: metadata.authorName }],
					},
					{ type: "text", value: " on CodePen." },
				],
			},
		],
	};
}

export function createSatteriCodePenEmbedsPlugin({
	fetchImpl = globalThis.fetch,
	cache = metadataCache,
	requestIntervalMs = CODEPEN_REQUEST_INTERVAL_MS,
	retryDelaysMs = CODEPEN_RETRY_DELAYS_MS,
} = {}) {
	if (typeof fetchImpl !== "function") throw new TypeError("CodePen embeds require a fetch implementation");

	return {
		name: "satteri-codepen-embeds",
		element: {
			filter: ["p"],
			async visit(node) {
				const penUrl = getStandaloneCodePenUrl(node);
				if (!penUrl) return;

				const metadata = await resolveCodePenMetadata(penUrl, fetchImpl, cache, requestIntervalMs, retryDelaysMs);
				return buildCodePenFigure(penUrl, metadata);
			},
		},
	};
}
