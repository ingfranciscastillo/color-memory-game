/**
 * Account emails (sign-in code, verification, password reset), sent with
 * Resend. Only used from src/lib/auth.ts, on the server.
 *
 * Without RESEND_API_KEY (development) the email is printed to the console
 * instead, so every flow can be tried without configuring anything.
 */

import { Resend } from "resend";
import { m } from "@/paraglide/messages.js";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Color Memory <onboarding@resend.dev>";
const resend = apiKey ? new Resend(apiKey) : null;

interface EmailContent {
	to: string;
	subject: string;
	/** Body paragraphs, plain text. */
	lines: string[];
	/** Optional button with a link. */
	action?: { label: string; url: string };
	/** Optional large code (sign-in with a code). */
	code?: string;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function toHtml({ lines, action, code }: EmailContent): string {
	const paragraphs = lines
		.map((line) => `<p style="margin:0 0 16px">${escapeHtml(line)}</p>`)
		.join("");
	const codeBlock = code
		? `<p style="margin:0 0 16px;font:300 36px/1 ui-monospace,monospace;letter-spacing:10px">${escapeHtml(code)}</p>`
		: "";
	const button = action
		? `<p style="margin:0 0 16px"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:14px 28px;background:#020618;color:#fff;text-decoration:none;font-size:12px;letter-spacing:4px;text-transform:uppercase">${escapeHtml(action.label)}</a></p>`
		: "";
	return `<div style="font:16px/1.5 system-ui,sans-serif;color:#020618;max-width:480px">${paragraphs}${codeBlock}${button}<p style="margin:24px 0 0;color:#62748e;font-size:13px">${escapeHtml(m.email_footer())}</p></div>`;
}

function toText({ lines, action, code }: EmailContent): string {
	return [
		...lines,
		...(code ? [code] : []),
		...(action ? [`${action.label}: ${action.url}`] : []),
	].join("\n\n");
}

export async function sendEmail(content: EmailContent): Promise<void> {
	if (!resend) {
		console.info(
			`[email not sent: missing RESEND_API_KEY] To ${content.to} · ${content.subject}\n${toText(content)}`,
		);
		return;
	}
	const { error } = await resend.emails.send({
		from,
		to: content.to,
		subject: content.subject,
		html: toHtml(content),
		text: toText(content),
	});
	if (error) console.error("Could not send email:", error.message);
}
