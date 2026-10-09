import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { LazyAuthDialog } from "@/components/account/LazyAuthDialog";
import { PageHeader } from "@/components/PageHeader";
import { CollectionGrid } from "@/components/swatch/CollectionGrid";
import { useAccount } from "@/hooks/useAccount";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages.js";

export const Route = createFileRoute("/profile")({
	head: () => ({
		meta: [
			{ title: m.profile_title() },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: ProfilePage,
});

const LABEL = "text-xs text-ink-muted";
const LINK =
	"text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline";

function ProfilePage() {
	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-10 sm:px-10 sm:py-16">
			<PageHeader />
			<h1 className="mt-12 text-4xl font-bold tracking-tight">
				{m.profile_heading()}
			</h1>
			<ProfileBody />
		</main>
	);
}

function ProfileBody() {
	const { account, isPending, refetch } = useAccount();
	const [signInOpen, setSignInOpen] = useState(false);

	// Kept mounted while the session refetches (it does after sign-up).
	const dialog = (
		<LazyAuthDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
	);

	if (isPending) return dialog;

	if (!account) {
		return (
			<div className="mt-10 animate-rise-in space-y-8">
				<p className="text-sm text-ink-muted">{m.profile_signed_out()}</p>
				<button
					type="button"
					onClick={() => setSignInOpen(true)}
					className="rounded-xl bg-ink px-6 py-3 font-semibold text-paper transition-opacity hover:opacity-80"
				>
					{m.account_sign_in()}
				</button>
				{dialog}
			</div>
		);
	}

	return (
		<AccountForm
			key={account.id}
			account={account}
			onChange={() => void refetch()}
		/>
	);
}

interface AccountFormProps {
	account: {
		id: string;
		name: string;
		email: string;
		avatarSeed?: string | null;
		showInLeaderboard?: boolean | null;
	};
	onChange: () => void;
}

function AccountForm({ account, onChange }: AccountFormProps) {
	const ids = useId();
	const navigate = useNavigate();
	const [name, setName] = useState(account.name);
	const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
	const [error, setError] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	// "Saved" fades back to the button after a moment.
	useEffect(() => {
		if (status !== "saved") return;
		const timer = setTimeout(() => setStatus("idle"), 2000);
		return () => clearTimeout(timer);
	}, [status]);

	const seed = account.avatarSeed ?? account.id;
	const trimmed = name.trim();
	const nameChanged = trimmed !== account.name;

	const rerollAvatar = async () => {
		setError(null);
		const { error } = await authClient.updateUser({
			avatarSeed: crypto.randomUUID(),
		});
		if (error) setError(m.profile_error());
		else onChange();
	};

	const saveName = async () => {
		setStatus("saving");
		setError(null);
		const { error } = await authClient.updateUser({ name: trimmed });
		if (error) {
			setStatus("idle");
			setError(m.profile_error());
			return;
		}
		setStatus("saved");
		onChange();
	};

	const toggleLeaderboard = async (visible: boolean) => {
		setError(null);
		const { error } = await authClient.updateUser({
			showInLeaderboard: visible,
		});
		if (error) setError(m.profile_error());
		else onChange();
	};

	const signOut = async () => {
		await authClient.signOut();
		await navigate({ to: "/" });
	};

	const deleteAccount = async () => {
		setConfirmDelete(false);
		const { error } = await authClient.deleteUser();
		if (error) {
			// Better Auth asks for a recent sign-in before deleting.
			setError(m.profile_delete_reauth());
			return;
		}
		await navigate({ to: "/" });
	};

	return (
		<div className="mt-10 animate-rise-in">
			<div className="flex items-center gap-6">
				<Avatar seed={seed} size={72} />
				<button type="button" onClick={rerollAvatar} className={LINK}>
					{m.profile_new_avatar()}
				</button>
			</div>

			<form
				className="mt-12 space-y-2"
				onSubmit={(event) => {
					event.preventDefault();
					if (nameChanged) void saveName();
				}}
			>
				<label htmlFor={`${ids}-name`} className={LABEL}>
					{m.profile_name()}
				</label>
				<div className="flex gap-3">
					<input
						id={`${ids}-name`}
						required
						minLength={2}
						maxLength={24}
						autoComplete="nickname"
						aria-describedby={`${ids}-name-hint`}
						value={name}
						onChange={(event) => setName(event.target.value)}
						className="min-w-0 flex-1 rounded-lg border border-input bg-card px-4 py-3 text-sm transition-colors focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink focus-visible:outline-none"
					/>
					<button
						type="submit"
						disabled={!nameChanged || status === "saving"}
						className="rounded-lg bg-ink px-5 font-semibold text-paper transition-opacity hover:opacity-80 disabled:opacity-45 disabled:hover:opacity-45"
					>
						{status === "saved" ? m.profile_saved() : m.profile_save()}
					</button>
				</div>
				<p id={`${ids}-name-hint`} className="text-xs text-ink-muted">
					{m.profile_name_hint()}
				</p>
			</form>

			<dl className="mt-10 border-y border-border py-4">
				<div className="flex items-baseline justify-between gap-6">
					<dt className={LABEL}>{m.profile_email()}</dt>
					<dd className="truncate text-sm">{account.email}</dd>
				</div>
			</dl>

			<label className="mt-10 flex cursor-pointer items-start gap-4">
				<input
					type="checkbox"
					role="switch"
					aria-checked={Boolean(account.showInLeaderboard)}
					checked={Boolean(account.showInLeaderboard)}
					onChange={(event) => void toggleLeaderboard(event.target.checked)}
					aria-describedby={`${ids}-leaderboard-hint`}
					className="mt-0.5 size-4 accent-foreground"
				/>
				<span className="space-y-1">
					<span className="block text-xs font-semibold">
						{m.profile_leaderboard()}
					</span>
					<span
						id={`${ids}-leaderboard-hint`}
						className="block text-xs text-ink-muted"
					>
						{m.profile_leaderboard_hint()}
					</span>
				</span>
			</label>

			<section aria-labelledby={`${ids}-collection`} className="mt-12">
				<h2 id={`${ids}-collection`} className="text-lg font-semibold">
					{m.collection_title()}
				</h2>
				<div className="mt-3">
					<CollectionGrid userId={account.id} />
				</div>
			</section>

			{error && (
				<p role="alert" className="mt-6 text-sm text-destructive">
					{error}
				</p>
			)}

			<div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
				<button type="button" onClick={signOut} className={LINK}>
					{m.profile_sign_out()}
				</button>
				{!confirmDelete ? (
					<button
						type="button"
						onClick={() => setConfirmDelete(true)}
						className={`${LINK} hover:text-destructive`}
					>
						{m.profile_delete()}
					</button>
				) : null}
			</div>

			{confirmDelete && (
				<div
					role="alertdialog"
					aria-labelledby={`${ids}-delete`}
					className="mt-8 animate-step-in space-y-6 border border-destructive p-6"
				>
					<p id={`${ids}-delete`} className="text-sm">
						{m.profile_delete_confirm()}
					</p>
					<div className="flex flex-wrap items-center gap-6">
						<button
							type="button"
							onClick={deleteAccount}
							className="rounded-xl bg-destructive px-6 py-3 font-semibold text-destructive-foreground transition-opacity hover:opacity-80"
						>
							{m.profile_delete_yes()}
						</button>
						<button
							type="button"
							// biome-ignore lint/a11y/noAutofocus: the safe choice gets focus first.
							autoFocus
							onClick={() => setConfirmDelete(false)}
							className={LINK}
						>
							{m.profile_cancel()}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
