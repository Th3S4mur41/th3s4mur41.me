import { expect, test } from "@playwright/test";
import { VISUAL_ROUTES } from "./targets.js";

/**
 * Waits until the page is visually settled: fonts loaded, lazy images decoded and
 * scroll-driven effects applied, so full-page screenshots are reproducible.
 */
async function settlePage(page) {
	await page.evaluate(async () => {
		await document.fonts.ready;

		// Force lazy-loaded/below-the-fold images to load before the full-page capture.
		for (const image of document.querySelectorAll("img")) {
			image.loading = "eager";
		}
		await Promise.all(
			Array.from(document.images)
				.filter((image) => !image.complete)
				.map((image) => image.decode().catch(() => undefined)),
		);

		window.scrollTo(0, document.body.scrollHeight);
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		window.scrollTo(0, 0);
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	});

	// Discarded warm-up capture: the first full-page screenshot expands the layout viewport,
	// which can shift the document height by a pixel. Doing it here keeps the compared shots stable.
	await page.screenshot({ fullPage: true });
}

test.describe("visual regression", () => {
	for (const route of VISUAL_ROUTES) {
		test(`${route.name} matches the baseline`, async ({ page }) => {
			const response = await page.goto(route.path, { waitUntil: "load" });
			expect(response?.status(), `${route.path} should be reachable`).toBe(200);

			await settlePage(page);

			await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
		});
	}
});
