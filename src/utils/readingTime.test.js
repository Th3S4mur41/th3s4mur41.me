import { describe, expect, it } from "vitest";
import { computeReadingTime } from "./readingTime.js";

describe("computeReadingTime", () => {
	it("returns undefined for empty markdown input", () => {
		expect(computeReadingTime("")).toBeUndefined();
	});

	it("returns undefined for whitespace-only markdown input", () => {
		expect(computeReadingTime("   \n\t\n  ")).toBeUndefined();
	});

	it("returns undefined when markdown contains no readable text", () => {
		// Image alt text is intentionally excluded from reading-time extraction.
		expect(computeReadingTime("![](/images/example.png)")).toBeUndefined();
	});

	it("returns stats for markdown with readable text", () => {
		const stats = computeReadingTime("# Title\n\nThis is a short article body.");

		expect(stats).toBeDefined();
		expect(stats?.words).toBeGreaterThan(0);
		expect(stats?.text).toBeTruthy();
		expect(stats?.minutes).toBeGreaterThan(0);
	});
});
