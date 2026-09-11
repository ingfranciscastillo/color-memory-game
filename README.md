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

  | Mode      | Rounds    | What changes                                                    |
  | --------- | --------- | --------------------------------------------------------------- |
  | Classic   | 8         | 3 seconds to memorize each color                                |
  | Speed     | 8         | Memorize time shrinks every round, down to 0.5s                 |
  | Precision | 8         | Fixed time, but each target color drifts closer to the last one |
  | Endless   | Unlimited | Keeps going until you miss 3 rounds                             |

- **Perceptual scoring** — guesses are compared in OKLab space, not raw HSL, so the score reflects how a
  color actually _looks_, not just its numeric distance.
- **Per-channel feedback** — after each round, see exactly how far off your hue, saturation, and lightness
  were.
- **Streaks and best scores**, tracked locally and shown on the home screen.
- **Custom HSL color picker** — pointer-driven saturation/lightness pad plus a hue slider, no external
  color-picker dependency.
