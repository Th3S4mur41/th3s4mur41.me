import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PREVIEW_PORT ?? 4321);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const isCI = !!process.env.CI;

// Desktop projects share one viewport so layout diffs are comparable across engines.
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

export default defineConfig({
	testDir: "./tests/visual",
	// Baselines are engine/viewport specific but OS agnostic on purpose: they are generated
	// on Linux (CI or `npm run test:visual:update`) so the committed images match CI runs.
	snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
	fullyParallel: true,
	forbidOnly: isCI,
	timeout: 90_000,
	retries: isCI ? 1 : 0,
	workers: isCI ? 2 : undefined,
	reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
	use: {
		baseURL,
		trace: "on-first-retry",
		// All motion on the site (including scroll-driven `animation-timeline: view()` reveals) is
		// gated behind `prefers-reduced-motion: no-preference`, so this is what makes captures stable.
		reducedMotion: "reduce",
		colorScheme: "dark",
	},
	expect: {
		// Full-page captures of long articles are slow, especially in containers/CI.
		timeout: 30_000,
		toHaveScreenshot: {
			animations: "disabled",
			caret: "hide",
			scale: "css",
			// Tolerate sub-pixel antialiasing noise without hiding real layout shifts.
			maxDiffPixelRatio: 0.01,
		},
	},
	projects: [
		{
			name: "chromium-desktop",
			use: { ...devices["Desktop Chrome"], viewport: DESKTOP_VIEWPORT },
		},
		{
			name: "chromium-mobile",
			// Device pixel ratio 1 keeps long full-page captures under the 32767px engine limit.
			use: { ...devices["Pixel 7"], deviceScaleFactor: 1 },
		},
		{
			name: "webkit-mobile",
			use: { ...devices["iPhone 14"], deviceScaleFactor: 1 },
		},
		{
			name: "firefox-desktop",
			use: { ...devices["Desktop Firefox"], viewport: DESKTOP_VIEWPORT },
		},
	],
	webServer: {
		command: `npm run start:prod -- --host 127.0.0.1 --port ${PORT}`,
		url: baseURL,
		reuseExistingServer: !isCI,
		timeout: 120_000,
		env: {
			// `astro preview` auto-backgrounds itself when it detects it was launched by an AI
			// coding agent, which breaks Playwright's webServer (it needs the command to stay
			// in the foreground). This forces normal foreground behavior everywhere.
			ASTRO_PREVIEW_BACKGROUND: "1",
		},
	},
});
