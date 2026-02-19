# Running crew

2D runner prototype built with Phaser 3 and Vite.

## Features

- Avatar selection scene (4 characters)
- Main running scene with party system (up to 20 members)
- Coin/item spawn and collection system
- Magnet / Auto Run / Sprint toggles
- HP drain + recharge (potion)
- Rain effect (auto/manual toggle)
- Speech bubbles + team shout buttons (`가자!`, `화이팅!`)
- Canvas pause/resume button
- WebAudio-generated BGM/SFX
- Split layout:
  - Left: game canvas (top) + game HUD (bottom)
  - Right: Google Map panel

## Tech Stack

- Phaser 3
- Vite
- TypeScript (migrated from JS; gradual typing mode)
- Tailwind CSS (CDN in `index.html`)

## Project Structure

```text
src/
  main.ts
  scenes/
    AvatarSelectScene.ts
    RunningMainScene.ts
  systems/
    AudioSystem.ts
  vite-env.d.ts
public/
  assets/
```

## Requirements

- Node.js 18+
- pnpm (recommended)

## Install

```bash
pnpm install
```

## Run (Dev)

```bash
pnpm dev
```

Open the local URL shown in terminal (usually `http://localhost:5173`).

## Build

```bash
pnpm build
```

## Type Check

```bash
pnpm typecheck
```

## Controls

### Keyboard / Touch

- `Left / Right` : move background direction
- `Space` : jump
- `Shift` : sprint (2x speed)
- `R` : HP recharge (uses coin)
- Touch: move right (double touch/fast touch = sprint)

### In-game Buttons

- Canvas (left bottom): `가자!`, `화이팅!`, `일시중지/재개`
- HUD (left bottom panel): Potion, Magnet, Auto, Shift, Rain

## Assets

- Character sheets: `public/assets/characters/*`
- Background: `public/assets/1.webp`
- Optional extra assets can be added under `public/assets/`

## Notes

- WebAudio BGM/SFX starts after first user interaction (browser autoplay policy).
- `tsconfig.json` is currently set for gradual migration:
  - `allowJs: true`
  - `strict: false`
