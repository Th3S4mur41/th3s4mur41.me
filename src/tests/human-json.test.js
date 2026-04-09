/**
 * human.json specification conformance tests.
 *
 * Validates that public/human.json conforms to the human.json protocol v0.1.1.
 * Schema reference: https://codeberg.org/robida/human.json/src/branch/main/schema/0.1.1.json
 *
 * Prerequisites: human.json must exist in the public directory.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const HUMAN_JSON_PATH = resolve(import.meta.dirname, "../../public/human.json");
const SCHEMA_PATH = resolve(import.meta.dirname, "./schemas/human-json.schema.json");

// Helper to validate ISO 8601 date format (YYYY-MM-DD)
function isValidISODate(dateString) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
	const date = new Date(dateString + "T00:00:00Z");
	return date instanceof Date && !isNaN(date);
}

// Helper to validate URL format
function isValidURL(urlString) {
	try {
		new URL(urlString);
		return true;
	} catch {
		return false;
	}
}

describe("human.json conformance", () => {
	let humanJson;
	let schema;

	// Load files
	it("should load human.json and schema", () => {
		const data = readFileSync(HUMAN_JSON_PATH, "utf-8");
		humanJson = JSON.parse(data);
		expect(humanJson).toBeDefined();

		const schemaData = readFileSync(SCHEMA_PATH, "utf-8");
		schema = JSON.parse(schemaData);
		expect(schema).toBeDefined();
	});

	// Validate structure
	describe("required fields", () => {
		it("should have version field", () => {
			expect(humanJson).toHaveProperty("version");
		});

		it("should have url field", () => {
			expect(humanJson).toHaveProperty("url");
		});
	});

	// Validate field types
	describe("field types", () => {
		it("version should be a string", () => {
			expect(typeof humanJson.version).toBe("string");
		});

		it("version should be exactly 0.1.1", () => {
			expect(humanJson.version).toBe("0.1.1");
		});

		it("url should be a string", () => {
			expect(typeof humanJson.url).toBe("string");
		});

		it("url should be a valid URI", () => {
			expect(isValidURL(humanJson.url)).toBe(true);
		});

		it("vouches (if present) should be an array", () => {
			if (humanJson.vouches !== undefined) {
				expect(Array.isArray(humanJson.vouches)).toBe(true);
			}
		});
	});

	// Validate vouch entries if present
	describe("vouches validation", () => {
		it("each vouch should have url and vouched_at", () => {
			if (!humanJson.vouches) return;

			humanJson.vouches.forEach((vouch, index) => {
				expect(vouch, `vouch[${index}] missing url`).toHaveProperty("url");
				expect(vouch, `vouch[${index}] missing vouched_at`).toHaveProperty("vouched_at");
			});
		});

		it("each vouch url should be a valid URI", () => {
			if (!humanJson.vouches) return;

			humanJson.vouches.forEach((vouch, index) => {
				expect(isValidURL(vouch.url)).toBe(true, `vouch[${index}].url is not a valid URI: ${vouch.url}`);
			});
		});

		it("each vouch vouched_at should be ISO 8601 date (YYYY-MM-DD)", () => {
			if (!humanJson.vouches) return;

			humanJson.vouches.forEach((vouch, index) => {
				expect(isValidISODate(vouch.vouched_at)).toBe(
					true,
					`vouch[${index}].vouched_at is not in YYYY-MM-DD format: ${vouch.vouched_at}`,
				);
			});
		});

		it("vouches should not have extra properties", () => {
			if (!humanJson.vouches) return;

			humanJson.vouches.forEach((vouch, index) => {
				const allowedKeys = ["url", "vouched_at"];
				const extraKeys = Object.keys(vouch).filter((k) => !allowedKeys.includes(k));
				expect(extraKeys).toHaveLength(0, `vouch[${index}] has unexpected properties: ${extraKeys.join(", ")}`);
			});
		});
	});

	// Validate root level doesn't have extra properties
	describe("no additional properties", () => {
		it("should only have version, url, and vouches at root", () => {
			const allowedKeys = ["version", "url", "vouches"];
			const extraKeys = Object.keys(humanJson).filter((k) => !allowedKeys.includes(k));
			expect(extraKeys).toHaveLength(0, `human.json has unexpected root properties: ${extraKeys.join(", ")}`);
		});
	});

	// Ensure the file is valid JSON
	it("human.json should be valid JSON", () => {
		const content = readFileSync(HUMAN_JSON_PATH, "utf-8");
		// If we got here without throwing, it's valid JSON
		expect(content).toBeTruthy();
	});

	// Log version info
	it("should be version 0.1.1 per spec", () => {
		expect(schema.properties.version.const).toBe("0.1.1");
		expect(humanJson.version).toBe(schema.properties.version.const);
	});
});
