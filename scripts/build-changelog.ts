/// <reference types="node" />
/**
 * Writes CHANGELOG.md (Keep a Changelog format) from src/content/changelog.ts,
 * the same source as the /changelog page, so GitHub's and the game's never
 * drift apart. In English, like the README.
 *
 * Usage: pnpm changelog              → writes CHANGELOG.md
 *        pnpm changelog --notes 1.1  → prints that version's notes (releases)
 *
 * Runs with Node's built-in TypeScript support: no build step.
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	CHANGELOG,
	type ChangeKind,
	type ChangelogEntry,
} from "../src/content/changelog.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SECTIONS: { kind: ChangeKind; title: string }[] = [
	{ kind: "added", title: "Added" },
	{ kind: "improved", title: "Changed" },
	{ kind: "fixed", title: "Fixed" },
];

function releaseNotes(entry: ChangelogEntry): string {
	return SECTIONS.map(({ kind, title }) => {
		const items = entry.changes.filter((change) => change.kind === kind);
		if (items.length === 0) return null;
		return [`### ${title}`, "", ...items.map((c) => `- ${c.text.en}`)].join(
			"\n",
		);
	})
		.filter(Boolean)
		.join("\n\n");
}

function changelog(): string {
	return [
		"# Changelog",
		"",
		"What's new in Color Memory, for players. This file is generated with",
		"`pnpm changelog` from `src/content/changelog.ts`; edit that file, not this one.",
		"",
		"The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).",
		"",
		...CHANGELOG.flatMap((entry) => [
			`## ${entry.version} - ${entry.date}`,
			"",
			releaseNotes(entry),
			"",
		]),
	].join("\n");
}

const notesIndex = process.argv.indexOf("--notes");
if (notesIndex !== -1) {
	const version = process.argv[notesIndex + 1];
	const entry = CHANGELOG.find((item) => item.version === version);
	if (!entry) throw new Error(`No version ${version} in the changelog`);
	process.stdout.write(`${releaseNotes(entry)}\n`);
} else {
	await writeFile(join(ROOT, "CHANGELOG.md"), changelog(), "utf8");
	console.log("CHANGELOG.md updated");
}
