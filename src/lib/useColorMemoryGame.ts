import { useCallback, useEffect, useRef, useState } from "react";
import { m } from "@/paraglide/messages.js";
import { finishGame, nextRound, startGame, submitGuess } from "@/server/games";
import type {
	AnsweredRound,
	GameTotals,
	GameView,
	GuessResult,
} from "@/server/games-store";
import { authClient } from "./auth-client";
import type { HSL } from "./color";
import { type GameMode, roundsForMode } from "./modes";
import { withViewTransition } from "./view-transition";

export type Phase =
	| "loading"
	| "memorize"
	| "recreate"
	| "result"
	| "final"
	| "error";

const EMPTY_TOTALS: GameTotals = {
	totalScore: 0,
	roundsPlayed: 0,
	misses: 0,
	streak: 0,
	maxStreak: 0,
	bestRound: 0,
};

const randomGuess = (): HSL => ({
	h: Math.round(Math.random() * 360),
	s: 50,
	l: 50,
});

/** Every game is played on the server: make sure there's a session first. */
async function ensureSession() {
	const { data } = await authClient.getSession();
	if (data) return;
	const { error } = await authClient.signIn.anonymous();
	if (error) throw new Error(m.error_no_session());
}

/** Server errors carry a message for the player; anything else is the network. */
const messageOf = (error: unknown) =>
	error instanceof Error && error.message ? error.message : m.error_network();

/**
 * A game against the server. The server sends each target, times the round
 * and scores the guess; this hook only drives the phases on screen.
 */
export function useColorMemoryGame(mode: GameMode) {
	const [phase, setPhase] = useState<Phase>("loading");
	const [gameId, setGameId] = useState<string | null>(null);
	const [roundIndex, setRoundIndex] = useState(0);
	const [target, setTarget] = useState<HSL | null>(null);
	const [guess, setGuess] = useState<HSL>(randomGuess);
	const [result, setResult] = useState<GuessResult | null>(null);
	const [remaining, setRemaining] = useState(0);
	/** The round's full memorize time, in seconds (for the timer line). */
	const [duration, setDuration] = useState(0);
	/** Answered rounds of this game, in order (round strip, final palette). */
	const [history, setHistory] = useState<AnsweredRound[]>([]);
	const [totals, setTotals] = useState<GameTotals>(EMPTY_TOTALS);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	/** The daily challenge was already finished before this visit. */
	const [alreadyPlayed, setAlreadyPlayed] = useState(false);
	const deadline = useRef(0);
	const retry = useRef<() => void>(() => {});

	const totalRounds = roundsForMode(mode);

	/** Runs a server call; on failure shows the error with a retry. */
	const call = useCallback(async (action: () => Promise<void>) => {
		setBusy(true);
		setError(null);
		try {
			await action();
		} catch (thrown) {
			retry.current = () => void call(action);
			setError(messageOf(thrown));
			setPhase((current) => (current === "loading" ? "error" : current));
		} finally {
			setBusy(false);
		}
	}, []);

	const applyView = useCallback(
		async (view: GameView, fresh: boolean): Promise<void> => {
			setGameId(view.id);
			setTotals(view.totals);
			setHistory(view.answered);
			if (view.finished) {
				setAlreadyPlayed(!fresh);
				setPhase("final");
				return;
			}
			if (!view.round) {
				// Between rounds (e.g. reloaded on the result screen): start the next.
				return applyView(await nextRound({ data: { id: view.id } }), fresh);
			}
			const { round } = view;
			withViewTransition(() => {
				setRoundIndex(round.index);
				setResult(null);
				setGuess(randomGuess());
				setDuration(round.memorizeMs / 1000);
				if (round.target && round.msLeft > 0) {
					setTarget(round.target);
					setRemaining(round.msLeft / 1000);
					deadline.current = performance.now() + round.msLeft;
					setPhase("memorize");
				} else {
					// Memorize time ran out while away: no second look at the color.
					setTarget(null);
					setPhase("recreate");
				}
			});
		},
		[],
	);

	const start = useCallback(
		() =>
			call(async () => {
				setPhase("loading");
				setAlreadyPlayed(false);
				setHistory([]);
				await ensureSession();
				const view = await startGame({ data: { mode } });
				// A daily game with answered rounds is being resumed, not started.
				await applyView(view, view.totals.roundsPlayed === 0);
			}),
		[call, applyView, mode],
	);

	// Colors come from the server: start on the client only.
	useEffect(() => {
		void start();
	}, [start]);

	// Memorize countdown, from the time left the server reported.
	useEffect(() => {
		if (phase !== "memorize") return;
		const id = window.setInterval(() => {
			const left = deadline.current - performance.now();
			if (left <= 0) {
				window.clearInterval(id);
				withViewTransition(() => {
					setRemaining(0);
					setPhase("recreate");
				});
			} else {
				setRemaining(left / 1000);
			}
		}, 50);
		return () => window.clearInterval(id);
	}, [phase]);

	const check = useCallback(() => {
		if (!gameId || phase !== "recreate" || busy) return;
		void call(async () => {
			const scored = await submitGuess({
				data: { id: gameId, index: roundIndex, guess },
			});
			withViewTransition(() => {
				setResult(scored);
				setTarget(scored.target);
				setTotals(scored.totals);
				setHistory((rounds) => [
					...rounds,
					{
						index: roundIndex,
						target: scored.target,
						guess: scored.guess,
						score: scored.result.score,
					},
				]);
				setPhase("result");
			});
		});
	}, [gameId, phase, busy, call, roundIndex, guess]);

	const next = useCallback(() => {
		if (!gameId || busy) return;
		if (result?.finished) {
			setPhase("final");
			return;
		}
		void call(async () => {
			await applyView(await nextRound({ data: { id: gameId } }), true);
		});
	}, [gameId, busy, result, call, applyView]);

	const finish = useCallback(() => {
		if (!gameId || busy) return;
		void call(async () => {
			const view = await finishGame({ data: { id: gameId } });
			setTotals(view.totals);
			setHistory(view.answered);
			setPhase("final");
		});
	}, [gameId, busy, call]);

	return {
		phase,
		roundIndex,
		totalRounds,
		target,
		guess,
		setGuess,
		result,
		remaining,
		duration,
		history,
		...totals,
		busy,
		error,
		alreadyPlayed,
		retry: () => retry.current(),
		check,
		next,
		finish,
		reset: start,
	};
}
