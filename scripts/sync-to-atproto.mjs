#!/usr/bin/env node

import { readdir, readFile, realpath } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import { AtpAgent } from "@atproto/api";
import matter from "gray-matter";
import { SITE_CONFIG } from "../src/utils/config.js";
import {
	SITE_STANDARD_DOCUMENT_COLLECTION,
	toSiteStandardDocumentRkey,
	toSiteStandardDocumentUri,
} from "../src/utils/siteStandard.js";

const DEFAULTS = {
	contentDir: "content/blog",
	siteUrl: "https://th3s4mur41.me",
	publicationFile: "public/well-known/site.standard.publication.json",
	identifier: "th3s4mur41.me",
};

const DOCUMENT_COLLECTION = SITE_STANDARD_DOCUMENT_COLLECTION;

function parseArgs(argv) {
	const args = {
		dryRun: false,
		force: false,
		postSlug: undefined,
		skipAuth: false,
		contentDir: process.env.ATPROTO_CONTENT_DIR ?? DEFAULTS.contentDir,
		siteUrl: process.env.ATPROTO_SITE_URL ?? DEFAULTS.siteUrl,
		identifier: process.env.ATPROTO_IDENTIFIER ?? DEFAULTS.identifier,
		service: process.env.ATPROTO_SERVICE,
		publicationUri: process.env.ATPROTO_PUBLICATION_URI ?? SITE_CONFIG.atproto?.publicationUri,
	};

	for (const arg of argv) {
		if (arg === "--dry-run") args.dryRun = true;
		else if (arg === "--force") args.force = true;
		else if (arg === "--skip-auth") args.skipAuth = true;
		else if (arg.startsWith("--post=")) args.postSlug = arg.slice("--post=".length).trim();
		else if (arg.startsWith("--content-dir=")) args.contentDir = arg.slice("--content-dir=".length).trim();
		else if (arg.startsWith("--site-url=")) args.siteUrl = arg.slice("--site-url=".length).trim();
		else if (arg.startsWith("--identifier=")) args.identifier = arg.slice("--identifier=".length).trim();
		else if (arg.startsWith("--service=")) args.service = arg.slice("--service=".length).trim();
		else if (arg.startsWith("--publication-uri=")) {
			args.publicationUri = arg.slice("--publication-uri=".length).trim();
		}
	}

	return args;
}

function normalizePath(pathValue) {
	if (!pathValue || typeof pathValue !== "string") return undefined;
	let value = pathValue.trim();
	if (!value) return undefined;
	if (!value.startsWith("/")) value = `/${value}`;
	if (value.length > 1 && value.endsWith("/")) value = value.slice(0, -1);
	return value;
}

async function resolveContentDir(contentDir) {
	const safeRoot = await realpath(resolve(process.cwd(), "content"));
	const candidate = await realpath(resolve(process.cwd(), contentDir));
	if (candidate !== safeRoot && !candidate.startsWith(`${safeRoot}${sep}`)) {
		throw new Error(`Invalid content directory: ${contentDir}`);
	}
	return candidate;
}

function toIsoDate(value) {
	if (!value) return undefined;
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
}

function arraysEqual(left = [], right = []) {
	if (left.length !== right.length) return false;
	for (let i = 0; i < left.length; i += 1) {
		if (left[i] !== right[i]) return false;
	}
	return true;
}

function normalizeTags(input) {
	if (!Array.isArray(input)) return undefined;
	const tags = input.map((tag) => (typeof tag === "string" ? tag.trim() : "")).filter(Boolean);
	return tags.length > 0 ? tags : undefined;
}

function isSeriesContainerSlug(slug, allSlugs) {
	return allSlugs.some((candidate) => candidate !== slug && candidate.startsWith(`${slug}/`));
}

function getSlugFromFile(contentDir, filePath) {
	const rel = relative(contentDir, filePath).replaceAll("\\", "/");
	const ext = extname(rel);
	const relWithoutExt = rel.slice(0, -ext.length);
	if (basename(relWithoutExt) === "index") {
		return dirname(relWithoutExt).replaceAll("\\", "/");
	}
	return relWithoutExt;
}

function createDocumentFromPost(post, siteField) {
	return {
		$type: DOCUMENT_COLLECTION,
		site: siteField,
		title: post.title,
		publishedAt: post.publishedAt,
		path: post.path,
		description: post.description,
		updatedAt: post.updatedAt,
		tags: post.tags,
	};
}

