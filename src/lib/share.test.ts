import { describe, expect, it } from "vitest";
import { buildShareText } from "./share";

const base = {
	dayKey: "2026-10-08",
	scores: [95, 75, 55, 10, 90],
	total: 412,
	url: "https://colormemory.app/es",
};

describe("buildShareText", () => {
	it("turns scores into colored blocks by band", () => {
		const text = buildShareText({ ...base, locale: "es" });
		expect(text.split("\n")[1]).toBe("🟩🟨🟧🟥🟩");
	});

	it("has a Spanish header", () => {
		const text = buildShareText({ ...base, locale: "es" });
		expect(text.split("\n")[0]).toBe("Color Memory · Diario 8 oct · 412/500");
	});

	it("has an English header", () => {
		const text = buildShareText({ ...base, locale: "en" });
		expect(text.split("\n")[0]).toBe("Color Memory · Daily Oct 8 · 412/500");
	});

	it("never reveals a color", () => {
		const text = buildShareText({ ...base, locale: "es" });
		expect(text).not.toMatch(/#[0-9a-f]{3,6}/i);
		expect(text).not.toMatch(/hsl|rgb/i);
	});

	it("ends with the link", () => {
		const text = buildShareText({ ...base, locale: "en" });
		expect(text.endsWith(base.url)).toBe(true);
	});
});
