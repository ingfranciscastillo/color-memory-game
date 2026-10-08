import { afterEach, describe, expect, it } from "vitest";
import { overwriteGetLocale } from "@/paraglide/runtime.js";
import { formatSeconds } from "./i18n";

describe("formatSeconds", () => {
	afterEach(() => overwriteGetLocale(() => "en"));

	it("uses a decimal comma and a space in Spanish", () => {
		overwriteGetLocale(() => "es");
		expect(formatSeconds(2.5)).toBe("2,5 s");
	});

	it("uses a decimal point in English", () => {
		overwriteGetLocale(() => "en");
		expect(formatSeconds(2.5)).toBe("2.5 s");
	});

	it("always shows one decimal", () => {
		overwriteGetLocale(() => "en");
		expect(formatSeconds(3)).toBe("3.0 s");
	});
});