function stripUndefined(record) {
	return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function hasDocumentChanged(existingRecord, nextRecord) {
	const left = {
		site: existingRecord.site,
		title: existingRecord.title,
		publishedAt: existingRecord.publishedAt,
		path: normalizePath(existingRecord.path),
		description: existingRecord.description,
		updatedAt: existingRecord.updatedAt,
		tags: normalizeTags(existingRecord.tags) ?? [],
	};
	const right = {
		site: nextRecord.site,
		title: nextRecord.title,
		publishedAt: nextRecord.publishedAt,
		path: normalizePath(nextRecord.path),
		description: nextRecord.description,
		updatedAt: nextRecord.updatedAt,
		tags: normalizeTags(nextRecord.tags) ?? [],
	};

	return !(
		left.site === right.site &&
		left.title === right.title &&
		left.publishedAt === right.publishedAt &&
		left.path === right.path &&
		left.description === right.description &&
		left.updatedAt === right.updatedAt &&
		arraysEqual(left.tags, right.tags)
	);
}

async function findMarkdownFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findMarkdownFiles(entryPath)));
			continue;
		}

		if (entry.isFile() && [".md", ".mdx"].includes(extname(entry.name))) {
			files.push(entryPath);
		}
	}

	return files;
}

async function loadPosts(contentDir, postSlug) {
	const files = await findMarkdownFiles(contentDir);
	const discoveredPosts = [];

	for (const filePath of files) {
		const raw = await readFile(filePath, "utf8");
		const { data } = matter(raw);
		const slug = getSlugFromFile(contentDir, filePath);

		if (postSlug && slug !== postSlug) continue;

		const published = data.published !== false && data.draft !== true;
		if (!published) continue;

		if (typeof data.title !== "string" || !data.title.trim()) {
			console.warn(`Skipping ${slug || filePath}: missing title`);
			continue;
		}

		const publishedAt = toIsoDate(data.date);
		if (!publishedAt) {
			console.warn(`Skipping ${slug || filePath}: invalid date`);
			continue;
		}

		const updatedAt = toIsoDate(data.updated);
		const description = typeof data.description === "string" ? data.description.trim() : undefined;
		const path = normalizePath(`/blog/${slug}`);

		discoveredPosts.push({
			slug,
			rkey: toSiteStandardDocumentRkey(slug),
			path,
			title: data.title.trim(),
			publishedAt,
			updatedAt,
			description,
			tags: normalizeTags(data.tags),
		});
	}

	const allSlugs = discoveredPosts.map((post) => post.slug);
	const posts = discoveredPosts.filter((post) => !isSeriesContainerSlug(post.slug, allSlugs));

	posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
	return posts;
}

async function resolvePublicationUri(configuredUri, publicationFile) {
	if (configuredUri) return configuredUri;

	try {
		const raw = await readFile(publicationFile, "utf8");
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed.uri === "string" && parsed.uri.startsWith("at://")) {
			return parsed.uri;
		}
	} catch {
		// Optional fallback file.
	}

	return undefined;
}

async function listAllDocuments(agent, did) {
	let cursor;
	const docs = [];

	do {
		const response = await agent.api.com.atproto.repo.listRecords({
			repo: did,
			collection: DOCUMENT_COLLECTION,
			limit: 100,
			cursor,
		});

		docs.push(...response.data.records);
		cursor = response.data.cursor;
	} while (cursor);

	return docs;
}

async function resolveDidFromIdentifier(identifier) {
	if (identifier.startsWith("did:")) return identifier;

	const url = new URL("https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle");
	url.searchParams.set("handle", identifier);

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to resolve handle to DID (${response.status}): ${identifier}`);
	}

	const data = await response.json();
	if (!data?.did || typeof data.did !== "string") {
		throw new Error(`Invalid DID response while resolving handle: ${identifier}`);
	}

	return data.did;
}

async function resolvePdsServiceFromDid(did) {
	const url = `https://plc.directory/${encodeURIComponent(did)}`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch DID document (${response.status}): ${did}`);
	}

	const didDoc = await response.json();
	const services = Array.isArray(didDoc?.service) ? didDoc.service : [];
	const pdsService = services.find(
		(service) => service?.type === "AtprotoPersonalDataServer" || service?.id === "#atproto_pds",
	);

	const endpoint = pdsService?.serviceEndpoint;
	if (!endpoint || typeof endpoint !== "string") {
		throw new Error(`No AtprotoPersonalDataServer endpoint found in DID document: ${did}`);
	}

	return endpoint;
}

