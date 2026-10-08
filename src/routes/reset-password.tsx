import { createFileRoute, Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages.js";

/**
 * New password: reached from the "Forgot it?" email link. Better Auth adds
 * ?token=… when redirecting here.
 */
export const Route = createFileRoute("/reset-password")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: typeof search.token === "string" ? search.token : undefined,
		error: typeof search.error === "string" ? search.error : undefined,
	}),
	head: () => ({
		meta: [{ title: m.reset_title() }, { name: "robots", content: "noindex" }],
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const ids = useId();
	const { token, error: linkError } = Route.useSearch();
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
		"idle",
	);

	const invalid = !token || Boolean(linkError);

	const submit = async () => {
		if (!token) return;
		setStatus("saving");
		const { error } = await authClient.resetPassword({
			newPassword: password,
			token,
		});
		setStatus(error ? "error" : "done");
	};

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-10 sm:px-10 sm:py-16">
			<PageHeader />
			<h1 className="mt-16 text-4xl font-light uppercase tracking-[0.2em]">
				{m.reset_heading()}
			</h1>

			<div className="mt-10 animate-rise-in">
				{invalid ? (
					<p className="text-sm text-muted-foreground">{m.reset_invalid()}</p>
				) : status === "done" ? (
					<div className="space-y-8">
						<p className="text-sm">{m.reset_done()}</p>
						<Link
							to="/"
							className="inline-block bg-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] text-background transition-opacity hover:opacity-80"
						>
							{m.final_home()}
						</Link>
					</div>
				) : (
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void submit();
						}}
					>
						<label
							htmlFor={`${ids}-password`}
							className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
						>
							{m.reset_label()}
						</label>
						<input
							id={`${ids}-password`}
							type="password"
							required
							minLength={8}
							autoComplete="new-password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							className="w-full border border-input bg-background px-4 py-3 text-sm transition-colors focus-visible:border-foreground focus-visible:outline-none"
						/>
						<button
							type="submit"
							disabled={status === "saving"}
							className="bg-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] text-background transition-opacity hover:opacity-80 disabled:opacity-60"
						>
							{m.reset_save()}
						</button>
						{status === "error" && (
							<p role="alert" className="text-sm text-destructive">
								{m.reset_error()}
							</p>
						)}
					</form>
				)}
			</div>
		</main>
	);
}
