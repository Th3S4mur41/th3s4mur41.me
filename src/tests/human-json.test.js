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
import Ajv from "ajv";
import { describe, expect, it } from "vitest";

const HUMAN_JSON_PATH = resolve(import.meta.dirname, "../../public/human.json");
const SCHEMA_PATH = resolve(import.meta.dirname, "./schemas/human-json.schema.json");

describe("human.json conformance", () => {
	let humanJson;
	let schema;
	let validate;

	// Load and parse files
	it("should load human.json and schema", () => {
		const jsonData = readFileSync(HUMAN_JSON_PATH, "utf-8");
		humanJson = JSON.parse(jsonData);
		expect(humanJson).toBeDefined();

		const schemaData = readFileSync(SCHEMA_PATH, "utf-8");
		schema = JSON.parse(schemaData);
		expect(schema).toBeDefined();
	});

	// Compile the schema with Ajv
	it("should compile schema with Ajv", () => {
		const ajv = new Ajv();
		// Remove $schema reference and format validators to avoid meta-schema and format issues
		const schemaToCompile = JSON.parse(JSON.stringify(schema));
		delete schemaToCompile.$schema;
		// Remove format keywords to prevent Ajv from needing external format validators
		const removeFormats = (obj) => {
			if (obj && typeof obj === "object") {
				delete obj.format;
				Object.values(obj).forEach(removeFormats);
			}
		};
		removeFormats(schemaToCompile);
		validate = ajv.compile(schemaToCompile);
		expect(validate).toBeDefined();
	});

	// Validate against the schema
	it("should conform to human.json schema v0.1.1", () => {
		const isValid = validate(humanJson);
		if (!isValid) {
			const errors = validate.errors.map((err) => `${err.instancePath || "root"} ${err.message}`).join("; ");
			throw new Error(`human.json schema validation failed: ${errors}`);
		}
		expect(isValid).toBe(true);
	});

	// Practical checks: version and file format
	it("should have version 0.1.1", () => {
		expect(humanJson.version).toBe("0.1.1");
	});

	it("should have a valid URL", () => {
		expect(humanJson.url).toBeDefined();
		expect(typeof humanJson.url).toBe("string");
		try {
			new URL(humanJson.url);
		} catch {
			throw new Error(`Invalid URL in human.json: ${humanJson.url}`);
		}
	});

	// Validate file is parseable JSON
	it("human.json should be valid JSON", () => {
		const content = readFileSync(HUMAN_JSON_PATH, "utf-8");
		expect(() => JSON.parse(content)).not.toThrow();
	});
});
