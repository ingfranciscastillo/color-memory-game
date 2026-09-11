<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="Color Memory logo" />
</p>

<h1 align="center">Color Memory</h1>

<p align="center">
  A minimal color memory game. See a color, memorize it, rebuild it — scored in perceptual color space.
</p>

## About

Color Memory flashes a color full-screen for a few seconds, then asks you to recreate it from memory using
a hue/saturation/lightness picker. Your guess is scored against the target using perceptual (OKLab) distance
rather than raw HSL difference, so a "close" answer actually looks close to a human eye.

The whole game runs client-side — no backend, no accounts. Best scores and streaks persist to `localStorage`.

## Features

- **Four game modes**, each stressing a different part of visual memory:

  | Mode | Rounds | What changes |
  | --- | --- | --- |
  | Classic | 8 | 3 seconds to memorize each color |
  | Speed | 8 | Memorize time shrinks every round, down to 0.5s |
  | Precision | 8 | Fixed time, but each target color drifts closer to the last one |
  | Endless | Unlimited | Keeps going until you miss 3 rounds |

- **Perceptual scoring** — guesses are compared in OKLab space, not raw HSL, so the score reflects how a
  color actually *looks*, not just its numeric distance.
- **Per-channel feedback** — after each round, see exactly how far off your hue, saturation, and lightness
  were.
- **Streaks and best scores**, tracked locally and shown on the home screen.
- **Custom HSL color picker** — pointer-driven saturation/lightness pad plus a hue slider, no external
  color-picker dependency.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React, SSR) with file-based routing via [TanStack Router](https://tanstack.com/router)
- [Tailwind CSS](https://tailwindcss.com/) v4 for styling, with an OKLCH design-token theme
- [Biome](https://biomejs.dev/) for linting and formatting
- [Vite](https://vite.dev/) + [Nitro](https://nitro.build/) for the build and server runtime
- Deployed on [Vercel](https://vercel.com/)

## Getting started

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` | Lint with Biome |
| `pnpm format` | Format with Biome |
| `pnpm check` | Run Biome's combined lint + format check |

## Project structure

```
src/
  routes/          File-based routes (/, /play)
  components/       Gameplay UI (ColorPicker, MemorizePhase, ResultPanel, FinalScore)
  lib/
    color.ts        HSL/OKLab color math and color generation
    modes.ts         Game mode definitions and difficulty curves
    scoring.ts       Perceptual score calculation
    storage.ts       localStorage stats persistence
    useColorMemoryGame.ts  Round/phase state machine
```

## Deploy to Vercel

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New > Project** and import the repo.
3. Keep the detected TanStack Start framework settings — `vercel.json` makes framework detection explicit.
4. Deploy.

> [!NOTE]
> `src/lib/seo.ts` holds a placeholder `SITE_URL` used for canonical links, Open Graph tags, and the sitemap.
> Update it to your real production domain before (or right after) deploying.
