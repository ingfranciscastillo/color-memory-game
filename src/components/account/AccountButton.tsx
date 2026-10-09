import { ClientOnly, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useAccount } from "@/hooks/useAccount";
import { loadAuthProviders } from "@/lib/auth-providers";
import { m } from "@/paraglide/messages.js";
import {
	LazyAuthDialog,
	preloadAuthDialog,
	usePreloadAuthDialog,
} from "./LazyAuthDialog";

const SIZE = 32;

/** Same-size gap while the session loads (no layout jump). */
function Placeholder() {
	return <span className="block" style={{ height: SIZE }} aria-hidden="true" />;
}

function AccountButtonInner() {
	const { account, isPending } = useAccount();
	const [dialogOpen, setDialogOpen] = useState(false);

	// Preload providers so the dialog opens complete.
	useEffect(() => {
		if (!isPending && !account) void loadAuthProviders();
	}, [isPending, account]);
	usePreloadAuthDialog(!isPending && !account);

	// The dialog stays mounted while the session refetches (it does after
	// sign-up), so its step and notices survive.
	const dialog = (
		<LazyAuthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
	);

	if (isPending) {
		return (
			<>
				<Placeholder />
				{dialog}
			</>
		);
	}

	if (account) {
		return (
			<Link
				to="/profile"
				aria-label={m.account_profile_label({ name: account.name })}
				className="flex items-center gap-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
			>
				<span className="hidden max-w-40 truncate sm:inline">
					{account.name}
				</span>
				<Avatar seed={account.avatarSeed ?? account.id} size={SIZE} />
			</Link>
		);
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setDialogOpen(true)}
				onPointerEnter={preloadAuthDialog}
				onFocus={preloadAuthDialog}
				className="text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
				style={{ minHeight: SIZE }}
			>
				{m.account_sign_in()}
			</button>
			{dialog}
		</>
	);
}

/** Account entry in the header: your avatar (goes to the profile) or "Sign in". */
export function AccountButton() {
	return (
		<ClientOnly fallback={<Placeholder />}>
			<AccountButtonInner />
		</ClientOnly>
	);
}
