import type { GameMode } from "./modes";

const KEY = "color-memory:stats:v1";

export type Stats = {
  bestScore: number;
  bestStreak: number;
  bestByMode: Partial<Record<GameMode, number>>;
  roundsPlayed: number;
  gamesCompleted: number;
};

export const emptyStats: Stats = {
  bestScore: 0,
  bestStreak: 0,
  bestByMode: {},
  roundsPlayed: 0,
  gamesCompleted: 0,
};

export function loadStats(): Stats {
  if (typeof window === "undefined") return emptyStats;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStats;
    return { ...emptyStats, ...(JSON.parse(raw) as Partial<Stats>) };
  } catch {
    return emptyStats;
  }
}

export function saveStats(stats: Stats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable */
  }
}

export function recordRound(streak: number): Stats {
  const stats = loadStats();
  const next: Stats = {
    ...stats,
    roundsPlayed: stats.roundsPlayed + 1,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
  saveStats(next);
  return next;
}

export function recordGame(mode: GameMode, totalScore: number): Stats {
  const stats = loadStats();
  const next: Stats = {
    ...stats,
    gamesCompleted: stats.gamesCompleted + 1,
    bestScore: Math.max(stats.bestScore, totalScore),
    bestByMode: {
      ...stats.bestByMode,
      [mode]: Math.max(stats.bestByMode[mode] ?? 0, totalScore),
    },
  };
  saveStats(next);
  return next;
}
