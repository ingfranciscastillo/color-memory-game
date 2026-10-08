import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/seo";
import { AccountButton } from "./account/AccountButton";
import { BrandMark } from "./BrandMark";

/** Top bar: the logo links home; `children` sits before the account entry. */
export function PageHeader({ children }: { children?: ReactNode }) {
	return (
		<header className="flex items-center justify-between gap-6">
			<Link
				to="/"
				className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-75"
			>
				<BrandMark size={28} />
				{SITE_NAME}
			</Link>
			<div className="flex items-center gap-6">
				{children}
				<AccountButton />
			</div>
		</header>
	);
}
