import { describe, expect, it } from "vitest";
import { colorFamily, colorName } from "./color-name";

const LOCALES = ["en", "es"] as const;

describe("colorName", () => {
	it("is deterministic", () => {
		const color = { h: 12, s: 76, l: 54 };
		expect(colorName(color, "es")).toBe(colorName(color, "es"));
		expect(colorName(color, "en")).toBe(colorName(color, "en"));
	});

	it("changes with the language", () => {
		const color = { h: 12, s: 76, l: 54 };
		expect(colorName(color, "en")).not.toBe(colorName(color, "es"));
	});

	it("names grays and extremes as neutral", () => {
		for (const color of [
			{ h: 0, s: 0, l: 50 },
			{ h: 200, s: 40, l: 2 },
			{ h: 200, s: 40, l: 98 },
		]) {
			expect(colorFamily(color)).toBe("neutral");
			for (const locale of LOCALES) {
				expect(colorName(color, locale).length).toBeGreaterThan(0);
			}
		}
	});

	it("covers every hue and lightness band", () => {
		for (let h = 0; h < 360; h += 15) {
			for (const l of [15, 50, 85]) {
				for (const locale of LOCALES) {
					const name = colorName({ h, s: 70, l }, locale);
					expect(name.trim()).not.toBe("");
					expect(name).not.toContain("undefined");
				}
			}
		}
	});

	it("is a noun plus a qualifier", () => {
		for (const locale of LOCALES) {
			const name = colorName({ h: 207, s: 53, l: 51 }, locale);
			expect(name.split(" ").length).toBeGreaterThanOrEqual(2);
		}
	});
});
