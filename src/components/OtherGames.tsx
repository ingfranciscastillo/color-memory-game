import { m } from "@/paraglide/messages.js";

const GAMES = [
	{
		name: "Palabreo",
		url: "https://palabreo.app",
		icon: "/games/palabreo.png",
		description: m.other_games_palabreo,
	},
];

/**
 * A quiet card for the author's other games, at the end of the home screen
 * (never during a game). Opens in a new tab so the game isn't lost.
 */
export function OtherGames() {
	return (
		<section aria-labelledby="other-games" className="mx-auto w-full max-w-sm">
			<h2 id="other-games" className="text-center text-xs text-ink-muted">
				{m.other_games_title()}
			</h2>
			<ul className="mt-3 space-y-2">
				{GAMES.map((game) => (
					<li key={game.name}>
						<a
							href={game.url}
							target="_blank"
							rel="noopener"
							className="group flex items-center gap-3 rounded-xl bg-card p-3 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-card-lifted)"
						>
							<img
								src={game.icon}
								alt=""
								width={44}
								height={44}
								loading="lazy"
								className="size-11 shrink-0 rounded-lg"
							/>
							<span className="min-w-0 flex-1">
								<span className="block font-semibold">{game.name}</span>
								<span className="block text-sm text-ink-muted">
									{game.description()}
								</span>
							</span>
							<span
								aria-hidden="true"
								className="text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
							>
								↗
							</span>
							<span className="sr-only">{m.other_games_new_tab()}</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
