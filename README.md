# X // LAB.

> An editorial **Neo-Brutalist digital laboratory** showcasing premium high-contrast stickers and conceptual future gear.

A single-page experience built around a stark Swiss grid, monospace typography, and high-contrast accents (`#8F1D14` crimson / `#F89D13` volcanic orange on a `#E6DEDD` paper base). Browse the catalog, open technical spec sheets, build a cart with a simulated encrypted checkout receipt, and play in an interactive sticker customizer — all with native WebAudio feedback synth.

## Features

- **Editorial catalog** — filterable grid of stickers and "future gear", each with a slide-in technical spec drawer.
- **Cart & checkout simulation** — add/remove/adjust quantities and generate a printable, AES-256-flavored receipt manifest.
- **Sticker sandbox** — drop decals onto a virtual laptop lid, then rotate, scale, and layer them in real time.
- **Feedback synthesizer** — zero-dependency WebAudio beeps on every interaction (toggleable).
- **Live UTC clock** and animated marquee status ticker.

## Tech Stack

| Item | Detail |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | [`motion`](https://motion.dev) (Framer Motion) |
| Icons | `lucide-react` |

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure environment
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run clean` | Clear the Next.js cache |

## Environment Variables

Defined in `.env.local` (see `.env.example`):

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini API key for server-side AI calls |
| `APP_URL` | Public URL where the app is hosted |

## Project Structure

```
app/            # App Router entry — layout, page, global styles
src/assets/     # Generated product imagery
hooks/          # Reusable React hooks
lib/            # Utilities (cn() class merger)
```
