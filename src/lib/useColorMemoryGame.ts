import { useCallback, useEffect, useRef, useState } from "react";
import { generateNearColor, generateTargetColor, type HSL } from "./color";
import {
	difficultyFor,
	type GameMode,
	memorizeSeconds,
	roundsForMode,
} from "./modes";
import { type RoundScore, scoreGuess } from "./scoring";
import { loadStats, recordGame, recordRound, type Stats } from "./storage";

export type Phase = "memorize" | "recreate" | "result" | "final";

const MISS_LIMIT = 3;
const PASS_SCORE = 50;

export function useColorMemoryGame(mode: GameMode) {
	const [phase, setPhase] = useState<Phase>("memorize");
	const [roundIndex, setRoundIndex] = useState(0);
	const [target, setTarget] = useState<HSL | null>(null);
	const [guess, setGuess] = useState<HSL>({ h: 200, s: 50, l: 50 });
	const [result, setResult] = useState<RoundScore | null>(null);
	const [remaining, setRemaining] = useState(3);
	const [totalScore, setTotalScore] = useState(0);
	const [bestRound, setBestRound] = useState(0);
	const [streak, setStreak] = useState(0);
	const [maxStreak, setMaxStreak] = useState(0);
	const [roundsPlayed, setRoundsPlayed] = useState(0);
	const [stats, setStats] = useState<Stats | null>(null);
	const misses = useRef(0);
	const lastTarget = useRef<HSL | null>(null);

	const totalRounds = roundsForMode(mode);

	const startRound = useCallback(
		(index: number) => {
			const difficulty = difficultyFor(mode, index);
			const next =
				mode === "precision" && lastTarget.current
					? generateNearColor(lastTarget.current, difficulty)
					: generateTargetColor(difficulty);
			lastTarget.current = next;
			setTarget(next);
			setResult(null);
			setGuess({ h: Math.round(Math.random() * 360), s: 50, l: 50 });
			setRemaining(memorizeSeconds(mode, index));
			setRoundIndex(index);
			setPhase("memorize");
		},
		[mode],
	);

	const reset = useCallback(() => {
		misses.current = 0;
		lastTarget.current = null;
		setTotalScore(0);
		setBestRound(0);
		setStreak(0);
		setMaxStreak(0);
		setRoundsPlayed(0);
		startRound(0);
	}, [startRound]);

	// Kick off the first round on the client only (colors are random).
	useEffect(() => {
		reset();
		setStats(loadStats());
	}, [reset]);

	// Memorize countdown
	useEffect(() => {
		if (phase !== "memorize" || !target) return;
		const duration = memorizeSeconds(mode, roundIndex) * 1000;
		const startedAt = Date.now();
		const id = window.setInterval(() => {
			const left = duration - (Date.now() - startedAt);
			if (left <= 0) {
				window.clearInterval(id);
				setRemaining(0);
				setPhase("recreate");
			} else {
				setRemaining(left / 1000);
			}
		}, 50);
		return () => window.clearInterval(id);
	}, [phase, target, mode, roundIndex]);

	const check = useCallback(() => {
		if (!target || phase !== "recreate") return;
		const scored = scoreGuess(target, guess);
		const nextStreak = scored.score >= PASS_SCORE ? streak + 1 : 0;
		if (scored.score < PASS_SCORE) misses.current += 1;

		setResult(scored);
		setTotalScore((t) => t + scored.score);
		setBestRound((b) => Math.max(b, scored.score));
		setStreak(nextStreak);
		setMaxStreak((m) => Math.max(m, nextStreak));
		setRoundsPlayed((r) => r + 1);
		setStats(recordRound(Math.max(maxStreak, nextStreak)));
		setPhase("result");
	}, [target, guess, phase, streak, maxStreak]);

	const finish = useCallback(() => {
		setStats(recordGame(mode, totalScore));
		setPhase("final");
	}, [mode, totalScore]);

	const next = useCallback(() => {
		const played = roundIndex + 1;
		const outOfRounds = played >= totalRounds;
		const tooManyMisses = mode === "endless" && misses.current >= MISS_LIMIT;
		if (outOfRounds || tooManyMisses) {
			setStats(recordGame(mode, totalScore));
			setPhase("final");
			return;
		}
		startRound(played);
	}, [roundIndex, totalRounds, mode, totalScore, startRound]);

	return {
		phase,
		roundIndex,
		totalRounds,
		target,
		guess,
		setGuess,
		result,
		remaining,
		totalScore,
		bestRound,
		streak,
		maxStreak,
		roundsPlayed,
		stats,
		misses: misses.current,
		check,
		next,
		finish,
		reset,
	};
}