function buildLookupMaps(records) {
	const byPath = new Map();

	for (const record of records) {
		const value = record.value ?? {};
		const path = normalizePath(value.path);
		if (path) byPath.set(path, record);
	}

	return { byPath };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const appPassword = process.env.ATPROTO_APP_PASSWORD;
	const publicationUri = await resolvePublicationUri(args.publicationUri, DEFAULTS.publicationFile);
	const siteField = publicationUri ?? args.siteUrl;

	console.log("Starting ATProto blog sync");
	if (args.dryRun) console.log("Dry run enabled, no remote changes will be written");

	const contentDir = await resolveContentDir(args.contentDir);
	const posts = await loadPosts(contentDir, args.postSlug);
	console.log(`Loaded ${posts.length} published post(s) from ${contentDir}`);

	if (posts.length === 0) {
		console.log("No eligible posts found, nothing to do");
		return;
	}

	if ((args.dryRun && args.skipAuth) || !appPassword) {
		if (!appPassword) {
			console.log("ATPROTO_APP_PASSWORD not set, showing local dry-run preview only");
		}

		for (const post of posts) {
			console.log(`• Would sync ${post.path}`);
		}
		return;
	}

	const service = args.service ?? (await resolvePdsServiceFromDid(await resolveDidFromIdentifier(args.identifier)));

	const agent = new AtpAgent({ service });
	const session = await agent.login({
		identifier: args.identifier,
		password: appPassword,
	});
	const did = session.data.did;

	console.log(`Authenticated as ${args.identifier} (${did})`);
	console.log(`Using PDS service: ${service}`);
	console.log(`Using site field: ${siteField}`);

	const existingRecords = await listAllDocuments(agent, did);
	const { byPath } = buildLookupMaps(existingRecords);
	console.log(`Found ${existingRecords.length} existing document record(s)`);

	const stats = {
		created: 0,
		updated: 0,
		skipped: 0,
		errors: 0,
	};

	for (const post of posts) {
		try {
			const nextRecord = stripUndefined(createDocumentFromPost(post, siteField));
			const existing = byPath.get(post.path);
			const desiredUri = toSiteStandardDocumentUri(did, post.slug);

			if (existing) {
				if (existing.uri !== desiredUri) {
					if (!args.force) {
						stats.skipped += 1;
						console.warn(`• Skip ${post.path} (existing URI differs: ${existing.uri})`);
						console.warn("  Re-run with --force to migrate this record to deterministic URI format.");
						continue;
					}

					const previousRkey = existing.uri.split("/").at(-1);
					if (!previousRkey) throw new Error(`Missing rkey for existing record ${existing.uri}`);

					if (args.dryRun) {
						stats.updated += 1;
						console.log(`• Would migrate ${post.path} (${existing.uri} -> ${desiredUri})`);
						continue;
					}

					await agent.api.com.atproto.repo.deleteRecord({
						repo: did,
						collection: DOCUMENT_COLLECTION,
						rkey: previousRkey,
					});

					const recreateResponse = await agent.api.com.atproto.repo.createRecord({
						repo: did,
						collection: DOCUMENT_COLLECTION,
						rkey: post.rkey,
						record: nextRecord,
					});

					stats.updated += 1;
					console.log(`• Migrated ${post.path} (${recreateResponse.data.uri})`);
					continue;
				}

				if (!args.force && !hasDocumentChanged(existing.value ?? {}, nextRecord)) {
					stats.skipped += 1;
					console.log(`• Skip ${post.path} (unchanged)`);
					continue;
				}

				const rkey = existing.uri.split("/").at(-1);
				if (!rkey) throw new Error(`Missing rkey for existing record ${existing.uri}`);

				if (args.dryRun) {
					stats.updated += 1;
					console.log(`• Would update ${post.path} (${existing.uri})`);
					continue;
				}

				const response = await agent.api.com.atproto.repo.putRecord({
					repo: did,
					collection: DOCUMENT_COLLECTION,
					rkey,
					record: nextRecord,
				});

				stats.updated += 1;
				console.log(`• Updated ${post.path} (${response.data.uri})`);
				continue;
			}

			if (args.dryRun) {
				stats.created += 1;
				console.log(`• Would create ${post.path}`);
				continue;
			}

			const response = await agent.api.com.atproto.repo.createRecord({
				repo: did,
				collection: DOCUMENT_COLLECTION,
				rkey: post.rkey,
				record: nextRecord,
			});

			stats.created += 1;
			console.log(`• Created ${post.path} (${response.data.uri})`);
		} catch (error) {
			stats.errors += 1;
			const message = error instanceof Error ? error.message : String(error);
			console.error(`• Error ${post.path}: ${message}`);
		}
	}

	console.log("Summary");
	console.log(`  created: ${stats.created}`);
	console.log(`  updated: ${stats.updated}`);
	console.log(`  skipped: ${stats.skipped}`);
	console.log(`  errors:  ${stats.errors}`);

	if (stats.errors > 0) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
	console.error(message);
	process.exit(1);
});
