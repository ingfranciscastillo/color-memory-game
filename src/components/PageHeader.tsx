import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/seo";
import { AccountButton } from "./account/AccountButton";

/** Top bar: the name links home; `children` sits before the account entry. */
export function PageHeader({ children }: { children?: ReactNode }) {
	return (
		<header className="flex items-center justify-between gap-6">
			<Link
				to="/"
				className="text-xs uppercase tracking-[0.3em] text-muted-foreground underline-offset-4 hover:underline"
			>
				{SITE_NAME}
			</Link>
			<div className="flex items-center gap-6">
				{children}
				<AccountButton />
			</div>
		</header>
	);
}
