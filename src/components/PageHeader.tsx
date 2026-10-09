import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/seo";
import { AccountButton } from "./account/AccountButton";
import { BrandMark } from "./BrandMark";
import { LanguageSwitch } from "./LanguageSwitch";
import { SettingsMenu } from "./SettingsMenu";

/**
 * Top bar: the logo links home; then language, settings and the account.
 * `children` sits before them. On phones only the logo mark shows.
 */
export function PageHeader({ children }: { children?: ReactNode }) {
	return (
		<header className="relative z-20 flex items-center justify-between gap-4">
			<Link
				to="/"
				aria-label={SITE_NAME}
				className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-75"
			>
				<BrandMark size={28} />
				<span className="hidden sm:inline">{SITE_NAME}</span>
			</Link>
			<div className="flex items-center gap-2 sm:gap-3">
				{children}
				<LanguageSwitch />
				<SettingsMenu />
				<AccountButton />
			</div>
		</header>
	);
}
